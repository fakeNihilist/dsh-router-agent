import { extractiveBrief } from '../session-reader.js';
import { redactBrief, redactSecrets } from '../util/redact.js';

const SYSTEM = `你是 DeepSeek Harness 的会话索引器。你的输出只写入项目本地的 .dsh_RA 索引，不会改动会话本身。
阅读给定的一轮轮对话摘录，输出严格 JSON，不要 Markdown，不要解释。字段：
{
  "overview": "2-3 句中文，说明这个会话在做什么、当前进展、下一步；不要写寒暄",
  "topics": ["最多 8 个短主题词"],
  "decisions": ["最多 8 条已经确认的决定或结论，每条不超过 60 字"],
  "files": ["对话中实际出现过的文件路径，最多 12 条"],
  "boundaries": [{"turn": 3, "label": "以 12 字内概括这一轮之后的状态"}]
}
boundaries 只覆盖输入中给出的已完成轮次；turn 必须原样使用输入里的轮次号。不要编造文件中没有的路径。`;

function clipLine(value, max) {
  const flat = String(value ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

/**
 * Build the summarizer input under a bounded character budget.
 *
 * The budget is an approximation of tokens (Chinese text is roughly one token
 * per character, so treating the token budget as a character budget is
 * conservative for English and correct for CJK). Keeping it bounded means a
 * long session cannot exceed the summary model's context or turn a cheap
 * background index into an expensive request.
 *
 * @param {object} row Tracked session row with `analysis`.
 * @param {object} brief Base brief (title).
 * @param {number} maxChars Character budget.
 * @returns {string} Prompt input.
 */
export function buildSummaryInput(row, brief, maxChars = 8000) {
  const budget = Math.max(1500, Number(maxChars) || 8000);
  const contentBudget = Math.max(1200, budget - 300);
  const promptBudget = Math.floor(contentBudget * 0.42);
  const answerBudget = Math.floor(contentBudget * 0.34);
  const boundaryBudget = Math.floor(contentBudget * 0.16);
  const fileBudget = Math.max(200, contentBudget - promptBudget - answerBudget - boundaryBudget);

  const prompts = [];
  let used = 0;
  for (const prompt of row.analysis.prompts.slice(-12)) {
    if (used >= promptBudget) break;
    const text = `用户: ${clipLine(redactSecrets(prompt.text), 400)}`;
    if (text.length > promptBudget - used) break;
    prompts.push(text);
    used += text.length + 1;
  }

  const answers = [];
  used = 0;
  for (const answer of row.analysis.answers.slice(-6)) {
    if (used >= answerBudget) break;
    const text = `助手: ${clipLine(redactSecrets(answer.text), 600)}`;
    if (text.length > answerBudget - used) break;
    answers.push(text);
    used += text.length + 1;
  }

  const boundaries = [];
  used = 0;
  for (const boundary of row.analysis.boundaries.slice(-24)) {
    if (used >= boundaryBudget) break;
    const text = `T${boundary.turn} ${clipLine(redactSecrets(boundary.label), 40)}`;
    if (text.length > boundaryBudget - used) break;
    boundaries.push(text);
    used += text.length + 1;
  }

  const files = [];
  used = 0;
  for (const file of row.analysis.files.slice(0, 20)) {
    if (used >= fileBudget) break;
    const text = clipLine(redactSecrets(file), 160);
    if (text.length > fileBudget - used) break;
    files.push(text);
    used += text.length + 1;
  }

  return [
    `会话标题：${redactSecrets(brief.title)}`,
    `总轮数：${row.analysis.turns}`,
    '',
    `已完成轮次（最多 ${boundaries.length} 条，atSeq 由 Host 另行映射）：`,
    boundaries.length ? boundaries.join('\n') : '（无）',
    '',
    '用户任务摘录：',
    prompts.length ? prompts.join('\n') : '（无）',
    '',
    '助手最近回复摘录：',
    answers.length ? answers.join('\n') : '（无）',
    '',
    '出现过的文件：',
    files.length ? files.join('\n') : '（无）',
  ].join('\n');
}

function parseJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('summarizer returned no JSON object');
  return JSON.parse(candidate.slice(start, end + 1));
}

function cleanStrings(value, max, length) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, length))
    .slice(0, max);
}

