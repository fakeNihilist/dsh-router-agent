import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RouterService } from '../../src/host/router-service.js';

const DAY = 24 * 3600 * 1000;

function event(seq, type, data, time) {
  return { seq, type, time, data };
}

function makeEvents(title, turns = 2, start = Date.now() - 3600_000) {
  const events = [];
  let seq = 0;
  for (let turn = 1; turn <= turns; turn += 1) {
    const t = start + turn * 1000;
    events.push(event(seq++, 'turn/start', { turn }, t));
    events.push(event(seq++, 'step/start', { turn, step: 1 }, t));
    events.push(
      event(
        seq++,
        'user/message',
        {
          content: [{ type: 'text', text: `${title} 第 ${turn} 轮任务` }],
          source: { kind: 'user', rpcId: `r-${turn}` },
          role: 'user',
          id: `u-${turn}`,
        },
        t,
      ),
    );
    events.push(
      event(
        seq++,
        'assistant/message',
        {
          turn,
          step: 1,
          message: { role: 'assistant', id: `a-${turn}`, content: [{ type: 'text', text: `已处理第 ${turn} 轮。` }] },
          usage: { inputTokens: 10000 * turn, cacheReadTokens: 5000 * turn, outputTokens: 100 },
        },
        t + 10,
      ),
    );
    events.push(event(seq++, 'step/end', { turn, step: 1 }, t + 20));
    events.push(event(seq++, 'turn/end', { turn, reason: 'success' }, t + 30));
  }
  events.push(event(seq++, 'request/context', { provider: 'p', model: 'm', contextWindow: 200000 }, start + 100));
  events.push(event(seq++, 'session/title', { title, messageSeqs: [2], source: { kind: 'fallback' } }, start + 200));
  return events;
}

