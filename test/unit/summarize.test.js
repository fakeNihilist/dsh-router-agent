import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSummaryInput } from '../../src/host/brief/summarize.js';

function makeRow() {
  return {
    sessionId: 's',
    title: 'T',
    lastActiveAt: 1,
    analysis: {
      title: 'T',
      turns: 40,
      prompts: Array.from({ length: 30 }, (_, index) => ({
        text: `第 ${index} 个任务 ${'很长的上下文'.repeat(80)}`,
        messageId: `u${index}`,
      })),
      answers: Array.from({ length: 20 }, (_, index) => ({
        text: `第 ${index} 个回复 ${'很长的回复'.repeat(80)}`,
      })),
      boundaries: Array.from({ length: 40 }, (_, index) => ({
        turn: index + 1,
        atSeq: index,
        label: `第 ${index} 轮结束`,
      })),
      files: Array.from({ length: 30 }, (_, index) => `src/file-${index}.ts`),
    },
  };
}

test('buildSummaryInput stays inside the configured character budget', () => {
  const row = makeRow();
  const brief = { title: 'T' };
  for (const budget of [1500, 4000, 8000]) {
    const input = buildSummaryInput(row, brief, budget);
    assert.ok(input.length <= budget + 400, `budget ${budget}, got ${input.length}`);
  }
});

test('buildSummaryInput redacts secrets before they reach the model', () => {
  const row = {
    sessionId: 's',
    title: 'T',
    lastActiveAt: 1,
    analysis: {
      title: 'T',
      turns: 1,
      prompts: [{ text: '请使用 sk-abcdef1234567890 调用接口', messageId: 'u1' }],
      answers: [{ text: 'Authorization: Bearer abcdefghijklmnop' }],
      boundaries: [{ turn: 1, atSeq: 1, label: '完成' }],
      files: ['src/file.ts'],
    },
  };
  const input = buildSummaryInput(row, { title: 'T' }, 8000);
  assert.doesNotMatch(input, /sk-abcdef/);
  assert.doesNotMatch(input, /Bearer abcdefghijklmnop/);
  assert.match(input, /sk-\*\*\*/);
});