/**
 * Build and incrementally refresh the internal briefs.
 *
 * The first run indexes only the sessions inside the tracking window. A brief
 * is written before the next session starts, so a crash loses at most the
 * in-flight row and the onboarding queue resumes from `.dsh_RA/state.json`.
 */
export class BriefPipeline {
  constructor(store, reader, config = {}) {
    this.store = store;
    this.reader = reader;
    this.ctx = reader.ctx;
    this.config = config;
    this.queue = [];
    this.active = 0;
    this.timer = null;
    this.running = null;
    this.lifetime = new AbortController();
  }

  get concurrency() {
    return Math.max(1, Number(this.config.summaryConcurrency) || 2);
  }

  get timeout() {
    return Math.max(5000, Number(this.config.summaryTimeoutMs) || 45000);
  }

  get maxInputChars() {
    return Math.max(1500, Number(this.config.autoSummaryMaxInputTokens) || 8000);
  }

  async model() {
    const state = await this.store.read();
    if (state.settings?.raModel?.provider && state.settings?.raModel?.model) return state.settings.raModel;
    try {
      const catalog = await this.ctx.sessionController.modelCatalog();
      if (catalog?.default?.provider && catalog?.default?.model) return catalog.default;
      const group = catalog?.groups?.find((item) => item.models?.length);
      if (group) return { provider: group.id, model: group.models[0].id };
    } catch {
      // No catalog is a normal offline state; extractive briefs still work.
    }
    return null;
  }

  /** Build or refresh one brief from a session record. */
  async build(row, { useLlm = this.config.summaryUseLlm !== false } = {}) {
    if (Number(this.config.summaryDelayMs) > 0) {
      await new Promise((resolve) => setTimeout(resolve, Number(this.config.summaryDelayMs)));
    }
    const state = await this.store.read();
    const previous = await this.store.getBrief(row.sessionId);
    const native = row.analysis.title;
    const sidecar = state.titles[row.sessionId];
    const title = sidecar?.title ?? previous?.manual?.title ?? previous?.title ?? native ?? fallbackTitle(row);
    const base = {
      sessionId: row.sessionId,
      title,
      titleSource: sidecar ? 'sidecar' : previous?.manual?.title ? 'manual' : native ? 'native' : 'generated',
      nativeTitle: native,
      turns: row.analysis.turns,
      lastActiveAt: row.lastActiveAt || row.analysis.lastActiveAt,
      boundaries: row.analysis.boundaries.map((boundary) => ({
        turn: boundary.turn,
        atSeq: boundary.atSeq,
        messageId: boundary.messageId,
        label: boundary.label,
      })),
      files: row.analysis.files,
      manual: previous?.manual ?? { title: null, overview: null },
      summarizedThroughSeq: row.analysis.lastSeq,
      updatedAt: new Date().toISOString(),
    };

    let result = extractiveBrief(row.analysis, title);
    let status = 'fallback';
    let parsed = null;
    if (useLlm) {
      const model = await this.model();
      const llm = this.ctx.get?.('llm');
      if (model && typeof llm?.stream === 'function') {
        try {
          const text = await this.llmText(llm, model, buildSummaryInput(row, base, this.maxInputChars));
          parsed = parseJson(text);
          result = {
            title,
            overview: typeof parsed.overview === 'string' ? parsed.overview.slice(0, 800) : result.overview,
            topics: cleanStrings(parsed.topics, 8, 40).length ? cleanStrings(parsed.topics, 8, 40) : result.topics,
            decisions: cleanStrings(parsed.decisions, 8, 120).length
              ? cleanStrings(parsed.decisions, 8, 120)
              : result.decisions,
            files: cleanStrings(parsed.files, 12, 240).length ? cleanStrings(parsed.files, 12, 240) : result.files,
          };
          status = 'ready';
        } catch {
          status = 'fallback';
        }
      }
    }

    // Boundary labels may come from the same summary call, but atSeq and
    // messageId always come from the actual turn/end event, never from model
    // output.
    let boundaries = base.boundaries;
    if (parsed) {
      const labels = new Map(
        Array.isArray(parsed.boundaries)
          ? parsed.boundaries
              .filter((item) => Number.isInteger(item?.turn) && typeof item?.label === 'string')
              .map((item) => [item.turn, item.label.slice(0, 40)])
          : [],
      );
      boundaries = boundaries.map((boundary) => ({
        ...boundary,
        label: labels.get(boundary.turn) ?? boundary.label,
      }));
    }

    const brief = redactBrief({
      ...base,
      overview: base.manual?.overview ?? result.overview,
      topics: result.topics,
      decisions: result.decisions,
      files: result.files,
      boundaries,
      summaryStatus: status,
    });
    await this.store.saveBrief(brief);
    return brief;
  }