async function createHarness() {
  const project = await mkdtemp(join(tmpdir(), 'dsh-ra-host-'));
  const records = new Map();
  const summaries = new Map();
  const live = new Map();
  const prompts = [];
  const created = [];
  const forks = [];
  const commands = [];
  const permissionSets = [];
  let nextId = 1;

  const addSession = (id, { title, turns = 2, age = 3600_000, parentSessionId = null, blank = false, cwd = project } = {}) => {
    const events = makeEvents(title, turns, Date.now() - age);
    records.set(id, {
      session: { version: 4, id, cwd, createdAt: Date.now() - age, isSeeded: false, ...(parentSessionId ? { parentSession: parentSessionId } : {}) },
      events,
    });
    summaries.set(id, {
      sessionId: id,
      cwd,
      // DSH's SessionSummary.updatedAt is the last *user prompt* time (or the
      // header creation time), not the log tail.
      updatedAt:
        events.filter((item) => item.type === 'user/message').at(-1)?.time ??
        records.get(id).session.createdAt,
      running: false,
      blank,
      parentSessionId: parentSessionId ?? undefined,
      projections: { kind: 'cached', asOfSeq: 0, values: { agentPreset: 'standard', title } },
    });
  };

  addSession('p', { title: '父会话', turns: 2 });
  addSession('c', { title: '子会话', turns: 1, age: 1800_000, parentSessionId: 'p' });
  addSession('old', { title: '旧会话', turns: 1, age: 12 * DAY });
  addSession('other', { title: '旧但已显式恢复', turns: 1, age: 20 * DAY });

  const projections = new Map();
  const projectionFor = (id) => {
    if (!projections.has(id)) {
      projections.set(id, {
        contextPressure: { pressureTokens: 20000, projectedTokens: 25000, contextWindow: 200000 },
        plan: { active: false, pending: false },
        permissions: { currentValue: 'workspace-write' },
        title: summaries.get(id)?.projections?.values?.title ?? null,
        agentPreset: 'standard',
      });
    }
    return projections.get(id);
  };

  const makeAgent = (id) => {
    const record = records.get(id);
    const agent = {
      id,
      status: 'idle',
      session: { header: record?.session ?? { id, cwd: project }, append() {} },
      model: { select() {} },
    };
    live.set(id, agent);
    return agent;
  };

  const services = {
    commands: {
      async execute(agent, line) {
        commands.push({ sessionId: agent.id, line });
        return { result: { kind: 'success', text: 'ok' } };
      },
    },
    permissionPresets: {
      catalog: () => ({ options: [], defaultOptions: [], defaultPreset: 'workspace-write' }),
      set(session, name) {
        permissionSets.push({ sessionId: session.header.id, name });
        const values = projectionFor(session.header.id);
        values.permissions = { currentValue: name };
      },
    },
    llm: null,
    compaction: null,
    sessionTitle: null,
    connection: null,
    tools: null,
    systemPrompt: null,
    webServer: null,
    agentPresets: {},
    workspaceRegistry: null,
  };

  const ctx = {
    logger: { info() {}, warn() {}, error() {} },
    get(name) {
      return services[name];
    },
    on() {
      return () => {};
    },
    sessionController: {
      async list() {
        return { items: [...summaries.values()] };
      },
      async create({ cwd, agentPreset }) {
        const id = `session-new-${nextId++}`;
        addSession(id, { title: '新会话', turns: 0, age: 0 });
        summaries.get(id).projections.values.agentPreset = agentPreset ?? 'standard';
        created.push({ id, cwd, agentPreset });
        makeAgent(id);
        return { sessionId: id, ...(agentPreset ? { agentPreset } : {}) };
      },
      async fork({ sessionId, atSeq }) {
        const id = `session-fork-${nextId++}`;
        addSession(id, { title: '分叉会话', turns: 1, age: 0 });
        forks.push({ sessionId, atSeq, childId: id });
        makeAgent(id);
        return { sessionId: id };
      },
      async prompt(request) {
        prompts.push(request);
        return { accepted: true };
      },
      async projections({ sessionId }) {
        return { kind: 'sequenced', asOfSeq: 10, values: projectionFor(sessionId) };
      },
      async modelCatalog() {
        return {
          default: { provider: 'p', model: 'm' },
          routableProviders: ['p'],
          groups: [{ id: 'p', name: 'Provider', models: [{ id: 'm', name: 'Model' }, { id: 'm2', name: 'Model 2' }] }],
          failures: [],
        };
      },
      async rename({ sessionId, title }) {
        const record = records.get(sessionId);
        if (record) record.events.push(event(record.events.length, 'session/title', { title, source: { kind: 'user' } }, Date.now()));
        const summary = summaries.get(sessionId);
        if (summary) summary.projections.values.title = title;
        return { title, seq: 99 };
      },
      async resolveAgent(sessionId) {
        const agent = live.get(sessionId) ?? makeAgent(sessionId);
        return { agent };
      },
    },
    sessionQuery: {
      async listSessions() {
        return [...records.entries()].map(([id, record]) => ({ header: record.session, live: live.has(id), persisted: true, formatStatus: 'current' }));
      },
      async readSession(id) {
        const record = records.get(id);
        if (!record) throw new Error(`missing ${id}`);
        return structuredClone(record);
      },
    },
    sessions: {
      get(id) {
        const agent = live.get(id);
        if (!agent) return undefined;
        const record = records.get(id);
        const events = record?.events ?? [];
        return {
          id,
          header: agent.session.header,
          // A real Session exposes its current log offset; the reader keys live
          // analyses by it, so it must advance with the fake log.
          seq: events.length ? events.at(-1).seq + 1 : 0,
          snapshotEvents() {
            return structuredClone(events);
          },
        };
      },
      list() {
        return [...live.values()];
      },
    },
    agents: {
      get(id) {
        return live.get(id);
      },
    },
  };

  const service = new RouterService(ctx, {
    summaryUseLlm: false,
    firstRunDays: 7,
    summaryDebounceMs: 10,
    proposalTtlMs: 60000,
  });
  const fakeAgent = { id: 'ra', session: { header: { cwd: project, agentPreset: 'router' } }, status: 'idle' };

  const waitComplete = async () => {
    // First index is user-confirmed now; tests opt in explicitly.
    await service.onboardingOp({ project, action: 'start' });
    for (let i = 0; i < 100; i += 1) {
      const state = await service.state({ project });
      if (state.onboarding?.status === 'complete') return state;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('onboarding did not complete');
  };

  return {
    project,
    records,
    summaries,
    live,
    prompts,
    created,
    forks,
    commands,
    permissionSets,
    service,
    ctx,
    addSession,
    fakeAgent,
    makeAgent,
    waitComplete,
    projectionFor,
    cleanup: () => rm(project, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }),
  };
}

test('state indexes only the last 7 days, builds edges and untracked rows', async () => {
  const harness = await createHarness();
  try {
    const state = await harness.waitComplete();
    assert.equal(state.tree.trackedCount, 2);
    assert.equal(state.tree.untrackedCount, 2);
    assert.equal(state.tree.edges.length, 1);
    assert.equal(state.tree.edges[0].from, 'p');
    assert.equal(state.tree.edges[0].to, 'c');
    assert.equal(state.tree.sessions.find((row) => row.sessionId === 'c').parentSessionId, 'p');
    assert.ok(state.untracked.some((row) => row.sessionId === 'old' && row.reason === 'older'));
    const project = state.projects.find((row) => row.project === harness.project);
    assert.equal(project.sessions, 4);
    assert.equal(project.tracked, 2);
  } finally {
    await harness.cleanup();
  }
});

