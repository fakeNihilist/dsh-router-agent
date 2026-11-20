import { basename, resolve } from 'node:path';

const DAY = 24 * 3600 * 1000;
const cache = new Map();
const CACHE_LIMIT = 64;

const norm = (value) => (typeof value === 'string' ? resolve(value).toLowerCase() : '');

function truncate(text, max = 28) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function messageText(message) {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');
}

function userText(event) {
  if (event?.type !== 'user/message') return '';
  if (event.data?.source?.kind !== 'user') return '';
  return messageText(event.data);
}

function assistantText(event) {
  if (event?.type !== 'assistant/message') return '';
  return messageText(event.data?.message);
}

/** Whether two cwd spellings name the same directory. */
export function sameProject(left, right) {
  return !!left && !!right && norm(left) === norm(right);
}

/** Extract human and machine facts from one V4 event log. */
export function analyzeEvents(events) {
  let title = null;
  let turns = 0;
  let lastSeq = -1;
  let lastActiveAt = 0;
  let contextWindow = null;
  let pressure = null;
  const boundaries = [];
  const files = new Set();
  const prompts = [];
  const answers = [];
  const open = new Map();

  for (const event of events) {
    lastSeq = Math.max(lastSeq, Number(event.seq) || 0);
    lastActiveAt = Math.max(lastActiveAt, Number(event.time) || 0);
    if (event.type === 'session/title' && typeof event.data?.title === 'string') {
      title = event.data.title;
    } else if (event.type === 'request/context' && Number.isFinite(event.data?.contextWindow)) {
      contextWindow = event.data.contextWindow;
    } else if (event.type === 'turn/start') {
      turns += 1;
      open.set(event.data?.turn, { turn: event.data?.turn, startTime: event.time, user: null });
    } else if (event.type === 'user/message' && event.data?.source?.kind === 'user') {
      const text = userText(event);
      const prompt = { text, messageId: event.data?.id ?? null, time: event.time, turn: null };
      prompts.push(prompt);
      for (const value of open.values()) {
        if (value.user === null && event.time >= value.startTime) {
          value.user = prompt;
          prompt.turn = value.turn;
          break;
        }
      }
    } else if (event.type === 'assistant/message') {
      const text = assistantText(event);
      if (text) answers.push({ text, time: event.time, turn: event.data?.turn });
      const usage = event.data?.usage;
      if (usage) {
        const used =
          (Number(usage.inputTokens) || 0) +
          (Number(usage.cacheReadTokens) || 0) +
          (Number(usage.cacheWriteTokens) || 0);
        if (used > 0) pressure = used;
      }
    } else if (event.type === 'turn/end') {
      const turn = event.data?.turn;
      const state = open.get(turn);
      if (state) {
        boundaries.push({
          turn,
          atSeq: event.seq,
          messageId: state.user?.messageId ?? null,
          label: truncate(state.user?.text ?? `第 ${turn} 轮`, 26),
          time: event.time,
        });
        open.delete(turn);
      }
    } else if (event.type === 'tool/call') {
      const raw = event.data?.arguments;
      if (typeof raw === 'string') {
        try {
          const args = JSON.parse(raw);
          for (const key of ['path', 'file_path', 'filePath', 'target', 'pattern']) {
            if (typeof args?.[key] === 'string' && args[key].length < 260) {
              files.add(args[key]);
            }
          }
        } catch {
          // Tool arguments are model output; a malformed call simply contributes no file.
        }
      }
    }
  }

  boundaries.sort((a, b) => a.turn - b.turn);
  return {
    title,
    turns,
    lastSeq,
    lastActiveAt,
    contextWindow,
    pressure,
    boundaries,
    files: [...files].slice(0, 24),
    prompts,
    answers,
  };
}

/** Extractive brief used when no summarizer model is available or it fails. */
export function extractiveBrief(analysis, fallbackTitle) {
  const promptText = analysis.prompts.map((row) => row.text).filter(Boolean);
  const answerText = analysis.answers.map((row) => row.text).filter(Boolean);
  const overviewParts = [];
  if (promptText.length > 0) overviewParts.push(`任务：${truncate(promptText[0], 120)}`);
  if (promptText.length > 1) overviewParts.push(`后续：${truncate(promptText.at(-1), 120)}`);
  if (answerText.length > 0) overviewParts.push(`最近进展：${truncate(answerText.at(-1), 160)}`);
  const topics = [];
  const seen = new Set();
  for (const file of analysis.files) {
    const name = basename(file.replaceAll('\\', '/'));
    if (name && !seen.has(name)) {
      seen.add(name);
      topics.push(name);
    }
    if (topics.length >= 8) break;
  }
  const decisions = answerText
    .flatMap((text) => text.split(/[。\n]/))
    .filter((line) => /已|改为|保留|决定|确认|采用/.test(line))
    .map((line) => truncate(line, 80))
    .slice(-6);
  return {
    title: fallbackTitle,
    overview: overviewParts.join('；') || '暂无足够内容生成概览。',
    topics,
    files: analysis.files,
    decisions,
  };
}

/**
 * Read-only Session access for the Router. One instance per Host process.
 *
 * Cold reads are cached by `(sessionId, updatedAt)`; the cache is small because
 * the panel only needs the tracked set. Nothing here writes a session event.
 */
