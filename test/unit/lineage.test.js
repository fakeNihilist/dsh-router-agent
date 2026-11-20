import assert from 'node:assert/strict';
import test from 'node:test';
import { buildForest, resolveParent, subtree } from '../../src/host/lineage.js';

const row = (id, title, lastActiveAt, extra = {}) => ({
  sessionId: id,
  title,
  lastActiveAt,
  parentSessionId: null,
  ...extra,
});

test('native parentSession wins', () => {
  const byId = new Map([
    ['p', row('p', 'Parent', 1)],
    ['c', row('c', 'Child', 2, { parentSessionId: 'p' })],
  ]);
  assert.equal(resolveParent(byId.get('c'), byId, {}), 'p');
});

test('sidecar lineage restores the parent of a 0.2.2 ordinary fork', () => {
  const byId = new Map([
    ['p', row('p', 'Parent', 1)],
    ['c', row('c', 'Child', 2)],
  ]);
  assert.equal(resolveParent(byId.get('c'), byId, { lineage: { c: 'p' } }), 'p');
});

test('Fork of title is used only when it names exactly one session', () => {
  const byId = new Map([
    ['p', row('p', 'Router 设计', 1)],
    ['c', row('c', 'Fork of Router 设计', 2)],
  ]);
  assert.equal(resolveParent(byId.get('c'), byId, {}), 'p');
  const ambiguous = new Map([
    ['p1', row('p1', 'Router 设计', 1)],
    ['p2', row('p2', 'Router 设计', 2)],
    ['c', row('c', 'Fork of Router 设计', 3)],
  ]);
  assert.equal(resolveParent(ambiguous.get('c'), ambiguous, {}), null);
});

test('missing parent and unknown lineage stay root', () => {
  const byId = new Map([['c', row('c', 'Child', 2, { parentSessionId: 'gone' })]]);
  assert.equal(resolveParent(byId.get('c'), byId, {}), null);
});

test('stopped parent is absent, so tracked children become roots', () => {
  const rows = [
    row('p', 'Parent', 1),
    row('c', 'Child', 2, { parentSessionId: 'p' }),
    row('g', 'Grandchild', 3, { parentSessionId: 'c' }),
  ];
  const all = buildForest(rows, {});
  assert.equal(all.roots.length, 1);
  assert.equal(all.roots[0].sessionId, 'p');
  assert.equal(subtree(all, 'p', false).length, 2);
  const withoutParent = buildForest(rows.filter((item) => item.sessionId !== 'p'), {});
  assert.equal(withoutParent.roots[0].sessionId, 'c');
  assert.ok(subtree(withoutParent, 'c', false).some((item) => item.sessionId === 'g'));
});
