/** Same-origin Host API helper. All panel data goes through these routes. */
export async function apiState(project) {
  const query = project ? `?project=${encodeURIComponent(project)}` : '';
  const response = await fetch(`/api/router/state${query}`, {
    headers: { accept: 'application/json' },
  });
  return readResponse(response);
}

export async function apiOp(op, payload = {}) {
  const response = await fetch('/api/router/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ ...payload, op }),
  });
  return readResponse(response);
}

async function readResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Keep the status when the carrier answers non-JSON.
  }
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error?.message ?? `请求失败（HTTP ${response.status}）`);
    error.code = body?.error?.code ?? `http-${response.status}`;
    error.status = response.status;
    error.details = body?.error?.details;
    throw error;
  }
  return body;
}