test('switching projects reads only that project in the tree and untracked list', async () => {
  const harness = await createHarness();
  const other = await mkdtemp(join(tmpdir(), 'dsh-ra-other-'));
  try {
    harness.addSession('elsewhere', { title: '另一个项目', turns: 1, cwd: other });
    const here = await harness.service.state({ project: harness.project });
    assert.equal(here.selectedProject?.project, harness.project);
    assert.deepEqual(here.tree.sessions.map((row) => row.sessionId).sort(), ['c', 'p']);
    assert.ok(!here.untracked.some((row) => row.sessionId === 'elsewhere'));

    // Selecting another project in the header must rebuild both the canvas and
    // the untracked list from that project's sessions, with no leftovers.
    const away = await harness.service.state({ project: other });
    assert.equal(away.selectedProject?.project, other);
    assert.deepEqual(away.tree.sessions.map((row) => row.sessionId), ['elsewhere']);
    assert.equal(away.tree.sessions[0].title, '另一个项目');
    assert.deepEqual(away.untracked, []);

    const back = await harness.service.state({ project: harness.project });
    assert.equal(back.selectedProject?.project, harness.project);
    assert.ok(back.untracked.some((row) => row.sessionId === 'old'));
    assert.ok(!back.tree.sessions.some((row) => row.sessionId === 'elsewhere'));
  } finally {
    await harness.cleanup();
    await rm(other, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  }
});

test('auto mode keeps asking under the default policy', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '自动任务',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: true },
      raSessionId: 'ra',
      at: Date.now(),
    });
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'ask',
      question: '选哪个？',
      options: ['继续', '新建'],
      reason: '不确定',
    });
    assert.ok(proposal.token);
    const store = harness.service.storeFor(harness.project);
    const saved = await store.getProposal(proposal.token);
    assert.equal(saved.status, 'pending');
    assert.equal(saved.auto, false);
    assert.ok((await harness.service.pendingFor(store)).some((row) => row.token === proposal.token));
  } finally {
    await harness.cleanup();
  }
});

test('auto mode can forbid asking and refuse an ask proposal', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await store.setSettings({ autoAsk: 'decide' });
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '自动任务',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: true },
      raSessionId: 'ra',
      at: Date.now(),
    });
    await assert.rejects(
      () => harness.service.raPropose(harness.fakeAgent, {
        action: 'ask',
        question: '选哪个？',
        reason: '不确定',
      }),
      /交给 RA 判断/,
    );
  } finally {
    await harness.cleanup();
  }
});

test('auto mode can answer an ask with its first suggestion', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await store.setSettings({ autoAsk: 'suggest' });
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '自动任务',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: true },
      raSessionId: 'ra',
      at: Date.now(),
    });
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'ask',
      question: '选哪个？',
      options: ['继续父会话', '新建会话'],
      reason: '不确定',
    });
    assert.equal(proposal.executed, true);
    assert.equal(proposal.autoAnswered, true);
    assert.equal(proposal.answer, '继续父会话');
    assert.match(harness.prompts.at(-1).content[0].text, /自动使用建议项/);
    const saved = await store.getProposal(proposal.token);
    assert.equal(saved.status, 'answered');
    assert.equal(saved.answer, '继续父会话');
    const history = await store.history(5);
    assert.equal(history.at(-1).mode, 'auto');
  } finally {
    await harness.cleanup();
  }
});

test('a turn/end event refreshes the brief incrementally', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    // A live Session is what makes the reader see the new log: DSH's list
    // updatedAt stays at the last prompt time for the whole turn.
    harness.makeAgent('p');
    const record = harness.records.get('p');
    const start = Date.now();
    record.events.push(event(record.events.length, 'turn/start', { turn: 99 }, start));
    record.events.push(event(record.events.length, 'step/start', { turn: 99, step: 1 }, start + 1));
    record.events.push(event(record.events.length, 'user/message', {
      content: [{ type: 'text', text: '旁路追加的新任务' }],
      source: { kind: 'user', rpcId: 'r99' },
      role: 'user',
      id: 'u99',
    }, start + 2));
    record.events.push(event(record.events.length, 'assistant/message', {
      turn: 99,
      step: 1,
      message: { role: 'assistant', id: 'a99', content: [{ type: 'text', text: '已处理旁路任务。' }] },
      usage: { inputTokens: 1000, outputTokens: 10 },
    }, start + 3));
    record.events.push(event(record.events.length, 'step/end', { turn: 99, step: 1 }, start + 4));
    record.events.push(event(record.events.length, 'turn/end', { turn: 99, reason: 'success' }, start + 5));
    harness.service.onSessionEvent({ header: { cwd: harness.project, agentPreset: 'standard' } }, { type: 'turn/end' });
    await new Promise((resolve) => setTimeout(resolve, 900));
    const brief = await harness.service.storeFor(harness.project).getBrief('p');
    assert.equal(brief.summarizedThroughSeq, record.events.at(-1).seq);
    assert.match(brief.overview, /旁路追加的新任务/);
  } finally {
    await harness.cleanup();
  }
});

test('route proposal confirms token and sends the task', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'route',
      task: '继续做登录页',
      targetSessionId: 'p',
      reason: '同一功能',
    });
    assert.equal(proposal.confirmRequired, true);
    const result = await harness.service.confirm({ project: harness.project, token: proposal.token });
    assert.equal(result.result.result, 'sent');
    assert.equal(harness.prompts.at(-1).sessionId, 'p');
    assert.equal(harness.prompts.at(-1).content[0].text, '继续做登录页');
  } finally {
    await harness.cleanup();
  }
});

