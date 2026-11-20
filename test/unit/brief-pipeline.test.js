import assert from 'node:assert/strict';
import test from 'node:test';
import { BriefPipeline } from '../../src/host/brief/summarize.js';

function makeRow() {
  return {
    sessionId: 's',
    title: 'T',
    lastActiveAt: 100,
    analysis: {
      title: 'T',
      turns: 1,
      prompts: [{ text: '任务 sk-abcdef1234567890', messageId: 'u1' }],
      answers: [{ text: '回复 Bearer abcdefghijkl' }],
      boundaries: [{ turn: 1, atSeq: 2, messageId: 'm1', label: '输入标签' }],
      files: ['src/f.ts'],
      lastSeq: 3,
    },
  };
}

function makeHarness() {
  const saved = [];
  const store = {
    async read() {
      return { settings: { raModel: { provider: 'p', model: 'm' }, composer: {} }, titles: {} };
    },
    async getBrief() {
      return null;
    },
    async saveBrief(brief) {
      saved.push(brief);
    },
    async onboarding() {},
  };
  const state = { response: null, captured: null };
  const llm = {
    stream(options) {
      state.captured = options;
      return (async function* stream() {
        yield { type: 'text-delta', text: state.response };
      })();
    },
  };
  const reader = {
    ctx: {
      get: (name) => (name === 'llm' ? llm : undefined),
      sessionController: {
        async modelCatalog() {
          return { default: { provider: 'p', model: 'm' }, groups: [] };
        },
      },
    },
  };
  return { saved, store, reader, state };
}

test('BriefPipeline uses the LLM summary and keeps boundary identity from the log', async () => {
  const harness = makeHarness();
  harness.state.response = JSON.stringify({
    overview: '模型概览',
    topics: ['主题'],
    decisions: ['决定'],
    files: ['src/g.ts'],
    boundaries: [{ turn: 1, label: '模型标签' }],
  });
  const pipeline = new BriefPipeline(harness.store, harness.reader, { summaryUseLlm: true });
  const brief = await pipeline.build(makeRow());
  assert.equal(brief.summaryStatus, 'ready');
  assert.equal(brief.overview, '模型概览');
  assert.deepEqual(brief.topics, ['主题']);
  assert.equal(brief.boundaries[0].label, '模型标签');
  assert.equal(brief.boundaries[0].atSeq, 2);
  assert.equal(brief.boundaries[0].messageId, 'm1');
  assert.equal(brief.boundaries[0].turn, 1);
  assert.equal(harness.saved.length, 1);
  assert.equal(harness.saved[0], brief);
  assert.ok(harness.state.captured.maxTokens >= 600);
  const input = harness.state.captured.messages[0].content[0].text;
  assert.doesNotMatch(input, /sk-abcdef/);
  assert.doesNotMatch(input, /Bearer abcdefghijkl/);
});

test('BriefPipeline falls back to the extractive brief when the model returns no JSON', async () => {
  const harness = makeHarness();
  harness.state.response = 'not json';
  const pipeline = new BriefPipeline(harness.store, harness.reader, { summaryUseLlm: true });
  const brief = await pipeline.build(makeRow());
  assert.equal(brief.summaryStatus, 'fallback');
  assert.match(brief.overview, /任务/);
  assert.equal(brief.boundaries[0].atSeq, 2);
  assert.equal(harness.saved.length, 1);
});
