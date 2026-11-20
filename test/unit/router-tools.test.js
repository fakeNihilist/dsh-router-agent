import assert from 'node:assert/strict';
import test from 'node:test';
import { apply } from '../../src/router-tools.js';

function makeCtx({ failRestrict = false } = {}) {
  const registered = new Map();
  const restrictions = [];
  const guards = [];
  const listeners = new Map();
  const globalTools = [{ name: 'bash' }, { name: 'read_file' }];
  let section = null;
  const service = {
    calls: [],
    async raTree() {
      this.calls.push(['tree']);
      return { project: 'p', sessions: [], stoppedCount: 2 };
    },
    async raBrief(agent, sessionId) {
      this.calls.push(['brief', agent, sessionId]);
      return { sessionId, title: 't', boundaries: [] };
    },
    async raHistory() {
      this.calls.push(['history']);
      return { items: [] };
    },
    async raPropose(agent, args) {
      this.calls.push(['propose', agent, args]);
      return { token: 'tok', action: args.action, summary: 's', confirmRequired: true };
    },
  };
  const ctx = {
    routerAgent: service,
    logger: { warn() {} },
    root: {
      on(event, listener) {
        listeners.set(event, listener);
        return () => listeners.delete(event);
      },
    },
    effect(effect) {
      const dispose = effect();
      return () => {
        try {
          dispose?.();
        } catch {}
      };
    },
    systemPrompt: {
      section(value) {
        section = value;
        return () => {};
      },
    },
    tools: {
      schemas() {
        return globalTools;
      },
      restrict(filter) {
        if (failRestrict) throw new Error('restrict unavailable');
        restrictions.push(filter);
        return () => {};
      },
      guard(guard) {
        guards.push(guard);
        return () => {};
      },
      register(definition) {
        registered.set(definition.name, definition);
        return () => {};
      },
    },
  };
  return {
    ctx,
    registered,
    restrictions,
    guards,
    listeners,
    globalTools,
    service,
    section: () => section,
  };
}

test('router tools deny inherited globals, keep the four scoped tools, and install a guard', () => {
  const harness = makeCtx();
  apply(harness.ctx);
  assert.deepEqual(harness.restrictions, [{ deny: ['bash', 'read_file'] }]);
  assert.deepEqual([...harness.registered.keys()].sort(), [
    'ra_brief',
    'ra_history',
    'ra_propose',
    'ra_tree',
  ]);
  assert.equal(harness.guards.length, 1);
  assert.equal(harness.guards[0]({ name: 'ra_tree' }), undefined);
  assert.match(harness.guards[0]({ name: 'bash' }).reason, /may only call/);
  assert.match(harness.guards[0]({ name: 'run_code' }).reason, /may only call/);
  const section = harness.section();
  assert.equal(section.name, 'router-agent:policy');
  assert.match(section.text, /Router Agent/);
});

test('a tool registered after activation is added to the deny boundary', () => {
  const harness = makeCtx();
  apply(harness.ctx);
  harness.globalTools.push({ name: 'mcp__filesystem__read' });
  const listener = harness.listeners.get('tools/change');
  assert.equal(typeof listener, 'function');
  listener();
  assert.deepEqual(harness.restrictions.at(-1), { deny: ['mcp__filesystem__read'] });
  // A repeated notification must not append the same deny restriction again.
  listener();
  assert.equal(harness.restrictions.length, 2);
});

test('a failed restriction fails the preset instead of exposing global tools', () => {
  assert.throws(() => apply(makeCtx({ failRestrict: true }).ctx), /restrict unavailable/);
});

test('registered tools call the Router service with the executing agent', async () => {
  const harness = makeCtx();
  apply(harness.ctx);
  const agent = { id: 'ra' };
  const tree = await harness.registered.get('ra_tree').execute({}, { agent });
  assert.deepEqual(tree, { project: 'p', sessions: [], stoppedCount: 2 });
  await harness.registered.get('ra_brief').execute({ sessionId: 's' }, { agent });
  assert.deepEqual(harness.service.calls.at(-1), ['brief', agent, 's']);
  const proposal = await harness.registered.get('ra_propose').execute(
    { action: 'new', reason: 'because' },
    { agent },
  );
  assert.equal(proposal.token, 'tok');
  assert.deepEqual(harness.service.calls.at(-1), ['propose', agent, { action: 'new', reason: 'because' }]);
});

test('ra_tree describes includeStopped as a count, not a session list', () => {
  const harness = makeCtx();
  apply(harness.ctx);
  const definition = harness.registered.get('ra_tree');
  assert.match(definition.parameters.properties.includeStopped.description, /how many sessions/);
  assert.equal(definition.output.schema.properties.stoppedCount.type, 'number');
});
