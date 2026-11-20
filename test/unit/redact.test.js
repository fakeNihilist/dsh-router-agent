import assert from 'node:assert/strict';
import test from 'node:test';
import { redactBrief, redactSecrets } from '../../src/host/util/redact.js';

test('redactSecrets masks provider keys, bearer tokens and key-value secrets', () => {
  const text = [
    'key sk-abcdef1234567890XYZ',
    'Authorization: Bearer abc.def-123_456',
    'api_key = "super-secret-value"',
    'password: hunter2hunter2',
    'nothing to see here',
  ].join('\n');
  const out = redactSecrets(text);
  assert.doesNotMatch(out, /sk-abcdef/);
  assert.match(out, /sk-\*\*\*/);
  assert.doesNotMatch(out, /abc\.def-123/);
  assert.match(out, /Bearer \*\*\*/);
  assert.doesNotMatch(out, /super-secret-value/);
  assert.match(out, /api_key = \*\*\*/);
  assert.doesNotMatch(out, /hunter2hunter2/);
  assert.match(out, /nothing to see here/);
});

test('redactSecrets is safe for empty and non-string input', () => {
  assert.equal(redactSecrets(''), '');
  assert.equal(redactSecrets(null), '');
  assert.equal(redactSecrets(42), '');
});

test('redactBrief redacts every derived text field', () => {
  const brief = redactBrief({
    sessionId: 's',
    title: 'sk-abcdef1234567890',
    nativeTitle: 'Bearer abcdefghijk',
    manual: { title: 'sk-abcdef1234567890', overview: 'sk-abcdef1234567890' },
    overview: 'token sk-abcdef1234567890',
    decisions: ['use Bearer abcdefghijk'],
    topics: ['sk-abcdef1234567890'],
    files: ['src/api_key=supersecret.ts'],
    boundaries: [{ turn: 1, atSeq: 2, messageId: 'm', label: 'sk-abcdef1234567890' }],
  });
  assert.doesNotMatch(brief.title, /sk-abcdef/);
  assert.doesNotMatch(brief.nativeTitle, /abcdefghijk/);
  assert.doesNotMatch(brief.manual.title, /sk-abcdef/);
  assert.doesNotMatch(brief.manual.overview, /sk-abcdef/);
  assert.doesNotMatch(brief.overview, /sk-abcdef/);
  assert.doesNotMatch(brief.decisions[0], /abcdefghijk/);
  assert.doesNotMatch(brief.topics[0], /sk-abcdef/);
  assert.doesNotMatch(brief.files[0], /supersecret/);
  assert.doesNotMatch(brief.boundaries[0].label, /sk-abcdef/);
  assert.equal(brief.boundaries[0].atSeq, 2);
  assert.equal(brief.boundaries[0].messageId, 'm');
});