test('first index waits for confirmation and skipping it still allows routing', async () => {
  const harness = await createHarness();
  try {
    const initial = await harness.service.state({ project: harness.project });
    assert.equal(initial.onboarding.status, 'awaiting');
    assert.ok(initial.onboarding.total > 0);
    const store = harness.service.storeFor(harness.project);
    assert.equal(await store.getBrief('p'), null);
    const skipped = await harness.service.onboardingOp({ project: harness.project, action: 'skip' });
    assert.equal(skipped.onboarding.status, 'skipped');
    const asked = await harness.service.ask({
      project: harness.project,
      task: '先路由看看',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
    });
    assert.equal(asked.accepted, true);
    assert.equal(harness.prompts.at(-1).sessionId, asked.raSessionId);
  } finally {
    await harness.cleanup();
  }
});

test('manual dispatch creates a normal pending proposal and sends after confirmation', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const created = await harness.service.manual({
      project: harness.project,
      task: '手动发到父会话',
      action: 'route',
      targetSessionId: 'p',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: true },
    });
    const store = harness.service.storeFor(harness.project);
    const proposal = await store.getProposal(created.token);
    assert.equal(proposal.status, 'pending');
    assert.equal(proposal.auto, false);
    assert.equal(proposal.manual, true);
    assert.equal(
      proposal.targetLastSeq,
      (await harness.service.findRow(harness.project, 'p')).row.lastSeq,
    );
    const result = await harness.service.confirm({ project: harness.project, token: created.token });
    assert.equal(result.result.result, 'sent');
    assert.equal(harness.prompts.at(-1).sessionId, 'p');
    assert.equal(harness.prompts.at(-1).content[0].text, '手动发到父会话');
  } finally {
    await harness.cleanup();
  }
});

test('manual fork defaults to the latest boundary and manual retarget moves the target', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const created = await harness.service.manual({
      project: harness.project,
      task: '手动分叉',
      action: 'fork',
      targetSessionId: 'p',
      composer: { mode: 'plan', permissions: 'workspace-write' },
    });
    const store = harness.service.storeFor(harness.project);
    let proposal = await store.getProposal(created.token);
    const parent = (await harness.service.findRow(harness.project, 'p')).row;
    assert.equal(proposal.atSeq, parent.boundaries.at(-1).atSeq);
    assert.equal(proposal.turn, parent.boundaries.at(-1).turn);
    await harness.service.retarget({
      project: harness.project,
      token: created.token,
      sessionId: 'c',
    });
    proposal = await store.getProposal(created.token);
    const child = (await harness.service.findRow(harness.project, 'c')).row;
    assert.equal(proposal.targetSessionId, 'c');
    assert.equal(proposal.atSeq, child.boundaries.at(-1).atSeq);
    assert.equal(proposal.composer.mode, 'plan');
  } finally {
    await harness.cleanup();
  }
});

test('retry abandons the proposal and asks the RA to judge again with the correction', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'route',
      task: '继续做登录页',
      targetSessionId: 'p',
      reason: '同一功能',
    });
    await harness.service.retry({
      project: harness.project,
      token: proposal.token,
      note: '应该分叉，不要改父会话',
    });
    const store = harness.service.storeFor(harness.project);
    assert.equal((await store.getProposal(proposal.token)).status, 'abandoned');
    assert.match(harness.prompts.at(-1).content[0].text, /应该分叉/);
    const history = await store.history(5);
    assert.equal(history.at(-1).result, 'revised');
  } finally {
    await harness.cleanup();
  }
});

test('cancel task clears the active slot and cancels a running RA', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await store.setRASession('ra');
    let canceled = 0;
    harness.live.set('ra', {
      id: 'ra',
      status: 'running',
      session: { header: { cwd: harness.project } },
      cancel() {
        canceled += 1;
      },
    });
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '卡住的任务',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
      raSessionId: 'ra',
      at: Date.now(),
    });
    const result = await harness.service.cancelTask({ project: harness.project });
    assert.equal(result.canceled, true);
    assert.equal(canceled, 1);
    assert.equal(harness.service.activeTask(harness.project), null);
  } finally {
    await harness.cleanup();
  }
});

test('settings persist auto-ask, index model and the tracking window', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const saved = await harness.service.saveSettings({
      project: harness.project,
      settings: {
        autoAsk: 'suggest',
        indexModel: { provider: 'p', model: 'm2' },
        trackingDays: 14,
      },
    });
    assert.equal(saved.settings.autoAsk, 'suggest');
    assert.deepEqual(saved.settings.indexModel, { provider: 'p', model: 'm2' });
    assert.equal(saved.settings.trackingDays, 14);
    const state = await harness.service.state({ project: harness.project });
    assert.equal(state.settings.trackingDays, 14);
    assert.equal((await harness.service.pipelineFor(harness.project).model()).model, 'm2');
  } finally {
    await harness.cleanup();
  }
});

