import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SessionReader,
  analyzeEvents,
  extractiveBrief,
  sameProject,
} from '../../src/host/session-reader.js';

function event(seq, type, data, time = 1000 + seq) {
  return { seq, type, time, data };
}

const events = [
  event(0, 'turn/start', { turn: 1 }),
  event(1, 'step/start', { turn: 1, step: 1 }),
  event(
    2,
    'user/message',
    {
      content: [{ type: 'text', text: '登录页校验误报，帮我定位。' }],
      source: { kind: 'user', rpcId: 'r1' },
      role: 'user',
      id: 'u1',
    },
  ),
  event(3, 'tool/call', { turn: 1, step: 1, callId: 'c1', name: 'read', arguments: '{"path":"src/login/form.ts"}' }),
  event(4, 'assistant/message', {
    turn: 1,
    step: 1,
    message: { role: 'assistant', id: 'a1', content: [{ type: 'text', text: '已定位到重复触发。' }] },
    usage: { inputTokens: 1000, cacheReadTokens: 500, cacheWriteTokens: 0, outputTokens: 50 },
  }, 4000),
  event(5, 'step/end', { turn: 1, step: 1 }),
  event(6, 'turn/end', { turn: 1, reason: 'success' }),
  event(7, 'request/context', { provider: 'p', model: 'm', contextWindow: 200000 }),
  event(8, 'session/title', { title: '登录页表单校验', messageSeqs: [2], source: { kind: 'fallback' } }),
  event(9, 'turn/start', { turn: 2 }),
  event(10, 'step/start', { turn: 2, step: 1 }),
  event(
    11,
    'user/message',
    {
      content: [{ type: 'text', text: '补一个验证码刷新后的用例。' }],
      source: { kind: 'user', rpcId: 'r2' },
      role: 'user',
      id: 'u2',
    },
  ),
  event(12, 'assistant/message', {
    turn: 2,
    step: 1,
    message: { role: 'assistant', id: 'a2', content: [{ type: 'text', text: '已补充用例。' }] },
    usage: { inputTokens: 2000, cacheReadTokens: 1000, cacheWriteTokens: 0, outputTokens: 60 },
  }, 8000),
  event(13, 'step/end', { turn: 2, step: 1 }),
  event(14, 'turn/end', { turn: 2, reason: 'success' }),
];

test('analyzeEvents extracts title, turns, boundaries, files and pressure', () => {
  const analysis = analyzeEvents(events);
  assert.equal(analysis.title, '登录页表单校验');
  assert.equal(analysis.turns, 2);
  assert.equal(analysis.boundaries.length, 2);
  assert.deepEqual(analysis.boundaries[0], {
    turn: 1,
    atSeq: 6,
    messageId: 'u1',
    label: '登录页校验误报，帮我定位。',
    time: 1006,
  });
  assert.equal(analysis.boundaries[1].atSeq, 14);
  assert.deepEqual(analysis.files, ['src/login/form.ts']);
  assert.equal(analysis.pressure, 3000);
  assert.equal(analysis.lastSeq, 14);
});

test('extractiveBrief produces a useful overview without a model', () => {
  const brief = extractiveBrief(analyzeEvents(events), '登录页表单校验');
  assert.match(brief.overview, /登录页校验误报/);
  assert.match(brief.overview, /已补充用例/);
  assert.ok(brief.topics.includes('form.ts'));
  assert.ok(brief.decisions.some((line) => line.includes('已补充用例')));
});

test('sameProject normalizes separators and cwd spelling', () => {
  assert.equal(sameProject('D:/tmp/dsh-ra-test', 'D:\\tmp\\dsh-ra-test'), true);
  assert.equal(sameProject('D:/tmp/a', 'D:/tmp/b'), false);
  assert.equal(sameProject(null, 'D:/tmp/a'), false);
});

test('SessionReader.label distinguishes today, yesterday and older', () => {
  const now = new Date('2026-11-19T12:00:00');
  const today = new Date('2026-11-19T08:05:00').getTime();
  const yesterday = new Date('2026-11-18T23:59:00').getTime();
  const older = new Date('2026-11-13T10:00:00').getTime();
  assert.equal(SessionReader.label(today, now.getTime()), '08:05');
  assert.equal(SessionReader.label(yesterday, now.getTime()), '昨天');
  assert.equal(SessionReader.label(older, now.getTime()), '11/13');
});

test('a live log revision invalidates the cached analysis', async () => {
  const events = [
    event(0, 'turn/start', { turn: 1 }),
    event(1, 'user/message', {
      content: [{ type: 'text', text: '任务' }],
      source: { kind: 'user' },
      role: 'user',
      id: 'u1',
    }),
  ];
  let seq = 2;
  let reads = 0;
  const live = {
    get seq() {
      return seq;
    },
    header: { id: 's' },
  };
  const ctx = {
    sessions: { get: () => live },
    sessionQuery: {
      async readSession() {
        reads += 1;
        return { session: { id: 's' }, events: structuredClone(events) };
      },
    },
  };
  const reader = new SessionReader(ctx, {});
  const first = await reader.read('s', 100);
  events.push(event(2, 'turn/end', { turn: 1, reason: 'success' }, 2000));
  seq = 3;
  const second = await reader.read('s', 100);
  assert.equal(reads, 2);
  assert.equal(first.analysis.lastSeq, 1);
  assert.equal(second.analysis.lastSeq, 2);
});

test('cold sessions reuse the analysis until their updatedAt changes', async () => {
  const events = [event(0, 'turn/start', { turn: 1 })];
  let reads = 0;
  const ctx = {
    sessions: { get: () => undefined },
    sessionQuery: {
      async readSession() {
        reads += 1;
        return { session: { id: 's' }, events: structuredClone(events) };
      },
    },
  };
  const reader = new SessionReader(ctx, {});
  await reader.read('s', 100);
  await reader.read('s', 100);
  assert.equal(reads, 1);
  await reader.read('s', 200);
  assert.equal(reads, 2);
});

