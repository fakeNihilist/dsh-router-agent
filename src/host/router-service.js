import { basename, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { HttpError } from './http.js';
import { probeBlockers, probeHost } from './probe.js';
import { ProjectStore } from './project-store.js';
import { SessionReader, sameProject } from './session-reader.js';
import { BriefPipeline } from './brief/summarize.js';
import { buildForest } from './lineage.js';
import { readJson } from './util/json.js';
import { redactSecrets } from './util/redact.js';

const DAY = 24 * 3600 * 1000;
const TERMINAL = new Set(['confirmed', 'auto', 'abandoned', 'answered', 'target-changed', 'expired', 'failed']);
const TREE_BOUNDARY_LIMIT = 100;
const RA_TREE_BOUNDARY_LIMIT = 30;
const RA_BRIEF_BOUNDARY_LIMIT = 200;
const PROPOSAL_PRUNE_AGE = 7 * DAY;
const PROJECT_PRUNE_INTERVAL = 10 * 60 * 1000;
const PROJECT_OPS = new Set([
  'ask',
  'confirm',
  'choose',
  'abandon',
  'answer',
  'detail',
  'compress',
  'stop',
  'restore',
  'settings',
  'rename',
  'untracked',
  'allSessions',
  'tracking',
  'raMode',
  'history',
  'onboarding',
  'manual',
  'retry',
  'retarget',
  'cancelTask',
]);

const AUTO_ASK_VALUES = new Set(['keep', 'suggest', 'decide']);

const low = (value) => (typeof value === 'string' ? value.toLowerCase() : '');

/** This Host's auto-mode policy for an RA `ask` proposal. */
function autoAskPolicy(settings) {
  const value = settings?.autoAsk;
  return AUTO_ASK_VALUES.has(value) ? value : 'keep';
}

/**
 * Host-side Router owner.
 *
 * One service instance serves every project in the process. Per-project state
 * lives in `ProjectStore` instances keyed by cwd; this class owns the shared
 * session reader, RA lookup, proposal validation/execution, and probe reporting.
 */
export class RouterService {
  constructor(ctx, config = {}) {
    this.ctx = ctx;
    this.config = {
      firstRunDays: 7,
      summaryConcurrency: 2,
      summaryDebounceMs: 1200,
      summaryTimeoutMs: 45000,
      summaryUseLlm: true,
      summaryDelayMs: 0,
      maxHistory: 100,
      autoSummaryMaxInputTokens: 8000,
      proposalTtlMs: 600000,
      dev: false,
      ...config,
    };
    this.probe = probeHost(ctx);
    this.reader = new SessionReader(ctx, this.config);
    this.stores = new Map();
    this.pipelines = new Map();
    this.activeTasks = new Map();
    this.modelCache = { at: 0, catalog: null };
    this.raIdCache = new Map();
    this.blankCache = new Map();
    this.turnTimers = new Map();
    this.indexing = new Set();
    this.workspaceRepaired = new Set();
    this.lastPrunedAt = 0;
    this.disposed = false;
  }

  dispose() {
    this.disposed = true;
    for (const pipeline of this.pipelines.values()) pipeline.dispose();
    for (const store of this.stores.values()) store.dispose?.();
    this.pipelines.clear();
    this.stores.clear();
    for (const timer of this.turnTimers.values()) clearTimeout(timer);
    this.turnTimers.clear();
    this.workspaceRepaired.clear();
  }

  refreshProbe() {
    this.probe = probeHost(this.ctx);
    return this.probe;
  }

  async probeReport() {
    const probe = this.refreshProbe();
    return { ok: true, probe, blockers: probeBlockers(probe) };
  }

  taskKey(project) {
    return resolve(project).toLowerCase();
  }

  activeTask(project) {
    return this.activeTasks.get(this.taskKey(project)) ?? null;
  }

  /** Clear the active slot only when it still names this exact task. */
  clearActiveTask(project, task, raSessionId = null) {
    const key = this.taskKey(project);
    const active = this.activeTasks.get(key);
    if (!active) return;
    if (active.task !== task) return;
    if (raSessionId && active.raSessionId && active.raSessionId !== raSessionId) return;
    this.activeTasks.delete(key);
  }

  /**
   * Validate the project a write operation may touch.
   *
   * A listed project (has visible sessions) or an existing sidecar (a project
   * whose sessions disappeared but whose proposals/history remain) is valid.
   * An arbitrary path is rejected so an API caller cannot create `.dsh_RA` or
   * a DSH Session in any writable directory.
   */
  async requireProject(project) {
    if (typeof project !== 'string' || !project.trim()) {
      throw new HttpError(400, 'bad-project', 'project is required.');
    }
    const resolved = resolve(project);
    const projects = await this.listProjects();
    if (projects.some((row) => sameProject(row.project, resolved))) return resolved;
    const sidecar = await stat(join(resolved, '.dsh_RA', 'state.json')).then(
      () => true,
      () => false,
    );
    if (sidecar) return resolved;
    throw new HttpError(404, 'project-not-found', `Unknown project "${resolved}".`);
  }

  storeFor(project) {
    const key = resolve(project);
    let store = this.stores.get(key);
    if (!store) {
      store = new ProjectStore(key, { maxHistory: this.config.maxHistory });
      this.stores.set(key, store);
      this.pipelines.set(key, new BriefPipeline(store, this.reader, this.config));
      store
        .writeProbe(this.probe)
        .catch(() => {});
    }
    return store;
  }

  pipelineFor(project) {
    this.storeFor(project);
    return this.pipelines.get(resolve(project));
  }

  /**
   * The registered Workspace that owns this project directory.
   *
   * DSH's sidebar groups Sessions by Workspace membership, not by cwd, so a
   * Session created with a bare `cwd` lands in「未分组」. Resolving the
   * Workspace lets create/attach use the native membership path.
   */
  async workspaceFor(project) {
    const registry = this.ctx.get?.('workspaceRegistry');
    if (!registry) return null;
    try {
      if (typeof registry.resolveByPath === 'function') {
        const found = await registry.resolveByPath(project);
        if (found) return found;
      }
      if (typeof registry.list === 'function') {
        const key = resolve(project).toLowerCase();
        return (
          registry.list().find((workspace) => resolve(workspace.path).toLowerCase() === key) ?? null
        );
      }
    } catch (error) {
      this.ctx.logger?.warn?.('[dsh-router-agent] workspace lookup failed: %o', error);
    }
    return null;
  }

  /** Create a Session through its Workspace when one owns the project. */
  async createSession(project, options = {}) {
    const workspace = await this.workspaceFor(project);
    if (workspace?.id) {
      return this.ctx.sessionController.create({ ...options, workspaceId: String(workspace.id) });
    }
    return this.ctx.sessionController.create({ ...options, cwd: project });
  }

  /**
   * Best-effort idempotent Workspace attach for a Session created by fork or
   * an older Router version. A grouping failure must not fail a dispatch that
   * already happened, so it is logged and ignored.
   */
  async attachWorkspace(project, sessionId) {
    const workspace = await this.workspaceFor(project);
    if (!workspace) return null;
    try {
      if (!workspace.sessionIds?.includes(sessionId)) await workspace.attachSession(sessionId);
      return workspace;
    } catch (error) {
      this.ctx.logger?.warn?.(
        '[dsh-router-agent] workspace attach failed for %s: %o',
        sessionId,
        error,
      );
      return null;
    }
  }

  /**
   * One-time migration for Sessions created before the workspaceId fix.
   *
   * Older Router versions created Router, `new`, and forked Sessions with a
   * bare cwd, so DSH's sidebar put them in「未分组」even though their cwd is
   * the Workspace path. Native DSH Sessions in the same directory are already
   * members; attaching the rest on the first panel read repairs them without
   * touching subagent/archived logs.
   */
  async repairWorkspaceMembers(project, summaries) {
    const key = this.taskKey(project);
    if (this.workspaceRepaired.has(key)) return;
    this.workspaceRepaired.add(key);
    const workspace = await this.workspaceFor(project);
    if (!workspace) return;
    const registry = this.ctx.get?.('workspaceRegistry');
    const archived = new Set((registry?.archivedSessionIds ?? []).map(String));
    const members = new Set((workspace.sessionIds ?? []).map(String));
    for (const summary of summaries) {
      if (!summary.cwd || !sameProject(summary.cwd, project)) continue;
      if (summary.origin === 'subagent') continue;
      if (archived.has(String(summary.sessionId))) continue;
      if (members.has(String(summary.sessionId))) continue;
      try {
        await workspace.attachSession(summary.sessionId);
        members.add(String(summary.sessionId));
      } catch (error) {
        this.ctx.logger?.warn?.(
          '[dsh-router-agent] workspace repair failed for %s: %o',
          summary.sessionId,
          error,
        );
      }
    }
  }

  async modelCatalog() {
    if (this.modelCache.catalog && Date.now() - this.modelCache.at < 60000) return this.modelCache.catalog;
    try {
      const catalog = await this.ctx.sessionController.modelCatalog();
      this.modelCache = { at: Date.now(), catalog };
      return catalog;
    } catch {
      return null;
    }
  }

  /**
   * A cold summary can omit `blank` and its metadata projection. Reading the
   * (cached) log is the only reliable way to keep a workspace's empty starter
   * session out of project counts and the untracked list.
   */
  async isBlank(summary) {
    if (summary.blank === true) return true;
    if (summary.blank === false) return false;
    if (summary.projections) return false;
    const key = `${summary.sessionId}:${summary.updatedAt}`;
    if (this.blankCache.has(key)) return this.blankCache.get(key);
    let blank = false;
    try {
      const record = await this.reader.read(summary.sessionId, summary.updatedAt);
      blank = record.analysis.turns === 0;
    } catch {
      blank = false;
    }
    this.blankCache.set(key, blank);
    return blank;
  }

  async listProjects(summaries = null) {
    if (!this.probe.sessionController.list) return [];
    const rows = summaries ?? (await this.reader.summaries());
    const metas = await this.projectSidecars(rows);
    const routerIds = new Set(
      [...metas.values()].map((meta) => meta.raSessionId).filter(Boolean),
    );
    const byCwd = new Map();
    for (const summary of rows) {
      if (!summary.cwd) continue;
      if (summary.origin === 'subagent') continue;
      if (summary.projections?.values?.agentPreset === 'router') continue;
      if (routerIds.has(summary.sessionId)) continue;
      if (await this.isBlank(summary)) continue;
      // Cold and warm summaries can spell the same directory with `/` or `\`;
      // grouping by the raw string would produce two project rows with
      // different counts and split one project across two selector entries.
      const key = resolve(summary.cwd).toLowerCase();
      const project = resolve(summary.cwd);
      const meta = metas.get(key);
      const row = byCwd.get(key) ?? {
        project,
        name: basename(project) || project,
        sessions: 0,
        tracked: 0,
        lastActiveAt: 0,
      };
      const updatedAt = Number(summary.updatedAt) || 0;
      const cutoff = Date.now() - (Number(meta?.trackingDays) || this.config.firstRunDays) * DAY;
      const stopped = !!meta?.stopped?.[summary.sessionId];
      const pinned = !!meta?.pinned?.[summary.sessionId];
      row.sessions += 1;
      if (!stopped && (updatedAt >= cutoff || pinned)) row.tracked += 1;
      row.lastActiveAt = Math.max(row.lastActiveAt, updatedAt);
      byCwd.set(key, row);
    }
    return [...byCwd.values()].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  }

  /**
   * Read the per-project sidecar facts the project list needs.
   *
   * Cold summaries may omit `agentPreset`, so the sidecar is the reliable way
   * to keep the Router session out of project counts and to know each
   * project's tracking window without collecting every project's full tree.
   */
  async projectSidecars(summaries) {
    const out = new Map();
    const cwds = [...new Set(summaries.map((summary) => summary.cwd).filter(Boolean))];
    for (const cwd of cwds) {
      const key = resolve(cwd).toLowerCase();
      const cached = this.raIdCache.get(key);
      if (cached && Date.now() - cached.at < 5000) {
        out.set(key, cached.meta);
        continue;
      }
      const state = await readJson(join(cwd, '.dsh_RA', 'state.json'), null);
      const days = Number(state?.settings?.trackingDays ?? state?.tracking?.days);
      const meta = {
        raSessionId: state?.raSessionId ?? null,
        trackingDays: Number.isFinite(days) && days > 0 ? days : this.config.firstRunDays,
        stopped: state?.stopped ?? {},
        pinned: state?.pinned ?? {},
      };
      this.raIdCache.set(key, { at: Date.now(), meta });
      out.set(key, meta);
    }
    return out;
  }

  /** Whether a summary belongs to the Router itself rather than the project tree. */
  isRouterSummary(summary, state) {
    return summary.projections?.values?.agentPreset === 'router' || summary.sessionId === state?.raSessionId;
  }

  /**
   * Direct conversations also advance the Router index. `state` polling alone
   * would eventually notice, but a turn/end subscription refreshes the brief
   * within the configured debounce window even when the panel is closed.
   */
  onSessionEvent(session, event) {
    if (event?.type !== 'turn/end') return;
    const project = session?.header?.cwd;
    if (!project) return;
    if (session.header.agentPreset === 'router') return;
    if (session.header.origin === 'subagent') return;
    // The active read is keyed by the live sequence; dropping it here also
    // covers sessions whose live sequence is briefly unavailable.
    if (session.id) this.reader.invalidate(session.id);
    const key = resolve(project);
    clearTimeout(this.turnTimers.get(key));
    this.turnTimers.set(
      key,
      setTimeout(() => {
        this.turnTimers.delete(key);
        this.collect(key).catch(() => {});
      }, Math.max(200, Number(this.config.summaryDebounceMs) || 1200)),
    );
  }

  /** Collect the tracked and untracked rows for one project. */
  async collect(project, options = {}) {
    const store = this.storeFor(project);
    const state = await store.read();
    // `state()` lists every Session once and shares the snapshot. Filter it
    // here: the tree and the untracked list are per-project, and passing the
    // global list straight through leaked other workspaces' sessions.
    const summaries = options.summaries
      ? options.summaries.filter((summary) => sameProject(summary.cwd, project))
      : await this.reader.listProject(project);
    await this.repairWorkspaceMembers(project, summaries).catch(() => {});
    const cutoff = Date.now() - (Number(state.settings.trackingDays) || this.config.firstRunDays) * DAY;
    const candidates = summaries
      .filter((summary) => !this.isRouterSummary(summary, state))
      .filter((summary) => summary.origin !== 'subagent');
    const trackedSummaries = [];
    const untracked = [];
    for (const summary of candidates) {
      const stopped = !!state.stopped[summary.sessionId];
      const pinned = !!state.pinned?.[summary.sessionId];
      const fresh = Number(summary.updatedAt) >= cutoff;
      const blank = await this.isBlank(summary);
      if (!stopped && !blank && (fresh || pinned)) {
        trackedSummaries.push(summary);
      } else if (!blank) {
        // A cold summary may omit the title projection; read the log once so
        // the untracked list is not a wall of "未命名会话".
        let title = summary.projections?.values?.title ?? state.titles[summary.sessionId]?.title ?? null;
        if (!title) {
          try {
            const record = await this.reader.read(summary.sessionId, summary.updatedAt);
            title = record.analysis.title;
          } catch {
            // keep the fallback
          }
        }
        untracked.push({
          sessionId: summary.sessionId,
          title: title ?? '未命名会话',
          lastActiveAt: Number(summary.updatedAt) || 0,
          lastActiveLabel: SessionReader.label(Number(summary.updatedAt) || 0),
          reason: stopped ? 'stopped' : 'older',
          parentSessionId: summary.parentSessionId ?? null,
          running: !!summary.running,
        });
      }
    }

    const rows = [];
    const readErrors = [];
    for (const summary of trackedSummaries) {
      let record;
      let row;
      try {
        record = await this.reader.read(summary.sessionId, summary.updatedAt);
        row = await this.reader.derive(summary.sessionId, summary, record);
      } catch (error) {
        // One unreadable log must not take down the whole project panel. The
        // session stays out of the RA context until it can be read again.
        readErrors.push({ sessionId: summary.sessionId, message: String(error?.message ?? error) });
        continue;
      }
      const sidecar = state.titles[summary.sessionId];
      if (sidecar?.title) {
        row.title = sidecar.title;
        row.titleSource = sidecar.source ?? 'sidecar';
      } else {
        row.titleSource = 'native';
      }
      row.stopped = false;
      // The brief pipeline needs the extracted turns/files/boundaries, while
      // publicRow must not leak them into the canvas payload.
      row.analysis = record.analysis;
      rows.push(row);
    }

    // Sort by each session's own activity; a child's activity never moves its
    // parent's root position.
    rows.sort((a, b) => a.lastActiveAt - b.lastActiveAt);
    untracked.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    const forest = buildForest(rows, state);
    // 0.2.2 ordinary forks omit header.parentSession; `buildForest` resolves
    // the parent from the sidecar. Write the resolved edge back onto the public
    // row so the client renders the child under its real parent.
    for (const row of rows) row.parentSessionId = forest.parentOf.get(row.sessionId) ?? null;
    const parentOf = Object.fromEntries(forest.parentOf);
    const edges = rows
      .filter((row) => parentOf[row.sessionId])
      .map((row) => ({ from: parentOf[row.sessionId], to: row.sessionId }));

    // The tracking dialog lists every real Session in the project, tracked or
    // not, with `tracked` driving the checkbox. Inferred cutoff membership and
    // a manual pin both count as tracked; `reason` explains an unchecked row.
    const allSessions = [
      ...rows.map((row) => ({
        sessionId: row.sessionId,
        title: row.title,
        lastActiveAt: row.lastActiveAt,
        lastActiveLabel: SessionReader.label(row.lastActiveAt),
        tracked: true,
        reason: null,
        parentSessionId: row.parentSessionId,
        running: row.running,
        turns: row.turns,
      })),
      ...untracked.map((item) => ({ ...item, tracked: false })),
    ].sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    const dirty = [];
    const summaryPatch = {};
    for (const row of rows) {
      const brief = await store.getBrief(row.sessionId);
      if (!brief || brief.summarizedThroughSeq < row.lastSeq) dirty.push(row);
      const nextSummary = {
        status: brief?.summaryStatus ?? 'pending',
        summarizedThroughSeq: brief?.summarizedThroughSeq ?? -1,
        title: row.title,
        lastActiveAt: row.lastActiveAt,
      };
      const previous = state.summary[row.sessionId];
      if (
        !previous ||
        previous.status !== nextSummary.status ||
        previous.summarizedThroughSeq !== nextSummary.summarizedThroughSeq ||
        previous.title !== nextSummary.title ||
        previous.lastActiveAt !== nextSummary.lastActiveAt
      ) {
        summaryPatch[row.sessionId] = nextSummary;
      }
    }
    if (Object.keys(summaryPatch).length > 0) {
      await store.mergeSummaries(summaryPatch);
      for (const [sessionId, summary] of Object.entries(summaryPatch)) {
        state.summary[sessionId] = { ...summary, updatedAt: new Date().toISOString() };
      }
    }

    const pipeline = this.pipelineFor(project);
    if (state.onboarding.status === 'complete' && dirty.length > 0) {
      // Incremental maintenance after the user has confirmed the first index.
      pipeline.schedule(dirty);
    } else if (state.onboarding.status === 'running') {
      // The user already confirmed this index; a Host restart resumes it.
      this.startIndexing(project, rows);
    } else if (state.onboarding.status !== 'complete') {
      // Awaiting confirmation / skipped / failed: keep the confirmation card's
      // counts current, but never start model calls on the user's behalf.
      const done = Math.max(0, rows.length - dirty.length);
      if (state.onboarding.total !== rows.length || state.onboarding.done !== done) {
        await store.onboarding({ total: rows.length, done });
        state.onboarding.total = rows.length;
        state.onboarding.done = done;
      }
    }

    if (Date.now() - this.lastPrunedAt > PROJECT_PRUNE_INTERVAL) {
      this.lastPrunedAt = Date.now();
      const keep = new Set(summaries.map((summary) => summary.sessionId));
      if (state.raSessionId) keep.add(state.raSessionId);
      store.pruneBriefs(keep).catch(() => {});
      store.pruneProposals(PROPOSAL_PRUNE_AGE).catch(() => {});
      store.pruneStateKeep(keep).catch(() => {});
    }

    const latest = store.state ?? state;
    return { store, state: latest, rows, untracked, allSessions, roots: forest.roots.map((row) => row.sessionId), edges, dirty, readErrors };
  }

  /**
   * The task context of the RA session's latest user message.
   *
   * `found` distinguishes "no user message yet" (fall back to the panel's
   * active slot) from "a user message without a Host envelope" (a manual chat;
   * its tool-argument task is more authoritative than a stale active slot).
   */
  async latestTaskContext(agent) {
    const sessionId = agent?.id ?? agent?.session?.header?.id;
    if (!sessionId) return { found: false, envelope: null };
    let live = null;
    try {
      live = this.ctx.sessions.get(sessionId);
    } catch {
      live = null;
    }
    let record;
    try {
      record = await this.reader.read(sessionId, Number(live?.seq) || 0);
    } catch {
      return { found: false, envelope: null };
    }
    for (let index = record.events.length - 1; index >= 0; index -= 1) {
      const event = record.events[index];
      if (event.type !== 'user/message' || event.data?.source?.kind !== 'user') continue;
      return { found: true, envelope: parseTaskEnvelope(messageText(event.data)) };
    }
    return { found: false, envelope: null };
  }

  async pendingFor(store) {
    const now = Date.now();
    const proposals = await store.listProposals();
    const pending = [];
    for (const proposal of proposals) {
      if (proposal.status === 'executing') {
        // A crashed Host can leave an executing proposal behind. It is not
        // automatically retried (that could duplicate a fork/send); surface it
        // as failed instead once the claim is clearly stale.
        if (now - Number(proposal.claimedAt ?? proposal.createdAt ?? 0) > 15 * 60 * 1000) {
          await store
            .mutateProposal(proposal.token, (current) =>
              current.status === 'executing'
                ? { ...current, status: 'failed', error: 'execution interrupted' }
                : null,
            )
            .catch(() => {});
        }
        continue;
      }
      if (proposal.status !== 'pending') continue;
      if (Number(proposal.expiresAt) <= now) {
        await store
          .mutateProposal(proposal.token, (current) =>
            current.status === 'pending' && Number(current.expiresAt) <= Date.now()
              ? { ...current, status: 'expired' }
              : null,
          )
          .catch(() => {});
        continue;
      }
      pending.push(proposal);
    }
    return pending.sort((a, b) => a.createdAt - b.createdAt);
  }

  async raRunning(state) {
    if (!state.raSessionId) return false;
    return this.ctx.agents.get(state.raSessionId)?.status === 'running' || false;
  }

  /** The panel's single read. */
  async state({ project } = {}) {
    const probe = this.refreshProbe();
    const summaries = await this.reader.summaries();
    const projects = await this.listProjects(summaries);
    const selected = project
      ? projects.find((row) => sameProject(row.project, project)) ?? null
      : projects[0] ?? null;
    if (!selected) {
      return {
        ok: true,
        probe,
        blockers: probeBlockers(probe),
        projects,
        selectedProject: null,
        tree: { project: null, sessions: [], roots: [], edges: [], trackedCount: 0, untrackedCount: 0, readErrors: [] },
        untracked: [],
        allSessions: [],
        settings: null,
        models: null,
        onboarding: null,
        ra: null,
        pending: [],
        history: [],
      };
    }
    const { store, state, rows, untracked, allSessions, roots, edges, readErrors } = await this.collect(selected.project, { summaries });
    const settings = state.settings;
    const models = await this.modelCatalog();
    const pending = await this.pendingFor(store);
    const history = await store.history(30);
    return {
      ok: true,
      probe,
      blockers: probeBlockers(probe),
      projects,
      selectedProject: selected,
      tree: {
        project: selected.project,
        generatedAt: new Date().toISOString(),
        sessions: rows.map((row) => this.publicRow(row, pending)),
        roots,
        edges,
        trackedCount: rows.length,
        untrackedCount: untracked.length,
        readErrors,
      },
      untracked,
      allSessions,
      settings,
      models: models
        ? {
            default: models.default,
            groups: models.groups.map((group) => ({
              id: group.id,
              name: group.name,
              models: group.models.map((model) => ({ id: model.id, name: model.name })),
            })),
          }
        : null,
      onboarding: state.onboarding,
      ra: {
        sessionId: state.raSessionId,
        running: await this.raRunning(state),
        task: this.activeTask(selected.project),
      },
      pending,
      history: history.reverse(),
    };
  }

  publicRow(row, pending) {
    const target = pending.some((proposal) => proposal.targetSessionId === row.sessionId);
    return {
      sessionId: row.sessionId,
      title: row.title,
      parentSessionId: row.parentSessionId,
      lastActiveAt: row.lastActiveAt,
      lastActiveLabel: SessionReader.label(row.lastActiveAt),
      turns: row.turns,
      running: row.running,
      live: row.live,
      context: row.context,
      boundaries: row.boundaries.slice(-TREE_BOUNDARY_LIMIT).map((boundary) => ({
        turn: boundary.turn,
        atSeq: boundary.atSeq,
        label: boundary.label,
      })),
      boundaryCount: row.boundaries.length,
      plan: row.plan,
      permissions: row.permissions,
      pending: target,
      titleSource: row.titleSource,
    };
  }

  /** Resolve one tracked row (used by detail, fork points, and tools). */
  async findRow(project, sessionId) {
    const collected = await this.collect(project);
    const row = collected.rows.find((item) => item.sessionId === sessionId);
    if (!row) throw new HttpError(404, 'session-not-tracked', '该会话不在当前项目的跟踪范围内。');
    return { ...collected, row };
  }

  /** Ensure the per-project Router Agent session exists and is live. */
  async ensureRA(project) {
    const store = this.storeFor(project);
    const state = await store.read();
    const existing = state.raSessionId;
    if (existing) {
      const live = this.ctx.agents.get(existing);
      if (live) {
        // Older Router sessions were created with a bare cwd and sit in
        //「未分组」; attach is idempotent, so repairing it here is safe.
        await this.attachWorkspace(project, existing);
        return { agent: live, sessionId: existing, created: false };
      }
      let found;
      try {
        found = await this.ctx.sessionController.resolveAgent(existing);
      } catch (error) {
        throw new HttpError(
          503,
          'ra-unavailable',
          `Router 会话暂时无法恢复：${String(error?.message ?? error)}。请稍后重试。`,
        );
      }
      if (found && !('error' in found)) {
        await this.applyRAModel(found.agent, state);
        await this.attachWorkspace(project, existing);
        return { agent: found.agent, sessionId: existing, created: false };
      }
      const code = found?.error?.code;
      if (code !== 'session/not-found') {
        // `agent-busy` and `writer-held` are transient; recreating the Router
        // session here would orphan its conversation. `gateway/internal` is a
        // transport failure. Only a missing Session is recreated.
        if (code === 'session/agent-busy' || code === 'session/writer-held') {
          throw new HttpError(409, 'ra-busy', 'Router 会话正在被另一个操作占用，请稍后重试。');
        }
        throw new HttpError(503, 'ra-unavailable', `Router 会话暂时不可用：${found?.error?.message ?? code ?? 'unknown'}`);
      }
    }
    const created = await this.createSession(project, {
      agentPreset: 'router',
    });
    const sessionId = created.sessionId;
    await store.setRASession(sessionId);
    for (const key of [project, resolve(project), resolve(project).toLowerCase()]) this.raIdCache.delete(key);
    const found = await this.ctx.sessionController.resolveAgent(sessionId);
    if ('error' in found) throw new Error(`Router session was created but no Agent is available: ${sessionId}`);
    await this.applyRAModel(found.agent, state);
    try {
      await this.ctx.sessionController.rename({
        sessionId,
        title: `Router · ${basename(project) || project}`,
      });
    } catch {
      await store.setTitle(sessionId, `Router · ${basename(project) || project}`, 'generated').catch(() => {});
    }
    return { agent: found.agent, sessionId, created: true };
  }

  async applyRAModel(agent, state) {
    const selection = state.settings?.raModel;
    if (selection?.provider && selection?.model) {
      try {
        agent.model.select({ provider: selection.provider, model: selection.model });
      } catch {
        // The RA keeps the deployment default; the settings modal shows the
        // selected value and the next request reports an unavailable model.
      }
    }
  }

  /** Send one user task to the Router Agent. */
  async ask({ project, task, composer }) {
    const text = String(task ?? '').trim();
    if (!text) throw new HttpError(400, 'empty-task', '任务不能为空。');
    if (!this.ctx.get?.('agentPresets')) {
      throw new HttpError(503, 'preset-missing', 'Router preset 未加载，无法创建 RA 会话。');
    }
    const store = this.storeFor(project);
    const collected = await this.collect(project);
    const state = collected.state;
    if (collected.rows.length > 0 && state.onboarding.status === 'running') {
      throw new HttpError(409, 'onboarding-running', '首次接入的会话索引正在建立，完成后才能继续路由。');
    }
    const ra = await this.ensureRA(store.project);
    const nextComposer = {
      mode: composer?.mode === 'plan' ? 'plan' : 'standard',
      permissions: ['read-only', 'workspace-write', 'danger-full-access'].includes(composer?.permissions)
        ? composer.permissions
        : state.settings.composer.permissions,
      auto: !!composer?.auto,
    };
    this.activeTasks.set(this.taskKey(store.project), {
      task: text,
      composer: nextComposer,
      at: Date.now(),
      raSessionId: ra.sessionId,
    });
    await store.setSettings({ composer: nextComposer });
    const policy = autoAskPolicy(state.settings);
    const autoLines =
      nextComposer.auto && policy === 'decide'
        ? ['自动执行已开启：不要使用 ask，请直接在 route / fork / new 中选择一个。']
        : nextComposer.auto && policy === 'suggest'
          ? [
              '自动执行已开启：如确实需要追问，必须提供 options；Host 会自动采用第一个建议项继续判断，其余动作直接执行。',
            ]
          : nextComposer.auto
            ? ['自动执行已开启：可以追问（ask），但追问仍需要用户回答；其余动作会直接执行。']
            : [];
    const wrapper = [
      `项目：${store.project}`,
      `用户任务：${text}`,
      composerLine(nextComposer),
      ...autoLines,
      '',
      '请先用 ra_tree 查看会话；需要时用 ra_brief 看候选会话的分叉边界；然后用 ra_propose 提交恰好一个提议。不要直接回答任务内容。',
    ].join('\n');
    await this.ctx.sessionController.prompt(
      {
        requestId: randomUUID(),
        sessionId: ra.sessionId,
        mode: 'queue',
        content: [{ type: 'text', text: wrapper }],
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      new AbortController().signal,
    );
    return { ok: true, raSessionId: ra.sessionId, accepted: true };
  }

  /**
   * RA tool: compact project tree.
   */
  async raTree(agent, args = {}) {
    const project = agent?.session?.header?.cwd;
    if (!project) throw new Error('Router Agent has no project cwd.');
    const { state, rows } = await this.collect(project);
    const result = {
      project,
      sessions: rows.map((row) => ({
        sessionId: row.sessionId,
        title: row.title,
        lastActive: row.lastActiveLabel,
        turns: row.turns,
        running: row.running,
        contextPercent: row.context.percent,
        boundaryCount: row.boundaries.length,
        boundaries: row.boundaries.slice(-RA_TREE_BOUNDARY_LIMIT).map((boundary) => ({
          turn: boundary.turn,
          atSeq: boundary.atSeq,
          label: boundary.label,
        })),
      })),
    };
    // Tool results are validated as lossless JSON; an `undefined` field would
    // reject the whole call, so optional facts are added only when present.
    if (args?.includeStopped === true) {
      result.stoppedCount = Object.keys(state.stopped ?? {}).length;
    }
    return result;
  }

  /** RA tool: one session brief. */
  async raBrief(agent, sessionId) {
    const project = agent?.session?.header?.cwd;
    const { row } = await this.findRow(project, sessionId);
    const brief = await this.pipelineFor(project).ensure(row);
    return {
      sessionId,
      title: brief.title,
      overview: brief.overview,
      topics: brief.topics,
      files: brief.files,
      decisions: brief.decisions,
      boundaryCount: brief.boundaries.length,
      boundaries: brief.boundaries.slice(-RA_BRIEF_BOUNDARY_LIMIT),
      context: row.context,
      turns: row.turns,
      lastActive: row.lastActiveLabel,
      plan: row.plan,
      permissions: row.permissions,
    };
  }

  /** RA tool: recent routing decisions. */
  async raHistory(agent, limit) {
    const project = agent?.session?.header?.cwd;
    const store = this.storeFor(project);
    const rows = await store.history(Math.max(1, Math.min(50, Number(limit) || 12)));
    return { items: rows.reverse() };
  }

  /**
   * RA tool: write exactly one proposal. Nothing is sent here; the Host sends
   * only after confirmation or an explicit auto-mode opt-in.
   */
  async raPropose(agent, args) {
    const project = agent?.session?.header?.cwd;
    if (!project) throw new Error('Router Agent has no project cwd.');
    const store = this.storeFor(project);
    const state = await store.read();
    const policy = autoAskPolicy(state.settings);
    const active = this.activeTask(project);
    const latest = await this.latestTaskContext(agent);
    const envelope = latest.envelope;
    const action = args?.action;
    if (!['route', 'fork', 'new', 'ask'].includes(action)) {
      throw new Error('ra_propose.action must be route, fork, new, or ask.');
    }
    // The delivered message is the user's original task. A Host envelope on
    // the latest user message wins (it survives queued answers and newer
    // tasks); a manual RA chat has no envelope, so its tool argument is more
    // authoritative than a stale panel slot.
    if (latest.found && !envelope) this.activeTasks.delete(this.taskKey(project));
    const task = String(
      envelope?.task ?? (latest.found ? args?.task : active?.task) ?? args?.task ?? '',
    ).trim();
    if (action !== 'ask' && !task) throw new Error('ra_propose.task is required for route, fork, and new.');
    const composer =
      envelope?.composer ??
      (latest.found ? state.settings.composer : active?.composer) ??
      state.settings.composer;
    if (action === 'ask' && composer.auto && policy === 'decide') {
      throw new Error('自动执行已开启且设置为“交给 RA 判断”：不能追问，请直接在 route / fork / new 中选择一个并提交提议。');
    }
    const token = randomUUID();
    const now = Date.now();
    let target = null;
    let atSeq = null;
    let turn = null;
    let targetLastSeq = null;
    if (action === 'route' || action === 'fork') {
      const found = await this.findRow(project, args?.targetSessionId);
      target = found.row;
      targetLastSeq = target.lastSeq;
      if (action === 'fork') {
        const boundary = args?.atSeq
          ? target.boundaries.find((item) => Number(item.atSeq) === Number(args.atSeq))
          : target.boundaries.at(-1);
        if (!boundary) {
          throw new Error(
            `atSeq ${String(args?.atSeq)} is not a completed turn boundary of ${target.sessionId}.`,
          );
        }
        atSeq = boundary.atSeq;
        turn = boundary.turn;
      }
    }
    if (action === 'ask' && !String(args?.question ?? '').trim()) {
      throw new Error('ra_propose.question is required for ask.');
    }
    const proposal = {
      token,
      project,
      action,
      task,
      targetSessionId: target?.sessionId ?? null,
      targetTitle: target?.title ?? null,
      targetLastSeq,
      targetPlan: target?.plan?.active ?? null,
      targetPermissions: target?.permissions ?? null,
      atSeq,
      turn,
      title: typeof args?.title === 'string' ? args.title.slice(0, 80) : null,
      question: typeof args?.question === 'string' ? args.question.slice(0, 300) : null,
      options: Array.isArray(args?.options)
        ? args.options.filter((value) => typeof value === 'string').slice(0, 6)
        : [],
      reason: String(args?.reason ?? '').slice(0, 400),
      composer,
      auto: !!composer.auto && action !== 'ask',
      status: 'pending',
      createdAt: now,
      expiresAt: now + (Number(this.config.proposalTtlMs) || 600000),
      raSessionId: agent?.id ?? active?.raSessionId ?? state.raSessionId,
      summary: this.proposalSummary({ action, target, atSeq, turn, title: args?.title, question: args?.question }),
    };

    // Auto mode + “use the suggestion”: answer the RA's question with its own
    // first option and let the next turn produce the real routing proposal.
    if (action === 'ask' && composer.auto && policy === 'suggest' && proposal.options.length > 0) {
      const answer = proposal.options[0];
      await store.saveProposal({
        ...proposal,
        status: 'answered',
        auto: true,
        answer,
        answeredAt: now,
      });
      try {
        await this.sendFollowUp(project, {
          task: proposal.task,
          composer,
          raSessionId: proposal.raSessionId,
          line: `Host 按“自动使用建议项”采用：${answer}`,
        });
      } catch (error) {
        await store
          .saveProposal({
            ...proposal,
            status: 'failed',
            auto: true,
            answer,
            error: String(error?.message ?? error),
          })
          .catch(() => {});
        await this.recordHistory(store, proposal, { result: 'failed' }, 'auto', error);
        throw error;
      }
      await this.recordHistory(store, proposal, { result: 'asked' }, 'auto');
      return {
        token,
        action,
        summary: proposal.summary,
        confirmRequired: false,
        executed: true,
        autoAnswered: true,
        answer,
      };
    }

    if (!proposal.auto) {
      await store.saveProposal(proposal);
      return { token, action, summary: proposal.summary, confirmRequired: action !== 'ask' };
    }

    // Auto mode executes without a user click, but it still records the claim
    // before doing anything and uses the same target/lastSeq guard as confirm.
    proposal.status = 'executing';
    proposal.claimedAt = now;
    await store.saveProposal(proposal);
    if (proposal.targetSessionId) {
      const current = await this.currentLastSeq(proposal.targetSessionId);
      if (current === null) {
        await store.saveProposal({ ...proposal, status: 'failed', error: 'target-unreadable' });
        await this.recordHistory(store, proposal, { result: 'failed' }, 'auto', new Error('target-unreadable'));
        throw new Error('无法读取目标会话的最新进度；自动执行已取消，请重新判断。');
      }
      if (proposal.targetLastSeq !== null && current !== proposal.targetLastSeq) {
        await store.saveProposal({ ...proposal, status: 'target-changed' });
        throw new Error('目标会话在提议后又有新消息；自动执行已取消，请重新判断。');
      }
    }
    const progress = {};
    let result;
    try {
      result = await this.executeProposal(proposal, progress);
    } catch (error) {
      await store.saveProposal({
        ...proposal,
        status: 'failed',
        error: String(error?.message ?? error),
        ...(progress.createdSessionId ? { resultSessionId: progress.createdSessionId } : {}),
      });
      await this.recordHistory(store, proposal, { result: 'failed', targetSessionId: progress.createdSessionId }, 'auto', error);
      throw error;
    }
    await store.saveProposal({ ...proposal, status: 'auto', result, executedAt: Date.now() });
    await this.recordHistory(store, proposal, result, 'auto');
    this.clearActiveTask(proposal.project, proposal.task, proposal.raSessionId);
    return {
      token,
      action,
      summary: proposal.summary,
      confirmRequired: false,
      executed: true,
      result,
    };
  }

  proposalSummary({ action, target, atSeq, turn, title, question }) {
    if (action === 'ask') return `向你确认：${String(question ?? '').slice(0, 80)}`;
    if (action === 'new') return `新建干净会话${title ? `「${title}」` : ''}`;
    if (action === 'fork') return `从「${target?.title ?? target?.sessionId}」T${turn ?? '?'} 分叉（atSeq ${atSeq}）`;
    return `继续「${target?.title ?? target?.sessionId}」`;
  }

  async recordHistory(store, proposal, result, mode, error = null) {
    try {
      await store.appendHistory({
        id: randomUUID(),
        at: new Date().toISOString(),
        task: redactSecrets(proposal.task),
        action: proposal.action,
        targetSessionId: result?.targetSessionId ?? proposal.targetSessionId,
        targetTitle: proposal.targetTitle ? redactSecrets(proposal.targetTitle) : null,
        atSeq: proposal.atSeq,
        turn: proposal.turn,
        reason: redactSecrets(proposal.reason),
        result:
          result?.result === 'failed'
            ? 'failed'
            : result?.result === 'asked'
              ? 'asked'
              : mode === 'auto'
                ? 'auto'
                : result?.result ?? 'sent',
        mode,
        composer: proposal.composer,
        error: error ? String(error?.message ?? error) : null,
      });
    } catch (historyError) {
      // Dispatch already happened (or has its own error); a history write
      // failure must not turn a successful send into an HTTP 500.
      this.ctx.logger?.warn?.('[dsh-router-agent] history write failed: %o', historyError);
    }
  }

  async api(op, body = {}) {
    if (body.token !== undefined && !/^[A-Za-z0-9_-]{1,80}$/.test(String(body.token))) {
      throw new HttpError(400, 'bad-token', '提议 token 格式不正确。');
    }
    if (PROJECT_OPS.has(op)) {
      body = { ...body, project: await this.requireProject(body.project) };
    }
    switch (op) {
      case 'refresh':
        return this.state({ project: body.project });
      case 'probe':
        return this.probeReport();
      case 'ping':
        return { ok: true, at: new Date().toISOString() };
      case 'ask':
        return this.ask(body);
      case 'manual':
        return this.manual(body);
      case 'confirm':
        return this.confirm(body);
      case 'choose':
        return this.choose(body);
      case 'abandon':
        return this.abandon(body);
      case 'answer':
        return this.answerAsk(body);
      case 'retry':
        return this.retry(body);
      case 'retarget':
        return this.retarget(body);
      case 'cancelTask':
        return this.cancelTask(body);
      case 'detail':
        return this.detail(body);
      case 'compress':
        return this.compress(body);
      case 'stop':
        return this.stop(body);
      case 'restore':
        return this.restore(body);
      case 'settings':
        return this.saveSettings(body);
      case 'rename':
        return this.rename(body);
      case 'untracked':
        return this.untracked(body);
      case 'allSessions':
        return this.allSessions(body);
      case 'tracking':
        return this.tracking(body);
      case 'raMode':
        return this.raMode(body);
      case 'history':
        return this.history(body);
      case 'onboarding':
        return this.onboardingOp(body);
      case 'debug':
        if (!this.config.dev) throw new HttpError(404, 'unknown-op', 'Unknown Router operation.');
        return this.debug();
      case 'createTestSession':
        if (!this.config.dev) throw new HttpError(404, 'unknown-op', 'Unknown Router operation.');
        return this.createSession(body.cwd ?? 'D:/tmp/dsh-ra-test', {
          ...(body.agentPreset ? { agentPreset: body.agentPreset } : {}),
        });
      case 'debugAgent':
        if (!this.config.dev) throw new HttpError(404, 'unknown-op', 'Unknown Router operation.');
        return this.debugAgent(body.sessionId);
      case 'applySettings':
        if (!this.config.dev) throw new HttpError(404, 'unknown-op', 'Unknown Router operation.');
        return this.applyDispatchSettings(body.sessionId, body.composer ?? {});
      default:
        throw new HttpError(400, 'unknown-op', `Unknown Router operation "${op}".`);
    }
  }

  async detail({ project, sessionId }) {
    const { row, store } = await this.findRow(project, sessionId);
    const brief = await this.pipelineFor(project).ensure(row);
    return {
      ok: true,
      session: this.publicRow(row, []),
      brief: {
        overview: brief.overview,
        topics: brief.topics,
        decisions: brief.decisions,
        files: brief.files,
      },
      boundaries: row.boundaries,
    };
  }

  async confirm({ project, token }) {
    const store = this.storeFor(project);
    const proposal = await store.getProposal(token);
    if (!proposal) throw new HttpError(404, 'proposal-not-found', '提议不存在或已过期。');
    if (!sameProject(proposal.project, store.project)) {
      throw new HttpError(409, 'proposal-project-mismatch', '提议不属于该项目。');
    }
    if (proposal.status === 'executing') {
      throw new HttpError(409, 'proposal-executing', '该提议正在执行，请勿重复确认。');
    }
    if (proposal.status !== 'pending') throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    if (Number(proposal.expiresAt) <= Date.now()) {
      await store.mutateProposal(token, (current) =>
        current.status === 'pending' ? { ...current, status: 'expired' } : null,
      );
      throw new HttpError(409, 'proposal-expired', '提议已过期，请重新判断。');
    }
    // Compare-and-set the claim so two concurrent confirms (a retry, a second
    // tab, a double click) cannot both execute the same proposal.
    const claimed = await store.mutateProposal(token, (current) => {
      if (current.status !== 'pending') return null;
      if (Number(current.expiresAt) <= Date.now()) return { ...current, status: 'expired' };
      return { ...current, status: 'executing', claimedAt: Date.now() };
    });
    if (!claimed) throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    if (claimed.status === 'expired') throw new HttpError(409, 'proposal-expired', '提议已过期，请重新判断。');

    if (claimed.targetSessionId) {
      const current = await this.currentLastSeq(claimed.targetSessionId);
      if (current === null) {
        await store
          .mutateProposal(token, (entry) => ({ ...entry, status: 'failed', error: 'target-unreadable' }))
          .catch(() => {});
        await this.recordHistory(store, claimed, { result: 'failed' }, 'confirm', new Error('target-unreadable'));
        throw new HttpError(409, 'target-unreadable', '无法读取目标会话的最新进度，请重新判断。');
      }
      if (claimed.targetLastSeq !== null && current !== claimed.targetLastSeq) {
        await store
          .mutateProposal(token, (entry) => ({ ...entry, status: 'target-changed' }))
          .catch(() => {});
        throw new HttpError(409, 'target-changed', '目标会话在提议后又有新消息，请重新判断。', {
          expected: claimed.targetLastSeq,
          actual: current,
        });
      }
    }

    const progress = {};
    let result;
    try {
      result = await this.executeProposal(claimed, progress);
    } catch (error) {
      const sideEffects = !!(progress.createdSessionId || progress.sent);
      await store
        .mutateProposal(token, (entry) =>
          entry.status === 'executing'
            ? {
                ...entry,
                ...(sideEffects
                  ? {
                      status: 'failed',
                      error: String(error?.message ?? error),
                      resultSessionId: progress.createdSessionId ?? null,
                    }
                  : { status: 'pending', claimedAt: undefined }),
              }
            : null,
        )
        .catch(() => {});
      await this.recordHistory(
        store,
        claimed,
        { result: 'failed', targetSessionId: progress.createdSessionId ?? claimed.targetSessionId },
        'confirm',
        error,
      );
      throw error;
    }
    await store
      .mutateProposal(token, (entry) => ({ ...entry, status: 'confirmed', result, executedAt: Date.now() }))
      .catch(() => {});
    await this.recordHistory(store, claimed, result, 'confirm');
    if (!claimed.manual) this.clearActiveTask(claimed.project, claimed.task, claimed.raSessionId);
    return { ok: true, result };
  }

  async choose({ project, token, atSeq }) {
    const store = this.storeFor(project);
    const proposal = await store.getProposal(token);
    if (!proposal) throw new HttpError(404, 'proposal-not-found', '提议不存在或已过期。');
    if (!sameProject(proposal.project, store.project)) throw new HttpError(409, 'proposal-project-mismatch', '提议不属于该项目。');
    if (proposal.status !== 'pending') throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    if (proposal.action !== 'fork') throw new HttpError(400, 'not-a-fork', '只有分叉提议可以更换分叉点。');
    const { row } = await this.findRow(project, proposal.targetSessionId);
    const boundary = row.boundaries.find((item) => Number(item.atSeq) === Number(atSeq));
    if (!boundary) throw new HttpError(400, 'bad-boundary', '该 atSeq 不是已完成轮次的边界。');
    const updated = await store.mutateProposal(token, (current) => {
      if (current.status !== 'pending') return null;
      return {
        ...current,
        atSeq: boundary.atSeq,
        turn: boundary.turn,
        summary: this.proposalSummary({
          action: 'fork',
          target: row,
          atSeq: boundary.atSeq,
          turn: boundary.turn,
        }),
      };
    });
    if (!updated) throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    return { ok: true, proposal: updated };
  }

  async abandon({ project, token }) {
    const store = this.storeFor(project);
    const proposal = await store.getProposal(token);
    if (!proposal) return { ok: true };
    if (!sameProject(proposal.project, store.project)) throw new HttpError(409, 'proposal-project-mismatch', '提议不属于该项目。');
    if (proposal.status === 'executing') {
      throw new HttpError(409, 'proposal-executing', '该提议正在执行，不能取消。');
    }
    const updated = await store.mutateProposal(token, (current) =>
      TERMINAL.has(current.status) ? null : { ...current, status: 'abandoned', executedAt: Date.now() },
    );
    if (updated) {
      await store
        .appendHistory({
          id: randomUUID(),
          at: new Date().toISOString(),
          task: redactSecrets(updated.task),
          action: updated.action,
          targetSessionId: updated.targetSessionId,
          targetTitle: updated.targetTitle ? redactSecrets(updated.targetTitle) : null,
          reason: redactSecrets(updated.reason),
          result: 'abandoned',
          mode: 'manual',
          composer: updated.composer,
        })
        .catch(() => {});
      if (!updated.manual) this.clearActiveTask(updated.project, updated.task, updated.raSessionId);
    }
    return { ok: true };
  }

  /**
   * Queue one follow-up turn on the RA session (an answer, an auto-selected
   * suggestion, or a “judge again” request) while keeping the original task in
   * the envelope so a newer queued task cannot silently replace it.
   */
  async sendFollowUp(project, { task, composer, line }) {
    const store = this.storeFor(project);
    const state = await store.read();
    const ra = await this.ensureRA(store.project);
    const current = this.activeTask(store.project);
    const effectiveTask = String(task ?? current?.task ?? '').trim() || '（沿用当前任务）';
    const effectiveComposer = composer ?? current?.composer ?? state.settings.composer;
    const prompt = [
      `项目：${store.project}`,
      `用户任务：${effectiveTask}`,
      composerLine(effectiveComposer),
      line,
      '',
      '请据此继续判断，并用 ra_propose 提交恰好一个提议。',
    ].join('\n');
    await this.ctx.sessionController.prompt(
      {
        requestId: randomUUID(),
        sessionId: ra.sessionId,
        mode: 'queue',
        content: [{ type: 'text', text: prompt }],
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      new AbortController().signal,
    );
    this.activeTasks.set(this.taskKey(store.project), {
      task: effectiveTask,
      composer: effectiveComposer,
      at: Date.now(),
      raSessionId: ra.sessionId,
    });
    return ra;
  }

  /** Answer an `ask` proposal by feeding the answer back to the RA. */
  async answerAsk({ project, token, answer }) {
    const store = this.storeFor(project);
    const state = await store.read();
    const proposal = await store.getProposal(token);
    if (!proposal) throw new HttpError(404, 'proposal-not-found', '提议不存在或已过期。');
    if (!sameProject(proposal.project, store.project)) throw new HttpError(409, 'proposal-project-mismatch', '提议不属于该项目。');
    if (proposal.status !== 'pending') throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    if (proposal.action !== 'ask') throw new HttpError(400, 'not-an-ask', '只有追问提议可以回答。');
    const value = String(answer ?? '').trim();
    if (!value) throw new HttpError(400, 'empty-answer', '回答不能为空。');
    const composer = proposal.composer ?? state.settings.composer;
    const ra = await this.ensureRA(store.project);
    const claimed = await store.mutateProposal(token, (current) =>
      current.status === 'pending' ? { ...current, status: 'executing', claimedAt: Date.now() } : null,
    );
    if (!claimed) throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    // Keep the task the user is answering in the envelope. The RA's latest
    // user message is the durable source `ra_propose` uses, so answering an
    // older question cannot silently pick up a newer queued task.
    const prompt = [
      `项目：${store.project}`,
      `用户任务：${claimed.task}`,
      composerLine(composer),
      `用户回答：${value}`,
      '',
      '请据此继续判断，并用 ra_propose 提交恰好一个提议。',
    ].join('\n');
    try {
      await this.ctx.sessionController.prompt(
        {
          requestId: randomUUID(),
          sessionId: ra.sessionId,
          mode: 'queue',
          content: [{ type: 'text', text: prompt }],
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        new AbortController().signal,
      );
    } catch (error) {
      await store
        .mutateProposal(token, (current) =>
          current.status === 'executing' ? { ...current, status: 'pending', claimedAt: undefined } : null,
        )
        .catch(() => {});
      throw error;
    }
    // The answer proposal is done; the RA will write a new one. Keep the task
    // active for the Router session's next proposal.
    this.activeTasks.set(this.taskKey(store.project), {
      task: claimed.task,
      composer,
      at: Date.now(),
      raSessionId: ra.sessionId,
    });
    await store
      .mutateProposal(token, (current) =>
        current.status === 'executing'
          ? { ...current, status: 'answered', answer: value, answeredAt: Date.now() }
          : null,
      )
      .catch(() => {});
    await store
      .appendHistory({
        id: randomUUID(),
        at: new Date().toISOString(),
        task: redactSecrets(claimed.task),
        action: claimed.action,
        targetSessionId: null,
        targetTitle: null,
        reason: redactSecrets(claimed.reason),
        result: 'asked',
        mode: 'manual',
        composer,
        answer: value,
      })
      .catch(() => {});
    return { ok: true, raSessionId: ra.sessionId };
  }

  /**
   * Manual dispatch: the user picked the target and action on the canvas,
   * bypassing the RA. It executes immediately because a second confirmation
   * would only repeat the choice the user just made. The proposal record is
   * still written (executing → confirmed/failed) for audit and failure
   * recovery, and it never auto-executes on its own.
   */
  async manual({ project, task, action, targetSessionId, atSeq, composer }) {
    const text = String(task ?? '').trim();
    if (!text) throw new HttpError(400, 'empty-task', '任务不能为空。');
    if (!['route', 'fork', 'new'].includes(action)) {
      throw new HttpError(400, 'bad-action', '手动派发只支持 route、fork 或 new。');
    }
    const store = this.storeFor(project);
    const state = await store.read();
    const nextComposer = {
      mode: composer?.mode === 'plan' ? 'plan' : 'standard',
      permissions: ['read-only', 'workspace-write', 'danger-full-access'].includes(composer?.permissions)
        ? composer.permissions
        : state.settings.composer.permissions,
      auto: false,
    };
    const token = randomUUID();
    const now = Date.now();
    let target = null;
    let boundary = null;
    if (action === 'route' || action === 'fork') {
      const found = await this.findRow(project, targetSessionId);
      target = found.row;
      if (action === 'fork') {
        boundary = atSeq
          ? target.boundaries.find((item) => Number(item.atSeq) === Number(atSeq))
          : target.boundaries.at(-1);
        if (!boundary) {
          throw new HttpError(400, 'no-boundary', '该会话还没有可作为分叉点的已完成轮次。');
        }
      }
    }
    const proposal = {
      token,
      project,
      action,
      task: text,
      targetSessionId: target?.sessionId ?? null,
      targetTitle: target?.title ?? null,
      targetLastSeq: target?.lastSeq ?? null,
      targetPlan: target?.plan?.active ?? null,
      targetPermissions: target?.permissions ?? null,
      atSeq: boundary?.atSeq ?? null,
      turn: boundary?.turn ?? null,
      title: null,
      question: null,
      options: [],
      reason: '手动派发：由用户在画布上指定目标。',
      composer: nextComposer,
      auto: false,
      manual: true,
      status: 'pending',
      createdAt: now,
      expiresAt: now + (Number(this.config.proposalTtlMs) || 600000),
      raSessionId: state.raSessionId,
      summary: this.proposalSummary({
        action,
        target,
        atSeq: boundary?.atSeq,
        turn: boundary?.turn,
      }),
    };
    await store.saveProposal({ ...proposal, status: 'executing', claimedAt: now });
    const progress = {};
    let result;
    try {
      result = await this.executeProposal(proposal, progress);
    } catch (error) {
      await store
        .saveProposal({
          ...proposal,
          status: 'failed',
          error: String(error?.message ?? error),
          ...(progress.createdSessionId ? { resultSessionId: progress.createdSessionId } : {}),
        })
        .catch(() => {});
      await this.recordHistory(
        store,
        proposal,
        { result: 'failed', targetSessionId: progress.createdSessionId ?? proposal.targetSessionId },
        'manual',
        error,
      );
      throw error;
    }
    await store.saveProposal({ ...proposal, status: 'confirmed', result, executedAt: Date.now() });
    await this.recordHistory(store, proposal, result, 'manual');
    return { ok: true, token, summary: proposal.summary, result };
  }

  /** Abandon a pending proposal and ask the RA to judge the same task again. */
  async retry({ project, token, note }) {
    const store = this.storeFor(project);
    const proposal = await store.getProposal(token);
    if (!proposal) throw new HttpError(404, 'proposal-not-found', '提议不存在或已过期。');
    if (!sameProject(proposal.project, store.project)) {
      throw new HttpError(409, 'proposal-project-mismatch', '提议不属于该项目。');
    }
    if (proposal.status !== 'pending') throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    if (proposal.manual) {
      throw new HttpError(400, 'manual-proposal', '手动派发的提议不能交给 Router 重新判断；请取消后重新选择目标。');
    }
    const updated = await store.mutateProposal(token, (current) =>
      current.status === 'pending'
        ? { ...current, status: 'abandoned', executedAt: Date.now(), revisedAt: Date.now() }
        : null,
    );
    if (!updated) throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    const correction = String(note ?? '').trim().slice(0, 500);
    try {
      await this.sendFollowUp(project, {
        task: updated.task,
        composer: updated.composer,
        line: correction
          ? `用户要求重新判断：${correction}`
          : '用户要求重新判断，请重新考虑目标或动作。',
      });
    } catch (error) {
      await store
        .mutateProposal(token, (current) =>
          current.status === 'abandoned'
            ? { ...current, status: 'pending', executedAt: undefined, revisedAt: undefined }
            : null,
        )
        .catch(() => {});
      throw error;
    }
    await this.recordHistory(store, updated, { result: 'revised' }, 'manual');
    return { ok: true };
  }

  /** Change a pending route/fork proposal's target without re-asking the RA. */
  async retarget({ project, token, sessionId }) {
    const store = this.storeFor(project);
    const proposal = await store.getProposal(token);
    if (!proposal) throw new HttpError(404, 'proposal-not-found', '提议不存在或已过期。');
    if (!sameProject(proposal.project, store.project)) {
      throw new HttpError(409, 'proposal-project-mismatch', '提议不属于该项目。');
    }
    if (proposal.status !== 'pending') throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    if (proposal.action !== 'route' && proposal.action !== 'fork') {
      throw new HttpError(400, 'not-retargetable', '只有继续或分叉提议可以更换目标。');
    }
    const { row } = await this.findRow(project, sessionId);
    const boundary = proposal.action === 'fork' ? row.boundaries.at(-1) : null;
    if (proposal.action === 'fork' && !boundary) {
      throw new HttpError(400, 'no-boundary', '该会话还没有可作为分叉点的已完成轮次。');
    }
    const updated = await store.mutateProposal(token, (current) => {
      if (current.status !== 'pending') return null;
      return {
        ...current,
        targetSessionId: row.sessionId,
        targetTitle: row.title,
        targetLastSeq: row.lastSeq,
        targetPlan: row.plan?.active ?? null,
        targetPermissions: row.permissions ?? null,
        atSeq: boundary?.atSeq ?? null,
        turn: boundary?.turn ?? null,
        summary: this.proposalSummary({
          action: current.action,
          target: row,
          atSeq: boundary?.atSeq,
          turn: boundary?.turn,
        }),
      };
    });
    if (!updated) throw new HttpError(409, 'proposal-not-pending', '该提议已处理。');
    return { ok: true, proposal: updated };
  }

  /** Stop waiting for the RA and drop queued prompts for the active task. */
  async cancelTask({ project }) {
    const store = this.storeFor(project);
    const state = await store.read();
    const active = this.activeTask(project);
    this.activeTasks.delete(this.taskKey(project));
    let canceled = false;
    if (state.raSessionId) {
      const agent = this.ctx.agents.get(state.raSessionId);
      if (agent && agent.status === 'running' && typeof agent.cancel === 'function') {
        try {
          agent.cancel({ kind: 'user' });
          canceled = true;
        } catch (error) {
          this.ctx.logger?.warn?.('[dsh-router-agent] RA cancel failed: %o', error);
        }
      }
    }
    return { ok: true, canceled, hadTask: !!active };
  }

  async currentLastSeq(sessionId) {
    const found = this.ctx.sessions.get(sessionId);
    if (found) {
      const events = found.snapshotEvents?.() ?? [];
      return events.at(-1)?.seq ?? -1;
    }
    try {
      const snapshot = await this.ctx.sessionQuery.readSession(sessionId);
      return snapshot.events.at(-1)?.seq ?? -1;
    } catch {
      return null;
    }
  }

  async resolveAgent(sessionId) {
    const found = await this.ctx.sessionController.resolveAgent(sessionId);
    if ('error' in found) throw new HttpError(409, 'session-unavailable', found.error.message ?? '会话不可用。');
    return found.agent;
  }

  /**
   * Apply the composer's session-level dispatch settings to the target. Plan
   * mode and permissions are not per-prompt knobs; the card shows the before →
   * after values so the user knows the target itself changes.
   */
  async applyDispatchSettings(sessionId, composer) {
    const agent = await this.resolveAgent(sessionId);
    const projection = await this.ctx.sessionController
      .projections({ sessionId }, new AbortController().signal)
      .catch(() => null);
    const beforePlan = !!projection?.values?.plan?.active;
    const beforePermissions = projection?.values?.permissions?.currentValue ?? null;
    const planRequested = composer?.mode === 'plan';
    const planChange = planRequested !== beforePlan;
    const permissionRequested = composer?.permissions ?? null;
    const permissionChange = !!permissionRequested && permissionRequested !== beforePermissions;
    const commands = this.ctx.get?.('commands');
    const permissions = this.ctx.get?.('permissionPresets');
    // Check capabilities before mutating anything; a half-applied dispatch
    // would otherwise leave the target in the new plan mode after a 409.
    if (planChange && !commands?.execute) {
      throw new HttpError(409, 'plan-unavailable', '计划模式切换失败：命令服务不可用');
    }
    if (permissionChange && !permissions?.set) {
      throw new HttpError(409, 'permission-unavailable', '权限切换失败：权限服务不可用');
    }
    const signal = new AbortController().signal;
    let planApplied = beforePlan;
    let permissionApplied = beforePermissions;
    let stage = 'plan';
    try {
      if (planChange) {
        const execution = await commands.execute(
          agent,
          planRequested ? '/plan' : '/plan off',
          [],
          signal,
        );
        if (!execution) throw new Error('计划模式命令不可用');
        if (execution.result?.kind === 'error') throw new Error(execution.result.text);
        planApplied = planRequested;
      }
      stage = 'permission';
      if (permissionChange) {
        permissions.set(agent.session, permissionRequested);
        permissionApplied = permissionRequested;
      }
    } catch (error) {
      // Best-effort rollback to the observed before-state.
      if (permissionApplied !== beforePermissions && permissions?.set && beforePermissions) {
        try {
          permissions.set(agent.session, beforePermissions);
        } catch {
          // The target keeps the new permission; the error below still tells
          // the user the dispatch did not happen.
        }
      }
      if (planApplied !== beforePlan && commands?.execute) {
        try {
          await commands.execute(agent, beforePlan ? '/plan' : '/plan off', [], signal);
        } catch {
          // Best effort only.
        }
      }
      const code = stage === 'plan' ? 'plan-unavailable' : 'permission-unavailable';
      const label = stage === 'plan' ? '计划模式' : '权限';
      throw new HttpError(409, code, `${label}切换失败：${String(error?.message ?? error)}`);
    }
    return {
      plan: { before: beforePlan, after: planApplied, requested: planRequested },
      permissions: { before: beforePermissions, after: permissionApplied, requested: permissionRequested },
    };
  }

  async prompt(sessionId, task) {
    await this.ctx.sessionController.prompt(
      {
        requestId: randomUUID(),
        sessionId,
        mode: 'queue',
        content: [{ type: 'text', text: task }],
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      new AbortController().signal,
    );
  }

  async executeProposal(proposal, progress = {}) {
    const store = this.storeFor(proposal.project);
    const settings = await store.read();
    if (proposal.action === 'ask') {
      return { result: 'asked', targetSessionId: null };
    }
    if (proposal.action === 'route') {
      if (!proposal.targetSessionId) throw new HttpError(400, 'no-target', '继续动作缺少目标会话。');
      await this.findRow(proposal.project, proposal.targetSessionId);
      const dispatch = await this.applyDispatchSettings(proposal.targetSessionId, proposal.composer);
      progress.settingsApplied = true;
      await this.prompt(proposal.targetSessionId, proposal.task);
      progress.sent = true;
      return { result: 'sent', targetSessionId: proposal.targetSessionId, dispatch };
    }
    if (proposal.action === 'fork') {
      if (!proposal.targetSessionId || proposal.atSeq == null) {
        throw new HttpError(400, 'no-boundary', '分叉缺少目标或边界。');
      }
      await this.findRow(proposal.project, proposal.targetSessionId);
      const forked = await this.ctx.sessionController.fork({
        sessionId: proposal.targetSessionId,
        atSeq: proposal.atSeq,
        allowMigration: true,
      });
      progress.createdSessionId = forked.sessionId;
      // The fork controller only inherits a Workspace from its source Session;
      // an ungrouped source would otherwise put the child in「未分组」too.
      await this.attachWorkspace(proposal.project, forked.sessionId);
      await store.recordLineage(forked.sessionId, proposal.targetSessionId, { pin: true });
      if (proposal.title) await this.renameSession(store, forked.sessionId, proposal.title);
      if (settings.settings.defaultSessionModel) await this.selectSessionModel(forked.sessionId, settings.settings.defaultSessionModel);
      const dispatch = await this.applyDispatchSettings(forked.sessionId, proposal.composer);
      progress.settingsApplied = true;
      await this.prompt(forked.sessionId, proposal.task);
      progress.sent = true;
      return {
        result: 'forked',
        targetSessionId: proposal.targetSessionId,
        sessionId: forked.sessionId,
        atSeq: proposal.atSeq,
        turn: proposal.turn,
        dispatch,
      };
    }
    if (proposal.action === 'new') {
      const created = await this.createSession(proposal.project);
      progress.createdSessionId = created.sessionId;
      if (proposal.title) await this.renameSession(store, created.sessionId, proposal.title);
      if (settings.settings.defaultSessionModel) await this.selectSessionModel(created.sessionId, settings.settings.defaultSessionModel);
      const dispatch = await this.applyDispatchSettings(created.sessionId, proposal.composer);
      progress.settingsApplied = true;
      await this.prompt(created.sessionId, proposal.task);
      progress.sent = true;
      return { result: 'created', sessionId: created.sessionId, dispatch };
    }
    throw new HttpError(400, 'bad-action', `Unknown proposal action "${proposal.action}".`);
  }

  async selectSessionModel(sessionId, selection) {
    if (!selection?.provider || !selection?.model) return;
    const agent = await this.resolveAgent(sessionId);
    agent.model.select({ provider: selection.provider, model: selection.model });
  }

  async renameSession(store, sessionId, title) {
    const clean = String(title).trim().slice(0, 120);
    if (!clean) return;
    await store.setTitle(sessionId, clean, 'manual');
    try {
      await this.ctx.sessionController.rename({ sessionId, title: clean });
    } catch {
      // sidecar title still renders; native rename is best effort
    }
  }

  async compress({ project, sessionId }) {
    await this.findRow(project, sessionId);
    const agent = this.ctx.agents.get(sessionId);
    if (!agent) {
      throw new HttpError(409, 'session-not-live', '压缩需要会话已在运行中的 Agent；请先在 DSH 中打开该会话。');
    }
    if (agent.status === 'running') {
      throw new HttpError(409, 'session-busy', '会话正在运行，压缩需要空闲的 Agent；请等本轮结束后再试。');
    }
    const controller = new AbortController();
    try {
      if (this.ctx.get?.('compaction')?.compactNow) {
        await this.ctx.get('compaction').compactNow(agent, controller.signal);
      } else {
        const commands = this.ctx.get?.('commands');
        if (!commands?.execute) throw new Error('命令服务不可用');
        const execution = await commands.execute(agent, '/compact', [], controller.signal);
        if (!execution) throw new Error('压缩命令不可用');
        if (execution.result?.kind === 'error') throw new Error(execution.result.text);
      }
    } catch (error) {
      throw new HttpError(409, 'compact-failed', `压缩失败：${String(error?.message ?? error)}`);
    }
    const { row } = await this.findRow(project, sessionId);
    return { ok: true, context: row.context };
  }

  async stop({ project, sessionId }) {
    const { store } = await this.findRow(project, sessionId);
    const state = await store.read();
    await store.stopSession(sessionId, {
      parentSessionId: state.lineage?.[sessionId],
    });
    await store.update((next) => {
      delete next.pinned?.[sessionId];
    });
    return this.state({ project });
  }

  async restore({ project, sessionId }) {
    const store = this.storeFor(project);
    await store.restoreSession(sessionId);
    await store.update((state) => {
      state.pinned = { ...(state.pinned ?? {}), [sessionId]: true };
    });
    return this.state({ project });
  }

  async untracked({ project }) {
    const { untracked, store } = await this.collect(project);
    return { ok: true, items: untracked, history: await store.history(20) };
  }

  /** Every real Session in the project, with its current tracking state. */
  async allSessions({ project }) {
    const { allSessions } = await this.collect(project);
    return { ok: true, items: allSessions };
  }

  /**
   * The plan state of the project's Router Agent session.
   *
   * The composer's mode is a dispatch setting for the target Session, but the
   * panel can otherwise open in a saved "plan" state while the Router session
   * itself is not in plan mode. The client reads this on project entry so the
   * two never disagree. It never creates or resumes the RA.
   */
  async raMode({ project }) {
    const store = this.storeFor(project);
    const state = await store.read();
    if (!state.raSessionId) return { ok: true, sessionId: null, plan: false };
    let projection = null;
    try {
      projection = await this.ctx.sessionController.projections(
        { sessionId: state.raSessionId },
        new AbortController().signal,
      );
    } catch {
      // The router preset does not mount plan mode; an unreadable projection
      // is treated as standard rather than resurrecting a saved "plan".
    }
    return {
      ok: true,
      sessionId: state.raSessionId,
      plan: !!projection?.values?.plan?.active,
    };
  }

  /**
   * Apply one batch of checkbox changes from the all-sessions dialog.
   *
   * Checking means "include in the index": clear a manual stop and pin the
   * Session so the tracking window cannot drop it. Unchecking means "stop
   * tracking": remove the pin and record the manual stop. Unknown ids are
   * rejected so the API cannot write arbitrary rows into the sidecar.
   */
  async tracking({ project, track, untrack }) {
    const ids = (value) =>
      Array.isArray(value)
        ? [...new Set(value.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim()))]
        : [];
    const add = ids(track);
    const remove = ids(untrack);
    if (add.length === 0 && remove.length === 0) return { ok: true, changed: 0 };
    const collected = await this.collect(project);
    const known = new Set(collected.allSessions.map((item) => item.sessionId));
    const tracked = new Set(collected.rows.map((row) => row.sessionId));
    for (const sessionId of add) {
      if (!known.has(sessionId)) {
        throw new HttpError(404, 'session-not-found', '该会话不在当前项目中。');
      }
    }
    for (const sessionId of remove) {
      if (!tracked.has(sessionId)) {
        throw new HttpError(400, 'session-not-tracked', '该会话不在跟踪范围内。');
      }
    }
    const parentOf = Object.fromEntries(
      collected.rows.map((row) => [row.sessionId, row.parentSessionId]),
    );
    await collected.store.setTracking({ track: add, untrack: remove, parentOf });
    return this.state({ project });
  }

  async history({ project, limit }) {
    const store = this.storeFor(project);
    return { ok: true, items: (await store.history(limit ?? 100)).reverse() };
  }

  async saveSettings({ project, settings }) {
    const store = this.storeFor(project);
    const state = await store.read();
    const has = (key) => !!settings && Object.hasOwn(settings, key);
    const patch = {};
    // Only touch fields the caller actually sent: a partial update must not
    // reset the layout, and an explicit null must be able to clear a model.
    if (has('layout')) patch.layout = settings.layout === 'horizontal' ? 'horizontal' : 'vertical';
    if (has('raModel')) patch.raModel = validModel(settings.raModel);
    if (has('indexModel')) patch.indexModel = validModel(settings.indexModel);
    if (has('defaultSessionModel')) patch.defaultSessionModel = validModel(settings.defaultSessionModel);
    if (has('autoAsk') && AUTO_ASK_VALUES.has(settings.autoAsk)) patch.autoAsk = settings.autoAsk;
    if (has('trackingDays')) {
      const days = Number(settings.trackingDays);
      if (Number.isFinite(days) && days >= 1 && days <= 365) patch.trackingDays = Math.round(days);
    }
    if (settings?.composer) {
      patch.composer = {
        ...state.settings.composer,
        ...(settings.composer.mode === 'plan' || settings.composer.mode === 'standard'
          ? { mode: settings.composer.mode }
          : {}),
        ...(typeof settings.composer.permissions === 'string' &&
        ['read-only', 'workspace-write', 'danger-full-access'].includes(settings.composer.permissions)
          ? { permissions: settings.composer.permissions }
          : {}),
        ...(typeof settings.composer.auto === 'boolean' ? { auto: settings.composer.auto } : {}),
      };
    }
    const saved = await store.setSettings(patch);
    if (has('trackingDays') && saved.settings.trackingDays) {
      // Keep the legacy field in sync for older readers, and drop the project
      // list cache so the new window is visible on the next poll.
      await store.update((state) => {
        state.tracking.days = saved.settings.trackingDays;
      });
      this.raIdCache.delete(resolve(project).toLowerCase());
    }
    if (has('raModel') && state.raSessionId) {
      const agent = this.ctx.agents.get(state.raSessionId);
      if (agent) {
        if (saved.settings.raModel) {
          await this.applyRAModel(agent, saved);
        } else {
          // Clearing the override means "follow the deployment default". A
          // resumed Agent keeps its recorded route unless the catalog's
          // default is selected explicitly.
          const catalog = await this.modelCatalog();
          if (catalog?.default?.provider && catalog?.default?.model) {
            try {
              agent.model.select({ provider: catalog.default.provider, model: catalog.default.model });
            } catch {
              // The catalog default is advisory; the next request reports an
              // unavailable route.
            }
          }
        }
      }
    }
    return { ok: true, settings: saved.settings };
  }

  async rename({ project, sessionId, title }) {
    await this.findRow(project, sessionId);
    const store = this.storeFor(project);
    const clean = String(title ?? '').trim().slice(0, 120);
    if (!clean) throw new HttpError(400, 'empty-title', '名称不能为空。');
    await store.setTitle(sessionId, clean, 'manual');
    try {
      await this.ctx.sessionController.rename({ sessionId, title: clean });
    } catch {
      // sidecar is authoritative for display
    }
    return { ok: true, title: clean };
  }

  /**
   * Start the onboarding queue once per project. The caller has already
   * decided that indexing is allowed (user confirmation, or a persisted
   * `running` state that is being resumed after a Host restart).
   */
  startIndexing(project, rows) {
    const indexKey = resolve(project).toLowerCase();
    if (this.indexing.has(indexKey) || rows.length === 0) return false;
    this.indexing.add(indexKey);
    const store = this.storeFor(project);
    this.pipelineFor(project)
      .indexRows(rows, { onboarding: true })
      .catch(async (error) => {
        // A failure outside one row's build (progress/state write, queue
        // failure) must not leave the overlay spinning forever.
        await store
          .onboarding({
            status: 'failed',
            current: null,
            completedAt: new Date().toISOString(),
            failed: [{ sessionId: null, message: String(error?.message ?? error) }],
          })
          .catch(() => {});
      })
      .finally(() => this.indexing.delete(indexKey));
    return true;
  }

  /**
   * User-confirmed first index.
   *
   * `collect()` deliberately never starts model calls on an untouched project.
   * The panel shows the confirmation card, and this operation is the place
   * that flips the onboarding state to `running`. `action: 'skip'` remembers
   * “later”; the project stays browsable and routable with titles/extractive
   * briefs.
   */
  async onboardingOp({ project, action }) {
    const store = this.storeFor(project);
    const state = await store.read();
    if (action === 'reset') {
      // Dev-only: let the acceptance suite put a project back into the
      // pre-confirmation state without re-seeding the whole profile.
      if (!this.config.dev) throw new HttpError(404, 'unknown-action', 'Unknown onboarding action.');
      await store.onboarding({
        status: 'awaiting',
        current: null,
        startedAt: null,
        completedAt: null,
        failed: [],
      });
      return this.state({ project });
    }
    if (action === 'skip') {
      const { rows } = await this.collect(project);
      await store.onboarding({
        status: 'skipped',
        total: rows.length,
        done: state.onboarding.done ?? 0,
        current: null,
        completedAt: null,
      });
      return this.state({ project });
    }
    const { rows } = await this.collect(project);
    if (rows.length === 0) {
      await store.onboarding({
        status: 'complete',
        total: 0,
        done: 0,
        current: null,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        failed: [],
      });
      return { ok: true, total: 0 };
    }
    await store.onboarding({
      status: 'running',
      total: rows.length,
      done: state.onboarding.done ?? 0,
      startedAt:
        action === 'retry' || !state.onboarding.startedAt
          ? new Date().toISOString()
          : state.onboarding.startedAt,
      completedAt: null,
      current: null,
      failed: [],
    });
    this.startIndexing(project, rows);
    return { ok: true, total: rows.length };
  }

  async debug() {
    const out = { query: null, controller: null, workspaces: null };
    try {
      const registry = this.ctx.get?.('workspaceRegistry');
      out.workspaces = registry?.list?.().map((workspace) => ({
        workspaceId: String(workspace.id),
        path: workspace.path,
        sessionIds: [...workspace.sessionIds],
      })) ?? null;
    } catch (error) {
      out.workspaces = { error: String(error?.stack ?? error) };
    }
    try {
      const records = await this.ctx.sessionQuery.listSessions();
      out.query = {
        count: records.length,
        items: records.map((record) => ({
          id: record.header.id,
          cwd: record.header.cwd,
          live: record.live,
          persisted: record.persisted,
          formatStatus: record.formatStatus,
        })),
      };
    } catch (error) {
      out.query = { error: String(error?.stack ?? error) };
    }
    try {
      const items = await this.reader.summaries();
      out.controller = {
        count: items.length,
        items: items.map((item) => ({ id: item.sessionId, cwd: item.cwd, updatedAt: item.updatedAt })),
      };
    } catch (error) {
      out.controller = { error: String(error?.stack ?? error) };
    }
    return out;
  }

  async debugAgent(sessionId) {
    const agent = this.ctx.agents.get(sessionId);
    if (!agent) return { ok: false, error: 'agent-not-live' };
    const tools = this.ctx.get('tools');
    let names = [];
    let toolError = null;
    try {
      names = tools.schemas(agent).map((schema) => schema.name);
    } catch {
      try {
        names = tools.schemas(agent.ctx).map((schema) => schema.name);
      } catch (inner) {
        toolError = String(inner?.message ?? inner);
      }
    }
    return { ok: true, preset: agent.session.header.agentPreset, status: agent.status, tools: names, toolError };
  }
}

function validModel(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.provider !== 'string' || typeof value.model !== 'string') return null;
  return {
    provider: value.provider,
    model: value.model,
    ...(typeof value.reasoningEffort === 'string' ? { reasoningEffort: value.reasoningEffort } : {}),
  };
}

/** Flatten the text blocks of one DSH message. */
function messageText(message) {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');
}

const TASK_LINE = /用户任务：([\s\S]*?)(?:\n派发设置：|$)/;
const SETTINGS_LINE =
  /派发设置：模式=(计划模式|标准)；工作区权限=(read-only|workspace-write|danger-full-access)；自动执行=(开启|关闭)。/;

/**
 * Parse the Host-owned task envelope out of one RA user message.
 *
 * The envelope is the durable task source: it is written both when a task is
 * queued and when a question is answered, so a queued answer keeps the task it
 * belongs to even if a newer task is waiting behind it.
 *
 * @param {string} text Full user message text.
 * @returns {{ task: string, composer: object | null } | null}
 */
export function parseTaskEnvelope(text) {
  const taskMatch = TASK_LINE.exec(String(text ?? ''));
  if (!taskMatch) return null;
  const task = taskMatch[1].trim();
  if (!task) return null;
  const settings = SETTINGS_LINE.exec(text);
  return {
    task,
    composer: settings
      ? {
          mode: settings[1] === '计划模式' ? 'plan' : 'standard',
          permissions: settings[2],
          auto: settings[3] === '开启',
        }
      : null,
  };
}

/** The one-line dispatch-settings envelope appended to an RA prompt. */
function composerLine(composer) {
  return `派发设置：模式=${composer.mode === 'plan' ? '计划模式' : '标准'}；工作区权限=${composer.permissions}；自动执行=${composer.auto ? '开启' : '关闭'}。`;
}