test('target changed after the proposal blocks confirmation', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'route',
      task: '继续',
      targetSessionId: 'p',
      reason: '测试',
    });
    const record = harness.records.get('p');
    record.events.push(event(record.events.length, 'turn/start', { turn: 99 }, Date.now()));
    await assert.rejects(
      () => harness.service.confirm({ project: harness.project, token: proposal.token }),
      (error) => error.code === 'target-changed',
    );
  } finally {
    await harness.cleanup();
  }
});

test('fork proposal records atSeq, lineage and the child task', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const state = await harness.service.state({ project: harness.project });
    const child = state.tree.sessions.find((row) => row.sessionId === 'c');
    const boundary = child.boundaries[0];
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'fork',
      task: '在分叉里补用例',
      targetSessionId: 'c',
      atSeq: boundary.atSeq,
      title: '补用例',
      reason: '后续方向不同',
    });
    const result = await harness.service.confirm({ project: harness.project, token: proposal.token });
    assert.equal(result.result.result, 'forked');
    assert.equal(harness.forks.at(-1).atSeq, boundary.atSeq);
    const childId = result.result.sessionId;
    assert.equal(harness.prompts.at(-1).sessionId, childId);
    const store = harness.service.storeFor(harness.project);
    const saved = await store.read();
    assert.equal(saved.lineage[childId], 'c');
    assert.equal(saved.pinned[childId], true);
    const after = await harness.service.state({ project: harness.project });
    assert.equal(after.tree.sessions.find((row) => row.sessionId === childId).parentSessionId, 'c');
  } finally {
    await harness.cleanup();
  }
});

test('a fork proposal can change its boundary before confirmation', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const state = await harness.service.state({ project: harness.project });
    const child = state.tree.sessions.find((row) => row.sessionId === 'p');
    const first = child.boundaries[0];
    const second = child.boundaries[1];
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'fork',
      task: '换到后一轮',
      targetSessionId: 'p',
      atSeq: first.atSeq,
      reason: '先选早的',
    });
    await harness.service.choose({ project: harness.project, token: proposal.token, atSeq: second.atSeq });
    await harness.service.confirm({ project: harness.project, token: proposal.token });
    assert.equal(harness.forks.at(-1).atSeq, second.atSeq);
  } finally {
    await harness.cleanup();
  }
});

test('answering an ask proposal feeds the answer back to the RA', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'ask',
      task: '需要选择',
      question: '继续还是新建？',
      options: ['继续', '新建'],
      reason: '不确定',
    });
    const result = await harness.service.answerAsk({
      project: harness.project,
      token: proposal.token,
      answer: '继续',
    });
    assert.equal(result.ok, true);
    assert.match(harness.prompts.at(-1).content[0].text, /用户回答：继续/);
    const store = harness.service.storeFor(harness.project);
    assert.equal((await store.getProposal(proposal.token)).status, 'answered');
  } finally {
    await harness.cleanup();
  }
});

test('onboarding resumes and skips briefs already built', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await rm(join(harness.project, '.dsh_RA', 'sessions', 'c.json'), { force: true });
    await store.onboarding({
      status: 'running',
      total: 2,
      done: 1,
      startedAt: new Date().toISOString(),
      completedAt: null,
      current: null,
      failed: [],
    });
    await harness.service.state({ project: harness.project });
    for (let i = 0; i < 100; i += 1) {
      const state = await harness.service.state({ project: harness.project });
      if (state.onboarding?.status === 'complete') {
        assert.equal(state.onboarding.done, 2);
        assert.ok(await store.getBrief('c'));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error('onboarding resume did not complete');
  } finally {
    await harness.cleanup();
  }
});

test('new proposal creates a clean session and applies the model', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await store.setSettings({ defaultSessionModel: { provider: 'p', model: 'm2' } });
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'new',
      task: '一个全新的任务',
      title: '全新任务',
      reason: '无关',
    });
    const result = await harness.service.confirm({ project: harness.project, token: proposal.token });
    assert.equal(result.result.result, 'created');
    assert.equal(harness.created.at(-1).cwd, harness.project);
    assert.equal(harness.prompts.at(-1).content[0].text, '一个全新的任务');
    const summary = harness.summaries.get(result.result.sessionId);
    assert.equal(summary.projections.values.title, '全新任务');
  } finally {
    await harness.cleanup();
  }
});

test('auto mode executes without confirmation and is recorded as auto', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '自动任务',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: true },
      raSessionId: 'ra',
      at: Date.now(),
    });
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'new',
      task: '自动任务',
      reason: '自动',
    });
    assert.equal(proposal.confirmRequired, false);
    assert.equal(proposal.executed, true);
    assert.equal(harness.prompts.at(-1).content[0].text, '自动任务');
    const rows = await harness.service.storeFor(harness.project).history(10);
    assert.equal(rows.at(-1).mode, 'auto');
    assert.equal(rows.at(-1).result, 'auto');
  } finally {
    await harness.cleanup();
  }
});

