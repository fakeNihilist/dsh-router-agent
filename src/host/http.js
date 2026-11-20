/**
 * Authenticated exact Fetch routes under `/api/router`.
 *
 * `ctx.connection.fetch.register` already owns Host/Origin checks and browser
 * authentication; these handlers only parse and answer. The browser half calls
 * absolute `/api/router/...` URLs so the same code works in the web carrier and
 * in Electron's bridged fetch.
 */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: JSON_HEADERS });
}

export function errorResponse(error) {
  if (error instanceof HttpError) {
    return jsonResponse(
      { ok: false, error: { code: error.code, message: error.message, details: error.details } },
      error.status,
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return jsonResponse({ ok: false, error: { code: 'internal', message } }, 500);
}

/**
 * @param {object} ctx Host context.
 * @param {object} service RouterService.
 * @param {object} fetchRegistry `ctx.connection.fetch`.
 */
export function registerRoutes(ctx, service, fetchRegistry) {
  const disposers = [];
  const register = (path, methods, fetch) => {
    disposers.push(
      fetchRegistry.register({
        path,
        methods,
        requestBody: 'buffered',
        fetch,
      }),
    );
  };

  register('/api/router/state', ['GET'], async (request) => {
    try {
      const url = new URL(request.url);
      return jsonResponse(await service.state({ project: url.searchParams.get('project') ?? undefined }));
    } catch (error) {
      return errorResponse(error);
    }
  });

  register('/api/router/probe', ['GET'], async () => {
    try {
      return jsonResponse(await service.probeReport());
    } catch (error) {
      return errorResponse(error);
    }
  });

  register('/api/router/api', ['POST'], async (request) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch {
        throw new HttpError(400, 'bad-json', 'Request body must be JSON.');
      }
      if (!body || typeof body !== 'object' || typeof body.op !== 'string') {
        throw new HttpError(400, 'bad-request', 'Body must carry an `op` string.');
      }
      return jsonResponse(await service.api(body.op, body));
    } catch (error) {
      return errorResponse(error);
    }
  });

  ctx.effect(() => () => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch {
        // Teardown is best effort; the connection owns route lifetime too.
      }
    }
  }, 'dsh-router-agent: http routes');
}
