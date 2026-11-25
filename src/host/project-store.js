import { join, basename, resolve } from 'node:path';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { readJson, readJsonLines, readJsonLinesTail, writeJson, writeJsonLines, appendJsonLine } from './util/json.js';
import { withFileLock, withLock } from './util/atomic.js';

const SIDECAR = '.dsh_RA';
const DAY = 24 * 3600 * 1000;

const TERMINAL_PROPOSAL_STATUSES = new Set([
  'confirmed',
  'auto',
  'abandoned',
  'answered',
  'target-changed',
  'expired',
  'failed',
]);

const DEFAULT_SETTINGS = {
  layout: 'vertical',
  raModel: null,
  indexModel: null,
  defaultSessionModel: null,
  // How the Host treats an `ask` proposal while auto mode is on:
  // keep = still ask the user, suggest = auto-answer with the first option,
  // decide = forbid asking and force the RA to pick route/fork/new.
  autoAsk: 'keep',
  trackingDays: 7,
  composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
};

const AUTO_ASK_VALUES = new Set(['keep', 'suggest', 'decide']);

const DEFAULT_STATE = (project) => ({
  version: 1,
  project,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  raSessionId: null,
  tracking: { days: 7 },
  stopped: {},
  pinned: {},
  lineage: {},
  titles: {},
  settings: structuredClone(DEFAULT_SETTINGS),
  onboarding: {
    status: 'awaiting',
    total: 0,
    done: 0,
    startedAt: null,
    completedAt: null,
    current: null,
    failed: [],
  },
  summary: {},
});

/**
 * One project's `.dsh_RA` sidecar.
 *
 * Everything the Router knows that is not already in DSH's session logs lives
 * here: tracking decisions, generated briefs, proposals, dispatch history,
 * settings, and probe diagnostics. Writes are atomic and serialized per
 * project both in-process and across DSH Hosts (Desktop plus `dsh web`) that
 * serve the same directory. The directory is intentionally project-local, not
 * a DSH storage domain, and ships a `.gitignore` so it does not pollute the
 * repository.
 */
export class ProjectStore {
  constructor(cwd, options = {}) {
    this.project = resolve(cwd);
    this.root = join(this.project, SIDECAR);
    this.statePath = join(this.root, 'state.json');
    this.sessionsDir = join(this.root, 'sessions');
    this.proposalsDir = join(this.root, 'proposals');
    this.diagnosticsDir = join(this.root, 'diagnostics');
    this.historyPath = join(this.root, 'dispatch.jsonl');
    this.maxHistory = Math.max(10, Math.min(1000, Number(options.maxHistory) || 100));
    this.state = null;
    this.stateMtime = null;
    this.ready = null;
    this.historyAppends = 0;
    this.lastPrunedProposals = 0;
  }

  async ensure() {
    if (!this.ready) {
      this.ready = this.initialize().catch((error) => {
        this.ready = null;
        this.state = null;
        throw error;
      });
    }
    return this.ready;
  }

  async initialize() {
    await mkdir(this.root, { recursive: true });
    await mkdir(this.sessionsDir, { recursive: true });
    await mkdir(this.proposalsDir, { recursive: true });
    await mkdir(this.diagnosticsDir, { recursive: true });
    const ignore = join(this.root, '.gitignore');
    const ignoreText = '*\n';
    try {
      // The directory ignores itself, so `git status` stays clean even before
      // the user adds `.dsh_RA/` to the repository's root ignore file.
      await writeFile(ignore, ignoreText, { flag: 'wx' });
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      // Older plugin versions kept `!.gitignore`, which made git report the
      // directory as untracked. Upgrade that one file in place.
      const current = await readFile(ignore, 'utf8').catch(() => '');
      if (current !== ignoreText) await writeFile(ignore, ignoreText).catch(() => {});
    }

    let stored = null;
    let corrupt = false;
    try {
      const text = await readFile(this.statePath, 'utf8');
      stored = JSON.parse(text);
    } catch (error) {
      if (error?.code !== 'ENOENT') corrupt = true;
    }
    if (corrupt) {
      // Keep the broken file for diagnosis instead of silently replacing it.
      await rename(this.statePath, `${this.statePath}.corrupt-${Date.now()}`).catch(() => {});
    }
    this.state = this.normalize(stored);
    if (stored !== null && typeof stored === 'object' && !Array.isArray(stored)) {
      this.stateMtime = await this.mtimeOf();
    } else {
      // Do not write defaults here. Two Hosts can initialize the same project
      // concurrently; a blind default write would race a first real update.
      // The first update (under both locks) creates the file from the merged
      // state.
      this.stateMtime = null;
    }
  }