test('stop parent makes the tracked child a root; restore reattaches', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const stopped = await harness.service.stop({ project: harness.project, sessionId: 'p' });
    const child = stopped.tree.sessions.find((row) => row.sessionId === 'c');
    assert.equal(child.parentSessionId, null);
    assert.ok(stopped.untracked.some((row) => row.sessionId === 'p' && row.reason === 'stopped'));
    const restored = await harness.service.restore({ project: harness.project, sessionId: 'p' });
    assert.equal(restored.tree.sessions.find((row) => row.sessionId === 'c').parentSessionId, 'p');
  } finally {
    await harness.cleanup();
  }
});

test('restoring an old session pins it into the tracked set', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const restored = await harness.service.restore({ project: harness.project, sessionId: 'other' });
    assert.ok(restored.tree.sessions.some((row) => row.sessionId === 'other'));
    assert.equal((await harness.service.storeFor(harness.project).read()).pinned.other, true);
  } finally {
    await harness.cleanup();
  }
});

test('settings persist and are returned by state', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const saved = await harness.service.saveSettings({
      project: harness.project,
      settings: {
        layout: 'horizontal',
        raModel: { provider: 'p', model: 'm2' },
        defaultSessionModel: { provider: 'p', model: 'm' },
      },
    });
    assert.equal(saved.settings.layout, 'horizontal');
    const state = await harness.service.state({ project: harness.project });
    assert.equal(state.settings.layout, 'horizontal');
    assert.equal(state.models.groups.length, 1);
  } finally {
    await harness.cleanup();
  }
});

test('plan mode and permission presets are applied to a target session', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const dispatch = await harness.service.applyDispatchSettings('p', {
      mode: 'plan',
      permissions: 'read-only',
    });
    assert.equal(dispatch.plan.after, true);
    assert.equal(dispatch.permissions.after, 'read-only');
    assert.ok(harness.commands.some((row) => row.sessionId === 'p' && row.line === '/plan'));
    assert.ok(harness.permissionSets.some((row) => row.sessionId === 'p' && row.name === 'read-only'));
  } finally {
    await harness.cleanup();
  }
});

test('compress rejects a running agent and uses /compact when idle', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const agent = harness.makeAgent('p');
    agent.status = 'running';
    await assert.rejects(
      () => harness.service.compress({ project: harness.project, sessionId: 'p' }),
      (error) => error.code === 'session-busy',
    );
    agent.status = 'idle';
    const result = await harness.service.compress({ project: harness.project, sessionId: 'p' });
    assert.equal(result.ok, true);
    assert.ok(harness.commands.some((row) => row.sessionId === 'p' && row.line === '/compact'));
  } finally {
    await harness.cleanup();
  }
});

test('rename writes the sidecar title and the native title', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    await harness.service.rename({ project: harness.project, sessionId: 'p', title: '新的父会话' });
    const state = await harness.service.state({ project: harness.project });
    const row = state.tree.sessions.find((item) => item.sessionId === 'p');
    assert.equal(row.title, '新的父会话');
    assert.equal((await harness.service.storeFor(harness.project).read()).titles.p.title, '新的父会话');
  } finally {
    await harness.cleanup();
  }
});

test('ask creates a Router session and queues the wrapped task', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const result = await harness.service.ask({
      project: harness.project,
      task: '帮我判断这个任务',
      composer: { mode: 'plan', permissions: 'read-only', auto: false },
    });
    assert.equal(result.ok, true);
    assert.match(harness.prompts.at(-1).content[0].text, /帮我判断这个任务/);
    assert.match(harness.prompts.at(-1).content[0].text, /计划模式/);
  } finally {
    await harness.cleanup();
  }
});

test('a Router projection excludes a session even without state.raSessionId', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    harness.addSession('ra-orphan', { title: 'RA 遗留', turns: 1, age: 1000 });
    harness.summaries.get('ra-orphan').projections.values.agentPreset = 'router';
    const state = await harness.service.state({ project: harness.project });
    assert.equal(state.tree.sessions.some((row) => row.sessionId === 'ra-orphan'), false);
  } finally {
    await harness.cleanup();
  }
});

test('two concurrent confirms execute a route proposal once', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'route',
      task: '并发任务',
      targetSessionId: 'p',
      reason: '并发',
    });
    const before = harness.prompts.length;
    const results = await Promise.allSettled([
      harness.service.confirm({ project: harness.project, token: proposal.token }),
      harness.service.confirm({ project: harness.project, token: proposal.token }),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(harness.prompts.length - before, 1);
    const saved = await harness.service.storeFor(harness.project).getProposal(proposal.token);
    assert.equal(saved.status, 'confirmed');
  } finally {
    await harness.cleanup();
  }
});