export class SessionReader {
  constructor(ctx, config = {}) {
    this.ctx = ctx;
    this.config = config;
  }

  async summaries(signal) {
    const listed = await this.ctx.sessionController.list({}, signal ?? new AbortController().signal);
    const rows = Array.isArray(listed) ? listed : listed?.items ?? [];
    return rows;
  }

  async listProject(project, signal) {
    const summaries = await this.summaries(signal);
    const rows = [];
    for (const summary of summaries) {
      if (!sameProject(summary.cwd, project)) continue;
      rows.push(summary);
    }
    return rows;
  }

  async read(sessionId, updatedAt = 0) {
    // `updatedAt` is the list row's last *prompt* time, not the log tail; a
    // live session can gain a whole turn without changing it. Key live reads
    // by the live log sequence instead, otherwise a poll taken mid-turn pins
    // the analysis to that partial snapshot and turn/end never refreshes it.
    let live = null;
    try {
      live = this.ctx.sessions?.get?.(sessionId) ?? null;
    } catch {
      live = null;
    }
    const liveSeq = live ? Number(live.seq) : Number.NaN;
    const revision = Number.isFinite(liveSeq) ? `live:${liveSeq}` : `fold:${updatedAt}`;
    const hit = cache.get(sessionId);
    if (hit?.revision === revision) return hit.value;
    let snapshot;
    if (this.ctx.sessionQuery?.readSession) {
      snapshot = await this.ctx.sessionQuery.readSession(sessionId);
    } else {
      const current = this.ctx.sessions.get(sessionId);
      if (!current) throw new Error(`Session ${sessionId} is not readable without sessionQuery.readSession.`);
      snapshot = { session: current.header, events: current.snapshotEvents(), inheritedEventCount: 0 };
    }
    const value = {
      header: snapshot.session,
      events: snapshot.events ?? [],
      inheritedEventCount: snapshot.inheritedEventCount ?? 0,
      analysis: analyzeEvents(snapshot.events ?? []),
    };
    cache.set(sessionId, { revision, value });
    if (cache.size > CACHE_LIMIT) {
      const first = cache.keys().next().value;
      cache.delete(first);
    }
    return value;
  }

  /** Drop one session's cached analysis (used when the Host knows it moved). */
  invalidate(sessionId) {
    cache.delete(sessionId);
  }

  async projections(sessionId) {
    if (!this.ctx.sessionController?.projections) return null;
    try {
      return await this.ctx.sessionController.projections(
        { sessionId },
        new AbortController().signal,
      );
    } catch {
      return null;
    }
  }

  async context(sessionId, record, projection) {
    const values = projection?.values ?? {};
    const pressure = values.contextPressure;
    const window = Number(pressure?.contextWindow) || null;
    const used =
      Number(pressure?.projectedTokens) ||
      Number(pressure?.pressureTokens) ||
      Number(record?.analysis?.pressure) ||
      null;
    const limit = window || Number(record?.analysis?.contextWindow) || null;
    if (used !== null && limit) {
      return {
        usedTokens: used,
        limitTokens: limit,
        percent: Math.max(0, Math.min(999, Math.round((used / limit) * 100))),
        source: pressure ? 'projection' : 'fold',
      };
    }
    if (used !== null) {
      // A known usage with an unknown window is still useful information.
      return { usedTokens: used, limitTokens: null, percent: null, source: 'unknown' };
    }
    return { usedTokens: null, limitTokens: limit, percent: null, source: 'unknown' };
  }

  async derive(sessionId, summary, record) {
    const projection = await this.projections(sessionId);
    const values = projection?.values ?? {};
    const context = await this.context(sessionId, record, projection);
    const running =
      summary?.running ??
      this.ctx.agents.get(sessionId)?.status === 'running';
    // Prefer the log's last event time. The list row's updatedAt is the last
    // user prompt, which can lag a long turn or a fork's new activity.
    const lastActiveAt = Number(record?.analysis?.lastActiveAt) || Number(summary?.updatedAt) || 0;
    return {
      sessionId,
      title: values.title ?? record?.analysis?.title ?? summary?.projections?.values?.title ?? '未命名会话',
      nativeTitle: record?.analysis?.title ?? null,
      projectionTitle: values.title ?? null,
      updatedAt: lastActiveAt,
      turns: record?.analysis?.turns ?? 0,
      lastSeq: record?.analysis?.lastSeq ?? -1,
      boundaries: record?.analysis?.boundaries ?? [],
      context,
      running: !!running,
      live: !!summary?.agentAvailable,
      plan: values.plan ?? null,
      permissions: values.permissions?.currentValue ?? null,
      agentPreset: values.agentPreset ?? record?.header?.agentPreset ?? null,
      blank: !!summary?.blank,
      origin: record?.header?.origin ?? summary?.origin ?? null,
      parentSessionId: record?.header?.parentSession ?? summary?.parentSessionId ?? null,
      isSeeded: !!record?.header?.isSeeded,
      lastActiveAt,
    };
  }

  /** Labels for the canvas: time of day for today, “昨天”, then month/day. */
  static label(epoch, now = Date.now()) {
    if (!epoch) return '—';
    const date = new Date(epoch);
    const today = new Date(now);
    if (date.toDateString() === today.toDateString()) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    const yesterday = new Date(now - DAY);
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}