  normalize(stored) {
    const base = DEFAULT_STATE(this.project);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return base;
    const settings = {
      ...base.settings,
      ...(stored.settings ?? {}),
      composer: { ...base.settings.composer, ...(stored.settings?.composer ?? {}) },
    };
    // Older sidecars kept the tracking window under `state.tracking.days`.
    // Keep following it until the user saves the new setting.
    if (!stored.settings || !Object.hasOwn(stored.settings, 'trackingDays')) {
      settings.trackingDays = Number(stored.tracking?.days) || base.settings.trackingDays;
    }
    if (!AUTO_ASK_VALUES.has(settings.autoAsk)) settings.autoAsk = 'keep';
    const onboarding = { ...base.onboarding, ...(stored.onboarding ?? {}) };
    // `idle` was the old name for “first run not started yet”. It used to start
    // indexing automatically; now the user has to confirm it explicitly.
    if (onboarding.status === 'idle') onboarding.status = 'awaiting';
    // `lastSeen` was written on every collect but never read. Drop it from
    // upgraded sidecars instead of carrying dead state forward.
    const rest = { ...stored };
    delete rest.lastSeen;
    return {
      ...base,
      ...rest,
      project: this.project,
      tracking: { ...base.tracking, ...(stored.tracking ?? {}) },
      stopped: { ...(stored.stopped ?? {}) },
      pinned: { ...(stored.pinned ?? {}) },
      lineage: { ...(stored.lineage ?? {}) },
      titles: { ...(stored.titles ?? {}) },
      settings,
      onboarding,
      summary: { ...(stored.summary ?? {}) },
    };
  }

  async mtimeOf() {
    const info = await stat(this.statePath).catch(() => null);
    return info ? info.mtimeMs : null;
  }

  async writeState() {
    this.state.updatedAt = new Date().toISOString();
    await writeJson(this.statePath, this.state);
    this.stateMtime = await this.mtimeOf();
  }

  /** Reload the cached state when another Host has written it. */
  async refreshIfChanged() {
    const mtime = await this.mtimeOf();
    if (mtime === null || mtime === this.stateMtime) return;
    try {
      this.state = this.normalize(JSON.parse(await readFile(this.statePath, 'utf8')));
      this.stateMtime = mtime;
    } catch {
      // A concurrent writer is mid-rename or the file is corrupt; keep the
      // last known state and let the next write repair it.
    }
  }

  async read() {
    await this.ensure();
    await this.refreshIfChanged();
    return this.state;
  }

  async update(mutator) {
    await this.ensure();
    return withLock(this.root, () =>
      withFileLock(this.root, async () => {
        let stored = null;
        try {
          stored = JSON.parse(await readFile(this.statePath, 'utf8'));
        } catch {
          // Keep the current in-memory state when the file is missing or torn.
        }
        if (stored && typeof stored === 'object' && !Array.isArray(stored)) this.state = this.normalize(stored);
        const next = await mutator(this.state);
        if (next !== undefined) this.state = next;
        await this.writeState();
        return this.state;
      }),
    );
  }

  async setSettings(patch) {
    return this.update((state) => {
      state.settings = {
        ...state.settings,
        ...patch,
        composer: { ...state.settings.composer, ...(patch.composer ?? {}) },
      };
    });
  }

  async setRASession(sessionId) {
    return this.update((state) => {
      state.raSessionId = sessionId;
    });
  }

  async stopSession(sessionId, extra = {}) {
    return this.update((state) => {
      state.stopped[sessionId] = {
        at: new Date().toISOString(),
        reason: extra.reason ?? 'manual',
        ...(extra.parentSessionId ? { parentSessionId: extra.parentSessionId } : {}),
      };
    });
  }

  async restoreSession(sessionId) {
    return this.update((state) => {
      delete state.stopped[sessionId];
    });
  }

  async recordLineage(childId, parentId, { pin = false } = {}) {
    if (!parentId && !pin) return;
    return this.update((state) => {
      if (parentId) state.lineage[childId] = parentId;
      // A fork created by the Router is current activity even when its
      // inherited log ends days ago; pin it so the 7-day window cannot hide
      // the child the user just asked for.
      if (pin) state.pinned[childId] = true;
    });
  }

  async setTitle(sessionId, title, source = 'manual') {
    return this.update((state) => {
      state.titles[sessionId] = { title, source, updatedAt: new Date().toISOString() };
    });
  }

  async onboarding(patch) {
    return this.update((state) => {
      state.onboarding = { ...state.onboarding, ...patch };
    });
  }

  async mergeSummaries(entries) {
    if (!entries || Object.keys(entries).length === 0) return;
    const now = new Date().toISOString();
    return this.update((state) => {
      for (const [sessionId, summary] of Object.entries(entries)) {
        state.summary[sessionId] = { ...summary, updatedAt: now };
      }
    });
  }

