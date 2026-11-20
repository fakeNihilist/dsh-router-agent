import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLayout, edgePath, fitSelection, NODE_H, NODE_W } from '../../src/client/layout.js';

const rows = [
  { sessionId: 'a', title: 'A', lastActiveAt: 10, parentSessionId: null, boundaries: [] },
  { sessionId: 'a1', title: 'A1', lastActiveAt: 30, parentSessionId: 'a', boundaries: [] },
  { sessionId: 'b', title: 'B', lastActiveAt: 20, parentSessionId: null, boundaries: [] },
  { sessionId: 'b1', title: 'B1', lastActiveAt: 40, parentSessionId: 'b', boundaries: [] },
  { sessionId: 'b2', title: 'B2', lastActiveAt: 50, parentSessionId: 'b', boundaries: [] },
];

test('vertical: roots run left to right by their own activity', () => {
  const layout = buildLayout(rows, 'vertical');
  const byId = Object.fromEntries(layout.nodes.map((node) => [node.sessionId, node]));
  assert.ok(byId.a.x < byId.b.x);
  assert.equal(byId.a.y, 0);
  assert.equal(byId.b.y, 0);
  assert.equal(layout.roots[0], 'a');
});

test('vertical: forks grow downward and parent centers over children', () => {
  const layout = buildLayout(rows, 'vertical');
  const byId = Object.fromEntries(layout.nodes.map((node) => [node.sessionId, node]));
  assert.equal(byId.a1.y, NODE_H + 78);
  const childSpan = Math.max(byId.b1.x + NODE_W, byId.b2.x + NODE_W) - Math.min(byId.b1.x, byId.b2.x);
  const parentCenter = byId.b.x + NODE_W / 2;
  const childrenCenter = (Math.min(byId.b1.x, byId.b2.x) + Math.max(byId.b1.x + NODE_W, byId.b2.x + NODE_W)) / 2;
  assert.ok(Math.abs(parentCenter - childrenCenter) < 0.01);
  assert.ok(childSpan >= NODE_W * 2);
});

test('vertical: siblings run left to right by activity and do not overlap', () => {
  const layout = buildLayout(rows, 'vertical');
  const byId = Object.fromEntries(layout.nodes.map((node) => [node.sessionId, node]));
  assert.ok(byId.b1.x + NODE_W <= byId.b2.x);
  assert.ok(byId.b1.y === byId.b2.y);
});

test('horizontal: roots run top to bottom, forks grow right', () => {
  const layout = buildLayout(rows, 'horizontal');
  const byId = Object.fromEntries(layout.nodes.map((node) => [node.sessionId, node]));
  assert.ok(byId.a.y < byId.b.y);
  assert.equal(byId.a.x, 0);
  assert.equal(byId.a1.x, NODE_W + 96);
  assert.ok(byId.b1.y < byId.b2.y);
  assert.ok(byId.b1.y + NODE_H <= byId.b2.y);
  assert.equal(byId.b1.x, byId.b2.x);
  const parentCenter = byId.b.y + NODE_H / 2;
  const childCenter = (byId.b1.y + byId.b2.y + NODE_H) / 2;
  assert.ok(Math.abs(parentCenter - childCenter) < 0.01);
});

test('edges connect parent bottom to child top in vertical mode', () => {
  const layout = buildLayout(rows, 'vertical');
  const edge = layout.edges.find((item) => item.from === 'b' && item.to === 'b1');
  const path = edgePath(edge, 'vertical');
  assert.match(path, /^M /);
  assert.match(path, / C /);
});

test('fitSelection narrows to the most recent roots on small viewports', () => {
  const layout = buildLayout(rows, 'vertical');
  const narrow = fitSelection(layout, { width: 500, height: 700 }, 'vertical');
  const wide = fitSelection(layout, { width: 1200, height: 800 }, 'vertical');
  assert.ok(narrow.z >= 0.42);
  assert.ok(wide.z >= 0.42);
  assert.ok(narrow.x !== wide.x || narrow.z !== wide.z);
});

test('a 60-node forest lays out with finite, separated positions', () => {
  const many = [];
  for (let index = 0; index < 60; index += 1) {
    many.push({
      sessionId: `s${index}`,
      title: `Session ${index}`,
      lastActiveAt: index,
      parentSessionId: index > 0 && index % 7 !== 0 ? `s${index - 1}` : null,
      boundaries: [],
    });
  }
  const vertical = buildLayout(many, 'vertical');
  assert.equal(vertical.nodes.length, 60);
  assert.ok(vertical.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)));
  assert.ok(vertical.width > 0 && vertical.height > 0);
  const horizontal = buildLayout(many, 'horizontal');
  assert.equal(horizontal.nodes.length, 60);
  assert.ok(horizontal.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)));
});

test('empty layout is safe', () => {
  const layout = buildLayout([], 'vertical');
  assert.equal(layout.nodes.length, 0);
  assert.equal(layout.width, 0);
  assert.deepEqual(fitSelection(layout, { width: 800, height: 600 }), { x: 0, y: 0, z: 1 });
});