test('an unreadable target fails closed instead of sending', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'route',
      task: '不能盲发',
      targetSessionId: 'p',
      reason: '校验',
    });
    const original = harness.ctx.sessionQuery.readSession;
    harness.ctx.sessionQuery.readSession = async () => {
      throw new Error('offline');
    };
    try {
      await assert.rejects(
        () => harness.service.confirm({ project: harness.project, token: proposal.token }),
        (error) => error.code === 'target-unreadable',
      );
    } finally {
      harness.ctx.sessionQuery.readSession = original;
    }
    assert.equal(harness.prompts.length, 0);
    const saved = await harness.service.storeFor(harness.project).getProposal(proposal.token);
    assert.equal(saved.status, 'failed');
  } finally {
    await harness.cleanup();
  }
});

test('a fork failure after creation marks the proposal failed and never forks twice', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await store.setSettings({ defaultSessionModel: { provider: 'p', model: 'm' } });
    const state = await harness.service.state({ project: harness.project });
    const target = state.tree.sessions.find((row) => row.sessionId === 'p');
    const proposal = await harness.service.raPropose(harness.fakeAgent, {
      action: 'fork',
      task: '补用例',
      targetSessionId: 'p',
      atSeq: target.boundaries[0].atSeq,
      reason: '失败处理',
    });
    const original = harness.service.selectSessionModel;
    harness.service.selectSessionModel = async () => {
      throw new Error('model unavailable');
    };
    try {
      await assert.rejects(
        () => harness.service.confirm({ project: harness.project, token: proposal.token }),
        /model unavailable/,
      );
    } finally {
      harness.service.selectSessionModel = original;
    }
    assert.equal(harness.forks.length, 1);
    const saved = await store.getProposal(proposal.token);
    assert.equal(saved.status, 'failed');
    assert.ok(saved.resultSessionId);
    await assert.rejects(
      () => harness.service.confirm({ project: harness.project, token: proposal.token }),
      (error) => error.code === 'proposal-not-pending',
    );
    assert.equal(harness.forks.length, 1);
  } finally {
    await harness.cleanup();
  }
});

test('ra_propose prefers the latest task envelope over a newer active task', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const raId = 'ra-envelope';
    harness.addSession(raId, { title: 'Router · test', turns: 0, age: 1000 });
    const record = harness.records.get(raId);
    const wrapper = [
      `项目：${harness.project}`,
      '用户任务：任务 A',
      '派发设置：模式=标准；工作区权限=workspace-write；自动执行=关闭。',
      '',
      '请据此判断。',
    ].join('\n');
    record.events.push(
      event(
        record.events.length,
        'user/message',
        {
          content: [{ type: 'text', text: wrapper }],
          source: { kind: 'user', rpcId: 'r1' },
          role: 'user',
          id: 'u1',
        },
        Date.now(),
      ),
    );
    harness.makeAgent(raId);
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '任务 B',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
      raSessionId: raId,
      at: Date.now(),
    });
    const agent = {
      id: raId,
      status: 'idle',
      session: { header: { cwd: harness.project, agentPreset: 'router' } },
    };
    const proposal = await harness.service.raPropose(agent, {
      action: 'new',
      task: '任务 B',
      reason: '信封优先',
    });
    const saved = await harness.service.storeFor(harness.project).getProposal(proposal.token);
    assert.equal(saved.task, '任务 A');
  } finally {
    await harness.cleanup();
  }
});

test('a manual RA message uses its tool task instead of a stale active slot', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const raId = 'ra-manual';
    harness.addSession(raId, { title: 'Router · manual', turns: 0, age: 1000 });
    const record = harness.records.get(raId);
    record.events.push(
      event(
        record.events.length,
        'user/message',
        {
          content: [{ type: 'text', text: '帮我看看这个手动任务' }],
          source: { kind: 'user', rpcId: 'r-manual' },
          role: 'user',
          id: 'u-manual',
        },
        Date.now(),
      ),
    );
    harness.makeAgent(raId);
    harness.service.activeTasks.set(harness.service.taskKey(harness.project), {
      task: '旧面板任务',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
      raSessionId: raId,
      at: Date.now(),
    });
    const agent = {
      id: raId,
      status: 'idle',
      session: { header: { cwd: harness.project, agentPreset: 'router' } },
    };
    const proposal = await harness.service.raPropose(agent, {
      action: 'new',
      task: '手动任务',
      reason: '手动对话',
    });
    const saved = await harness.service.storeFor(harness.project).getProposal(proposal.token);
    assert.equal(saved.task, '手动任务');
    assert.equal(harness.service.activeTask(harness.project), null);
  } finally {
    await harness.cleanup();
  }
});