  async llmText(llm, model, input) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('summary timeout')), this.timeout);
    const signal = AbortSignal.any([controller.signal, this.lifetime.signal]);
    try {
      const stream = llm.stream({
        provider: model.provider,
        model: model.model,
        ...(model.reasoningEffort ? { reasoningEffort: model.reasoningEffort } : {}),
        system: SYSTEM,
        messages: [{ role: 'user', content: [{ type: 'text', text: input }] }],
        temperature: 0,
        maxTokens: Math.max(600, Number(this.config.summaryMaxOutputTokens) || 1200),
        signal,
      });
      let text = '';
      for await (const chunk of stream) {
        if (chunk?.type === 'text-delta') text += chunk.text;
      }
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Ensure one brief exists and is current; used by detail/brief tools. */
  async ensure(row) {
    const brief = await this.store.getBrief(row.sessionId);
    if (brief && brief.summarizedThroughSeq >= row.analysis.lastSeq) return brief;
    return this.build(row);
  }

  /**
   * Index a set of rows, respecting the configured concurrency. Progress is
   * persisted so the onboarding overlay survives a Host restart, but writes
   * are throttled: one state rewrite per row would multiply the poll I/O.
   */
  async indexRows(rows, { onboarding = false } = {}) {
    const unique = [...new Map(rows.map((row) => [row.sessionId, row])).values()];
    // Resume support: a brief that already covers the log is skipped, so a
    // Host restart mid-onboarding continues instead of redoing every row.
    const todo = [];
    let done = 0;
    for (const row of unique) {
      const brief = await this.store.getBrief(row.sessionId);
      if (brief && brief.summarizedThroughSeq >= row.analysis.lastSeq) {
        done += 1;
      } else {
        todo.push(row);
      }
    }
    if (onboarding) {
      const state = await this.store.read();
      await this.store.onboarding({
        status: 'running',
        total: unique.length,
        done,
        startedAt: state.onboarding.startedAt ?? new Date().toISOString(),
        completedAt: null,
        current: null,
        failed: [],
      });
    }
    let index = 0;
    let lastProgress = 0;
    let lastCurrent = 0;
    const failed = [];
    const publish = async (force = false) => {
      if (!onboarding) return;
      const now = Date.now();
      if (!force && now - lastProgress < 300) return;
      lastProgress = now;
      await this.store.onboarding({ done, current: null, failed }).catch(() => {});
    };
    const worker = async () => {
      while (index < todo.length) {
        const row = todo[index++];
        if (onboarding) {
          const now = Date.now();
          if (now - lastCurrent >= 300) {
            lastCurrent = now;
            await this.store.onboarding({ current: row.sessionId }).catch(() => {});
          }
        }
        try {
          await this.build(row);
          done += 1;
        } catch (error) {
          failed.push({ sessionId: row.sessionId, message: String(error?.message ?? error) });
        }
        await publish();
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, Math.max(1, todo.length)) }, worker));
    if (onboarding) {
      await this.store.onboarding({
        status: 'complete',
        done,
        current: null,
        completedAt: new Date().toISOString(),
        failed,
      });
    }
    return { done, failed };
  }

  /** Debounced refresh after a turn ends; safe to call repeatedly. */
  schedule(rows) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.indexRows(rows).catch(() => {});
    }, Math.max(200, Number(this.config.summaryDebounceMs) || 1200));
  }

  dispose() {
    clearTimeout(this.timer);
    this.lifetime.abort(new Error('brief pipeline disposed'));
  }
}

function fallbackTitle(row) {
  const first = row.analysis.prompts.find((prompt) => prompt.text)?.text ?? '';
  const flat = first.replace(/\s+/g, ' ').trim();
  return flat ? flat.slice(0, 18) : '未命名会话';
}
