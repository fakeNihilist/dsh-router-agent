/**
 * Router Agent preset plugin.
 *
 * This module is the only child of the `router` agent preset. It registers
 * exactly four model-facing tools and restricts inherited global tools to the
 * same four names. The Router Agent therefore cannot read files, run commands,
 * browse, spawn subagents, or send a task by itself: `ra_propose` only writes a
 * proposal that the Host executes after user confirmation (or an explicit
 * auto-mode opt-in).
 */

export const name = 'router-tools';
export const inject = ['routerAgent', 'tools', 'systemPrompt'];

const TOOL_NAMES = ['ra_tree', 'ra_brief', 'ra_history', 'ra_propose'];

const POLICY = `You are the Router Agent for one project. You do not read code, edit files, run commands, or send tasks.

Your only job is to choose how the user's task should enter the project's existing sessions:
1. route — the task extends an existing session; send it there.
2. fork — the task belongs to a session but must start from an earlier turn boundary, leaving the source conversation untouched.
3. new — the task is unrelated, or no existing session is a usable base; start a clean session.
4. ask — the choice is genuinely ambiguous; ask the user one short question.

Use ra_tree first to see tracked sessions. Use ra_brief for the full index of one candidate. Use ra_history to avoid repeating a rejected recommendation. Then call ra_propose exactly once with the task text, the action, the target session and (for fork) the turn boundary, and a one-sentence reason.

Rules:
- Never invent a session id or a boundary. Only use ids and atSeq values returned by the tools.
- Prefer route when the existing session already holds the relevant context.
- Prefer fork when later turns of a session are about a different direction than the new task.
- Prefer new only when no tracked session is a reasonable base. A new session starts clean; there is no handoff pack.
- If two sessions are equally plausible, choose the one with a more recent relevant turn, and state the alternative in the reason.
- Do not call ra_propose more than once per user task unless the first proposal was rejected with new information.
- Keep replies short: what you chose, where it goes, and why.`;

/** Tool results must be lossless JSON; drop undefined fields and non-finite numbers. */
const clean = (value) => JSON.parse(JSON.stringify(value));

const output = (properties) => ({
  schema: {
    type: 'object',
    additionalProperties: true,
    properties,
  },
  render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
});

export function apply(ctx) {
  ctx.systemPrompt?.section?.({
    name: 'router-agent:policy',
    order: 40,
    text: POLICY,
  });

  // A restriction is inherited by the Agents that compose this preset. An
  // allow-list cannot express "the four scoped tools": `restrict()` rejects
  // scope-local names, and an empty allow-list would hide them from the Agent
  // view too. Deny the inherited global names instead, refresh that deny set
  // when another plugin (MCP, a later row) registers a new global tool, and
  // keep a guard as the execution backstop for anything the schema filter
  // cannot hide (including the reserved `run_code` name).
  const denied = new Set();
  let applying = false;
  const restrictInherited = () => {
    if (applying) return;
    applying = true;
    try {
      const names = (ctx.tools.schemas(undefined) ?? [])
        .map((schema) => schema.name)
        .filter(
          (toolName) =>
            toolName !== 'run_code' && !TOOL_NAMES.includes(toolName) && !denied.has(toolName),
        );
      if (names.length > 0) {
        ctx.tools.restrict({ deny: names });
        for (const toolName of names) denied.add(toolName);
      }
    } finally {
      applying = false;
    }
  };
  // The initial application is deliberately allowed to fail the preset: a
  // boundary that cannot be installed must not silently expose global tools.
  restrictInherited();
  ctx.effect(
    () =>
      ctx.root.on?.('tools/change', () => {
        try {
          restrictInherited();
        } catch (error) {
          ctx.logger?.warn?.('[dsh-router-agent] dynamic tools.restrict failed: %o', error);
        }
      }),
    'dsh-router-agent: tool boundary',
  );
  if (typeof ctx.tools.guard !== 'function') {
    throw new Error('tools.guard is unavailable; refusing to activate an unrestricted Router preset');
  }
  ctx.tools.guard((execution) =>
    TOOL_NAMES.includes(execution.name)
      ? undefined
      : { reason: 'The Router Agent may only call ra_tree / ra_brief / ra_history / ra_propose.' },
  );

  const service = ctx.routerAgent;

  ctx.tools.register({
    name: 'ra_tree',
    description:
      'List the tracked sessions of this project with id, title, last activity, turn count, context usage, and available fork boundaries. Start here.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        includeStopped: {
          type: 'boolean',
          description:
            'Also return how many sessions the user stopped tracking. Stopped sessions are not routable until the user restores them.',
        },
      },
    },
    output: output({
      project: { type: 'string' },
      sessions: { type: 'array' },
      stoppedCount: { type: 'number' },
      note: { type: 'string' },
    }),
    async execute(args, exec) {
      return clean(await service.raTree(exec.agent, args ?? {}));
    },
  });

  ctx.tools.register({
    name: 'ra_brief',
    description:
      'Read the internal brief of one tracked session: overview, topics, files, decisions, and the exact fork boundaries with turn, atSeq, and message id.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sessionId: { type: 'string', description: 'Session id from ra_tree.' },
      },
      required: ['sessionId'],
    },
    output: output({
      sessionId: { type: 'string' },
      title: { type: 'string' },
      overview: { type: 'string' },
      topics: { type: 'array' },
      files: { type: 'array' },
      boundaries: { type: 'array' },
      context: { type: 'object' },
    }),
    async execute(args, exec) {
      return clean(await service.raBrief(exec.agent, args?.sessionId));
    },
  });

  ctx.tools.register({
    name: 'ra_history',
    description:
      'Read recent routing decisions in this project: task, action, target, reason, result, and whether the user confirmed or auto mode executed it.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: { type: 'number', description: 'Maximum rows, 1-50. Defaults to 12.' },
      },
    },
    output: output({
      items: { type: 'array' },
    }),
    async execute(args, exec) {
      return clean(await service.raHistory(exec.agent, args?.limit));
    },
  });

  ctx.tools.register({
    name: 'ra_propose',
    description:
      'Propose one routing decision. This does NOT send anything: the Host writes a proposal and the user confirms it, unless the user explicitly enabled auto mode. Call once per task.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: {
          type: 'string',
          enum: ['route', 'fork', 'new', 'ask'],
          description: 'route = continue a session; fork = branch at a boundary; new = clean session; ask = ask the user.',
        },
        task: {
          type: 'string',
          description: "The user's task text to deliver. Required for route, fork, and new.",
        },
        targetSessionId: {
          type: 'string',
          description: 'Target session for route or fork. Must come from ra_tree.',
        },
        atSeq: {
          type: 'number',
          description: 'For fork: the inclusive turn/end event seq from ra_brief boundaries.',
        },
        title: {
          type: 'string',
          description: 'Optional short title for a new or forked session.',
        },
        question: {
          type: 'string',
          description: 'For ask: the one question the user must answer.',
        },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'For ask: optional short choices.',
        },
        reason: {
          type: 'string',
          description: 'One sentence explaining the choice, shown to the user.',
        },
      },
      required: ['action', 'reason'],
    },
    output: output({
      token: { type: 'string' },
      action: { type: 'string' },
      summary: { type: 'string' },
      confirmRequired: { type: 'boolean' },
    }),
    async execute(args, exec) {
      return clean(await service.raPropose(exec.agent, args ?? {}));
    },
  });
}
