/**
 * dsh-router-agent — Host plugin entry.
 *
 * The host owns every session read/write, sidecar write, and dispatch. The
 * browser panel only calls `/api/router/*`; the Router Agent preset only sees
 * four read-only/propose tools.
 */

import { registerRoutes } from './http.js';
import { RouterService } from './router-service.js';

export const name = 'dsh-router-agent';

export const inject = ['sessions', 'agents', 'sessionQuery', 'sessionController'];

export function apply(ctx, config = {}) {
  const service = new RouterService(ctx, config);

  ctx.effect(() => {
    const disposeService = ctx.provide('routerAgent', service);
    return () => {
      disposeService();
      service.dispose();
    };
  }, 'dsh-router-agent: service');

  ctx.effect(() => {
    const off = ctx.on?.('session/event', (session, event) => service.onSessionEvent(session, event));
    return () => off?.();
  }, 'dsh-router-agent: session events');

  // `connection` is provided by the Web carrier and may activate after this
  // Host plugin. Waiting through `ctx.inject` avoids a permanently missing
  // `/api/router/*` surface when the carrier is simply later in boot order.
  ctx.inject(['connection'], (connectionCtx) => {
    const connection = connectionCtx.connection;
    if (!connection?.fetch?.register) {
      connectionCtx.logger?.warn?.(
        '[dsh-router-agent] authenticated /api fetch is unavailable; the panel will not receive data',
      );
      return;
    }
    registerRoutes(connectionCtx, service, connection.fetch);
  });

  ctx.logger?.info?.(
    '[dsh-router-agent] capabilities: %o',
    {
      fork: service.probe.sessionController.fork,
      compaction: service.probe.compaction,
      planMode: service.probe.planMode,
      permissionPresets: service.probe.permissionPresets,
      projections: service.probe.projections,
      fetch: service.probe.fetch,
    },
  );
}