test('answering an ask keeps its task in the reply envelope and active slot', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    const token = 'ask-keep';
    const now = Date.now();
    await store.saveProposal({
      token,
      project: harness.project,
      action: 'ask',
      task: '任务 A',
      question: '选哪个？',
      options: [],
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
      targetSessionId: null,
      targetTitle: null,
      targetLastSeq: null,
      atSeq: null,
      turn: null,
      reason: '追问',
      status: 'pending',
      createdAt: now,
      expiresAt: now + 60_000,
      raSessionId: null,
    });
    await harness.service.answerAsk({ project: harness.project, token, answer: '继续' });
    const promptText = harness.prompts.at(-1).content[0].text;
    assert.match(promptText, /用户任务：任务 A/);
    assert.match(promptText, /用户回答：继续/);
    assert.equal(harness.service.activeTask(harness.project).task, '任务 A');
    assert.equal((await store.getProposal(token)).status, 'answered');
  } finally {
    await harness.cleanup();
  }
});

test('settings can clear a model and a partial patch keeps the layout', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    await harness.service.saveSettings({
      project: harness.project,
      settings: {
        layout: 'horizontal',
        raModel: { provider: 'p', model: 'm2' },
        defaultSessionModel: { provider: 'p', model: 'm' },
      },
    });
    await harness.service.saveSettings({ project: harness.project, settings: { raModel: null } });
    const state = await harness.service.state({ project: harness.project });
    assert.equal(state.settings.layout, 'horizontal');
    assert.equal(state.settings.raModel, null);
    assert.deepEqual(state.settings.defaultSessionModel, { provider: 'p', model: 'm' });
  } finally {
    await harness.cleanup();
  }
});

test('a permission failure rolls the plan change back', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const permissions = harness.ctx.get('permissionPresets');
    const original = permissions.set;
    permissions.set = () => {
      throw new Error('denied');
    };
    try {
      await assert.rejects(
        () => harness.service.applyDispatchSettings('p', { mode: 'plan', permissions: 'read-only' }),
        (error) => error.code === 'permission-unavailable',
      );
    } finally {
      permissions.set = original;
    }
    assert.ok(harness.commands.some((row) => row.line === '/plan'));
    assert.ok(harness.commands.some((row) => row.line === '/plan off'));
  } finally {
    await harness.cleanup();
  }
});

test('a transient RA resolve error does not recreate the Router session', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    await store.setRASession('ra-busy');
    const original = harness.ctx.sessionController.resolveAgent;
    harness.ctx.sessionController.resolveAgent = async () => ({
      error: { code: 'session/agent-busy', message: 'busy' },
    });
    try {
      await assert.rejects(
        () => harness.service.ensureRA(harness.project),
        (error) => error.code === 'ra-busy',
      );
    } finally {
      harness.ctx.sessionController.resolveAgent = original;
    }
    assert.equal((await store.read()).raSessionId, 'ra-busy');
    assert.equal(harness.created.length, 0);
  } finally {
    await harness.cleanup();
  }
});

test('a write operation rejects an arbitrary project path without creating a sidecar', async () => {
  const harness = await createHarness();
  const empty = await mkdtemp(join(tmpdir(), 'dsh-ra-empty-'));
  try {
    await harness.waitComplete();
    await assert.rejects(
      () => harness.service.api('ask', { project: empty, task: 'x' }),
      (error) => error.code === 'project-not-found',
    );
    assert.equal(
      await stat(join(empty, '.dsh_RA')).then(
        () => true,
        () => false,
      ),
      false,
    );
  } finally {
    await rm(empty, { recursive: true, force: true });
    await harness.cleanup();
  }
});

test('an indexing failure becomes a visible failed onboarding state', async () => {
  const harness = await createHarness();
  try {
    await harness.waitComplete();
    const store = harness.service.storeFor(harness.project);
    const pipeline = harness.service.pipelineFor(harness.project);
    const original = pipeline.indexRows;
    await store.onboarding({ status: 'running', total: 0, done: 0, current: null, failed: [] });
    pipeline.indexRows = async () => {
      throw new Error('disk full');
    };
    try {
      await harness.service.state({ project: harness.project });
      for (let index = 0; index < 100; index += 1) {
        const state = await store.read();
        if (state.onboarding.status === 'failed') break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      const state = await store.read();
      assert.equal(state.onboarding.status, 'failed');
      assert.match(state.onboarding.failed[0].message, /disk full/);
    } finally {
      pipeline.indexRows = original;
    }
  } finally {
    await harness.cleanup();
  }
});

test('public rows cap boundaries but report their total', async () => {
  const harness = await createHarness();
  try {
    const row = {
      sessionId: 's',
      title: 't',
      parentSessionId: null,
      lastActiveAt: 1,
      turns: 200,
      running: false,
      live: false,
      context: { percent: 1 },
      boundaries: Array.from({ length: 150 }, (_, index) => ({
        turn: index + 1,
        atSeq: index,
        label: 'x',
      })),
      plan: null,
      permissions: null,
      titleSource: 'native',
    };
    const publicRow = harness.service.publicRow(row, []);
    assert.equal(publicRow.boundaries.length, 100);
    assert.equal(publicRow.boundaryCount, 150);
  } finally {
    await harness.cleanup();
  }
});
