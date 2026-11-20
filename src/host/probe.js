/**
 * M0 capability probe.
 *
 * Every unverified Host API in this plugin is probed once per process. The
 * result is persisted next to the project sidecar and also returned by
 * `/api/router/probe`, so the client can disable controls instead of pretending
 * a capability exists.
 *
 * Optional services are read with `ctx.get(name)`, never as properties: Cordis
 * throws on property access without a matching `inject`, and a missing optional
 * capability must not stop the plugin from loading.
 */

const has = (object, method) => !!(object && typeof object[method] === 'function');

/**
 * @param {object} ctx Host Cordis context.
 * @returns {object} a JSON-serializable capability report.
 */
export function probeHost(ctx) {
  const get = (name) => {
    try {
      return ctx.get?.(name);
    } catch {
      return undefined;
    }
  };
  const connection = get('connection');
  const app = get('app');
  const sessionProjections = get('sessionProjections');
  const compaction = get('compaction');
  const commands = get('commands');
  const planMode = get('planMode');
  const permissionPresets = get('permissionPresets');
  const sandboxPolicy = get('sandboxPolicy');
  const approval = get('approval');
  const llm = get('llm');
  const webServer = get('webServer');
  const tools = get('tools');
  const systemPrompt = get('systemPrompt');
  const sessionTitle = get('sessionTitle');
  const workspaceRegistry = get('workspaceRegistry');

  return {
    probedAt: new Date().toISOString(),
    version: app?.version ?? null,
    sessionController: {
      list: has(ctx.sessionController, 'list'),
      create: has(ctx.sessionController, 'create'),
      fork: has(ctx.sessionController, 'fork'),
      prompt: has(ctx.sessionController, 'prompt'),
      projections: has(ctx.sessionController, 'projections'),
      modelCatalog: has(ctx.sessionController, 'modelCatalog'),
      selectModel: has(ctx.sessionController, 'selectModel'),
      rename: has(ctx.sessionController, 'rename'),
    },
    sessionQuery: {
      listSessions: has(ctx.sessionQuery, 'listSessions'),
      filterSessions: has(ctx.sessionQuery, 'filterSessions'),
      readSession: has(ctx.sessionQuery, 'readSession'),
      observeSession: has(ctx.sessionQuery, 'observeSession'),
      inspectSession: has(ctx.sessionQuery, 'inspectSession'),
    },
    sessions: {
      get: has(ctx.sessions, 'get'),
      list: has(ctx.sessions, 'list'),
    },
    agents: {
      get: has(ctx.agents, 'get'),
      create: has(ctx.agents, 'create'),
      resume: has(ctx.agents, 'resume'),
      resolveAgent: has(ctx.agents, 'resolveAgent'),
    },
    projections: has(sessionProjections, 'snapshot'),
    compaction: has(compaction, 'compactNow'),
    compact: has(compaction, 'compactNow') || has(commands, 'execute'),
    commands: has(commands, 'execute'),
    // Plan mode is mounted in the agent preset scope, not the Host root. The
    // reliable Host path is the `/plan` command through the agent's command
    // registry, so command execution is the capability we report.
    planMode: (has(planMode, 'get') && has(planMode, 'set')) || has(commands, 'execute'),
    permissionPresets: has(permissionPresets, 'catalog') && has(permissionPresets, 'set'),
    sandboxPolicy: has(sandboxPolicy, 'setSandboxMode'),
    approval: has(approval, 'setPolicy'),
    llmStream: has(llm, 'stream'),
    fetch: !!(connection?.fetch && typeof connection.fetch.register === 'function'),
    webServer: has(webServer, 'register'),
    tools: has(tools, 'register') && has(tools, 'restrict') && has(tools, 'guard'),
    toolGuard: has(tools, 'guard'),
    systemPrompt: has(systemPrompt, 'section'),
    agentPresets: !!get('agentPresets'),
    sessionTitle: has(sessionTitle, 'rename'),
    workspaceRegistry: has(workspaceRegistry, 'list'),
  };
}

/** Whether the minimum surface required to be useful is present. */
export function probeBlockers(probe) {
  const blockers = [];
  if (!probe.sessionController.list) blockers.push('sessionController.list');
  if (!probe.sessionQuery.readSession && !probe.sessions.get) blockers.push('sessionQuery.readSession');
  if (!probe.fetch && !probe.webServer) blockers.push('connection.fetch');
  return blockers;
}
