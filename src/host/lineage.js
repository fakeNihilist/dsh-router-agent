/**
 * Resolve a session's parent without inventing one.
 *
 * 0.2.2 ordinary forks omit `parentSession`, so the plugin records the parent
 * of every fork it creates in `.dsh_RA/state.json` (`lineage`). For older or
 * externally created forks the native header is authoritative; a `Fork of X`
 * title is used only when it names exactly one project session. Everything
 * else stays a root — a wrong edge is worse than no edge.
 */
export function resolveParent(row, byId, state) {
  const native = row.parentSessionId;
  if (native && byId.has(native)) return native;
  const sidecar = state?.lineage?.[row.sessionId];
  if (sidecar && byId.has(sidecar)) return sidecar;
  const title = row.title ?? '';
  const match = /^Fork of\s+(.+)$/i.exec(title.trim());
  if (match) {
    const wanted = match[1].trim().toLowerCase();
    const hits = [...byId.values()].filter(
      (candidate) =>
        candidate.sessionId !== row.sessionId &&
        String(candidate.title ?? '').trim().toLowerCase() === wanted,
    );
    if (hits.length === 1) return hits[0].sessionId;
  }
  return null;
}

/**
 * Build the tracked forest. A stopped parent is absent from `byId`, so its
 * tracked children naturally become roots; restoring the parent reattaches
 * them without a second bookkeeping step.
 */
export function buildForest(rows, state) {
  const byId = new Map(rows.map((row) => [row.sessionId, row]));
  const parentOf = new Map();
  for (const row of rows) parentOf.set(row.sessionId, resolveParent(row, byId, state));
  const children = new Map();
  for (const row of rows) {
    const parent = parentOf.get(row.sessionId);
    if (!parent) continue;
    const list = children.get(parent) ?? [];
    list.push(row);
    children.set(parent, list);
  }
  const roots = rows.filter((row) => !parentOf.get(row.sessionId));
  return { byId, parentOf, children, roots };
}

/** Depth-first collection of one subtree (excluding the root when asked). */
export function subtree(forest, rootId, includeRoot = false) {
  const out = includeRoot ? [forest.byId.get(rootId)].filter(Boolean) : [];
  const walk = (id) => {
    for (const child of forest.children.get(id) ?? []) {
      out.push(child);
      walk(child.sessionId);
    }
  };
  walk(rootId);
  return out;
}
