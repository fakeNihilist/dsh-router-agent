/**
 * Secret redaction for the Router's own derived data.
 *
 * Sidecar briefs and dispatch history are derived from session text that may
 * contain pasted credentials. The user's task text that is actually delivered
 * to a target session is never rewritten; only the Router's stored/derived
 * copies (briefs and dispatch rows) are.
 */

const PATTERNS = [
  // sk-… API keys (DeepSeek, OpenAI-compatible providers).
  { pattern: /\bsk-[A-Za-z0-9_-]{8,}\b/g, replace: 'sk-***' },
  // Authorization headers.
  { pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, replace: 'Bearer ***' },
  // key=value / key: value pairs for common secret names.
  {
    pattern: /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\s*[:=]\s*)("[^"]{8,}"|'[^']{8,}'|[^\s,;]{8,})/gi,
    replace: (_match, prefix) => `${prefix}***`,
  },
];

/**
 * Mask credential-looking spans in one string.
 *
 * @param {unknown} value Input text.
 * @returns {string} Redacted text (`''` for non-strings).
 */
export function redactSecrets(value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  let out = value;
  for (const { pattern, replace } of PATTERNS) out = out.replace(pattern, replace);
  return out;
}

/**
 * Redact every user-visible text field of a brief before it is persisted or
 * handed to the Router Agent.
 *
 * @param {object} brief Brief produced by the pipeline.
 * @returns {object} the same brief shape with redacted text.
 */
export function redactBrief(brief) {
  return {
    ...brief,
    title: redactSecrets(brief.title),
    nativeTitle: typeof brief.nativeTitle === 'string' ? redactSecrets(brief.nativeTitle) : brief.nativeTitle,
    overview: redactSecrets(brief.overview),
    decisions: (brief.decisions ?? []).map((line) => redactSecrets(line)),
    topics: (brief.topics ?? []).map((line) => redactSecrets(line)),
    files: (brief.files ?? []).map((line) => redactSecrets(line)),
    manual: {
      ...(brief.manual ?? {}),
      title: brief.manual?.title ? redactSecrets(brief.manual.title) : null,
      overview: brief.manual?.overview ? redactSecrets(brief.manual.overview) : null,
    },
    boundaries: (brief.boundaries ?? []).map((boundary) => ({
      ...boundary,
      label: redactSecrets(boundary.label),
    })),
  };
}