  async markSummary(sessionId, summary) {
    return this.update((state) => {
      state.summary[sessionId] = {
        ...(state.summary[sessionId] ?? {}),
        ...summary,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /** Prune derived state for sessions the project no longer has. */
  async pruneStateKeep(keepIds) {
    return this.update((state) => {
      for (const id of Object.keys(state.summary)) {
        if (!keepIds.has(id)) delete state.summary[id];
      }
    });
  }

  briefPath(sessionId) {
    const safe = String(sessionId ?? '');
    // Session ids come from the Host, but a single separator would escape the
    // same-project directory this store owns.
    if (!safe || safe === '.' || safe === '..' || safe !== basename(safe)) {
      throw new Error('invalid session id');
    }
    return join(this.sessionsDir, `${safe}.json`);
  }

  async getBrief(sessionId) {
    return readJson(this.briefPath(sessionId), null);
  }

  async listBriefs() {
    await this.ensure();
    const files = await readdir(this.sessionsDir).catch(() => []);
    const out = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const brief = await readJson(join(this.sessionsDir, file), null);
      if (brief) out.push(brief);
    }
    return out;
  }

  async saveBrief(brief) {
    await this.ensure();
    await writeJson(this.briefPath(brief.sessionId), brief);
    // The derived state.summary row is written in one batch by collect();
    // writing the whole state for every brief would multiply poll I/O.
    return brief;
  }

  async deleteBrief(sessionId) {
    await rm(this.briefPath(sessionId), { force: true }).catch(() => {});
  }

  /**
   * Delete briefs for sessions the project no longer has. Recent files are
   * kept so a brief built just before a list refresh is not dropped.
   */
  async pruneBriefs(keepIds) {
    await this.ensure();
    const files = await readdir(this.sessionsDir).catch(() => []);
    const cutoff = Date.now() - 3600_000;
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const id = file.slice(0, -'.json'.length);
      if (keepIds.has(id)) continue;
      const full = join(this.sessionsDir, file);
      const info = await stat(full).catch(() => null);
      if (!info || info.mtimeMs > cutoff) continue;
      await rm(full, { force: true }).catch(() => {});
    }
  }

  proposalPath(token) {
    const safe = String(token ?? '');
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(safe)) throw new Error('invalid proposal token');
    return join(this.proposalsDir, `${safe}.json`);
  }

  async getProposal(token) {
    return readJson(this.proposalPath(token), null);
  }

  async saveProposal(proposal) {
    await this.ensure();
    return writeJson(this.proposalPath(proposal.token), proposal);
  }

  async listProposals() {
    await this.ensure();
    const files = await readdir(this.proposalsDir).catch(() => []);
    const out = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const proposal = await readJson(join(this.proposalsDir, file), null);
      if (proposal) out.push(proposal);
    }
    return out;
  }

  /**
   * Compare-and-set one proposal under both locks.
   *
   * Confirmation, boundary changes, answers, and abandonment all mutate a
   * proposal after reading it; two HTTP requests must not both observe
   * `pending` and both execute. The mutator returns the next proposal, or
   * `null` to leave it untouched.
   *
   * @param {string} token Proposal token.
   * @param {(proposal: object) => object | null | Promise<object | null>} mutate
   * @returns {Promise<object | null>} the written proposal, or null.
   */
  async mutateProposal(token, mutate) {
    await this.ensure();
    return withLock(this.root, () =>
      withFileLock(this.root, async () => {
        const current = await readJson(this.proposalPath(token), null);
        if (!current) return null;
        const next = await mutate(current);
        if (!next) return null;
        await writeJson(this.proposalPath(token), next);
        return next;
      }),
    );
  }

  /**
   * Remove terminal proposals older than the given age. Called periodically
   * so a long-lived project does not accumulate one file per routing decision.
   *
   * @param {number} maxAgeMs Maximum retained age for terminal proposals.
   * @returns {Promise<number>} number of removed files.
   */
  async pruneProposals(maxAgeMs = 7 * DAY) {
    await this.ensure();
    return withLock(this.root, () =>
      withFileLock(this.root, async () => {
        const proposals = await this.listProposals();
        let removed = 0;
        for (const proposal of proposals) {
          if (!TERMINAL_PROPOSAL_STATUSES.has(proposal.status)) continue;
          const at = Number(proposal.executedAt ?? proposal.createdAt ?? 0);
          if (!at || Date.now() - at <= maxAgeMs) continue;
          await rm(this.proposalPath(proposal.token), { force: true }).catch(() => {});
          removed += 1;
        }
        return removed;
      }),
    );
  }

  async appendHistory(row) {
    await this.ensure();
    await withLock(this.root, () =>
      withFileLock(this.root, async () => {
        await appendJsonLine(this.historyPath, row);
        this.historyAppends += 1;
        if (this.historyAppends % 32 === 0) await this.compactHistory();
      }),
    );
  }

  async compactHistory() {
    const rows = await readJsonLines(this.historyPath).catch(() => []);
    if (rows.length <= this.maxHistory) return;
    await writeJsonLines(this.historyPath, rows.slice(-this.maxHistory));
  }

  async history(limit = 100) {
    const capped = Math.max(1, Math.min(1000, Number(limit) || 100));
    const rows = await readJsonLinesTail(this.historyPath, 2 * 1024 * 1024);
    return rows.slice(-capped);
  }

  async writeProbe(probe) {
    await this.ensure();
    await writeJson(join(this.diagnosticsDir, 'probe.json'), probe);
  }

  dispose() {}
}
