/**
 * Pure tidy-tree layouts for the infinite canvas.
 *
 * vertical:   roots run left → right by their own last activity; forks grow
 *             downward; siblings run left → right; a parent is centered over
 *             its children and never moves because a child was active.
 * horizontal: roots run top → bottom; forks grow right; siblings top → bottom;
 *             a parent is centered vertically over its children.
 */
export const NODE_W = 248;
export const NODE_H = 88;

const byActivity = (left, right) =>
  Number(left.lastActiveAt || 0) - Number(right.lastActiveAt || 0) ||
  String(left.sessionId).localeCompare(String(right.sessionId));

export function buildLayout(sessions, mode = 'vertical', opts = {}) {
  const nodeW = opts.nodeW ?? NODE_W;
  const nodeH = opts.nodeH ?? NODE_H;
  const gapX = opts.gapX ?? (mode === 'horizontal' ? 96 : 44);
  const gapY = opts.gapY ?? (mode === 'horizontal' ? 46 : 78);
  const rows = Array.isArray(sessions) ? sessions : [];
  const byId = new Map(rows.map((row) => [row.sessionId, row]));
  const children = new Map();
  for (const row of rows) {
    if (!row.parentSessionId || !byId.has(row.parentSessionId)) continue;
    const list = children.get(row.parentSessionId) ?? [];
    list.push(row);
    children.set(row.parentSessionId, list);
  }
  for (const list of children.values()) list.sort(byActivity);
  const roots = rows.filter((row) => !row.parentSessionId || !byId.has(row.parentSessionId)).sort(byActivity);

  const positions = new Map();
  const edges = [];

  if (mode === 'horizontal') {
    // Subtree height drives the vertical cursor; depth drives x.
    const heights = new Map();
    const measure = (row) => {
      const kids = children.get(row.sessionId) ?? [];
      const own = kids.length === 0 ? nodeH : kids.reduce((sum, kid) => sum + measure(kid), 0) + gapY * (kids.length - 1);
      const value = Math.max(nodeH, own);
      heights.set(row.sessionId, value);
      return value;
    };
    const place = (row, depth, top) => {
      const kids = children.get(row.sessionId) ?? [];
      const span = heights.get(row.sessionId) ?? nodeH;
      const center = top + span / 2;
      positions.set(row.sessionId, {
        x: depth * (nodeW + gapX),
        y: center - nodeH / 2,
        depth,
      });
      let cursor = top;
      for (const kid of kids) {
        const kidSpan = heights.get(kid.sessionId) ?? nodeH;
        place(kid, depth + 1, cursor);
        cursor += kidSpan + gapY;
      }
    };
    let cursor = 0;
    for (const root of roots) {
      const span = measure(root);
      place(root, 0, cursor);
      cursor += span + gapY;
    }
  } else {
    // Subtree width drives the horizontal cursor; depth drives y.
    const widths = new Map();
    const measure = (row) => {
      const kids = children.get(row.sessionId) ?? [];
      const own = kids.length === 0 ? nodeW : kids.reduce((sum, kid) => sum + measure(kid), 0) + gapX * (kids.length - 1);
      const value = Math.max(nodeW, own);
      widths.set(row.sessionId, value);
      return value;
    };
    const place = (row, depth, left) => {
      const kids = children.get(row.sessionId) ?? [];
      const span = widths.get(row.sessionId) ?? nodeW;
      const center = left + span / 2;
      positions.set(row.sessionId, {
        x: center - nodeW / 2,
        y: depth * (nodeH + gapY),
        depth,
      });
      let cursor = left;
      for (const kid of kids) {
        const kidSpan = widths.get(kid.sessionId) ?? nodeW;
        place(kid, depth + 1, cursor);
        cursor += kidSpan + gapX;
      }
    };
    let cursor = 0;
    for (const root of roots) {
      const span = measure(root);
      place(root, 0, cursor);
      cursor += span + gapX;
    }
  }

  for (const row of rows) {
    if (!row.parentSessionId || !byId.has(row.parentSessionId)) continue;
    const from = positions.get(row.parentSessionId);
    const to = positions.get(row.sessionId);
    if (from && to) edges.push({ from: row.parentSessionId, to: row.sessionId, fromPos: from, toPos: to });
  }

  const nodes = rows.map((row) => ({
    ...row,
    ...positions.get(row.sessionId),
  }));
  const maxX = nodes.reduce((max, node) => Math.max(max, node.x + nodeW), 0);
  const maxY = nodes.reduce((max, node) => Math.max(max, node.y + nodeH), 0);
  return { nodes, edges, roots: roots.map((row) => row.sessionId), width: maxX, height: maxY, nodeW, nodeH, mode };
}

export function edgePath(edge, mode = 'vertical') {
  const { fromPos, toPos } = edge;
  if (mode === 'horizontal') {
    const x1 = fromPos.x + NODE_W;
    const y1 = fromPos.y + NODE_H / 2;
    const x2 = toPos.x;
    const y2 = toPos.y + NODE_H / 2;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }
  const x1 = fromPos.x + NODE_W / 2;
  const y1 = fromPos.y + NODE_H;
  const x2 = toPos.x + NODE_W / 2;
  const y2 = toPos.y;
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

/** Bounds of a node subset, used by fit and “latest”. */
export function boundsOf(nodes, nodeW = NODE_W, nodeH = NODE_H) {
  if (!nodes.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + nodeW);
    maxY = Math.max(maxY, node.y + nodeH);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Choose the initial viewport. Narrow panels show only the most recent root
 * subtrees; wide panels show more. This is what keeps a 57% zoom from making
 * every title unreadable on first paint.
 */
export function fitSelection(layout, viewport, mode = 'vertical', opts = {}) {
  if (!layout.nodes.length) return { x: 0, y: 0, z: 1 };
  const width = Math.max(320, viewport.width || 900);
  const narrow = width < 700;
  const medium = width < 980;
  const rootIds = new Set(layout.roots);
  const roots = layout.nodes
    .filter((node) => rootIds.has(node.sessionId))
    .sort((a, b) => Number(b.lastActiveAt || 0) - Number(a.lastActiveAt || 0));
  const keep = narrow ? 1 : medium ? 3 : 4;
  const selectedRoots = new Set(roots.slice(0, keep).map((row) => row.sessionId));
  const keepIds = new Set();
  const walk = (id) => {
    keepIds.add(id);
    for (const node of layout.nodes) {
      if (node.parentSessionId === id) walk(node.sessionId);
    }
  };
  for (const id of selectedRoots) walk(id);
  let nodes = layout.nodes.filter((node) => keepIds.has(node.sessionId));
  if (nodes.length === 0) nodes = layout.nodes;
  const bounds = boundsOf(nodes, layout.nodeW, layout.nodeH);
  const padding = narrow ? 18 : 48;
  const availableW = Math.max(120, width - padding * 2);
  // Reserve the composer area, then top-align the forest. Centering a short
  // tree left a large dead band under the header and pushed children behind
  // the composer on medium trees.
  const top = mode === 'horizontal' ? 28 : narrow ? 18 : 72;
  const bottomReserve = opts.bottomReserve ?? (narrow ? 250 : 230);
  const availableH = Math.max(120, (viewport.height || 800) - top - bottomReserve);
  const z = clamp(Math.min(availableW / Math.max(1, bounds.width), availableH / Math.max(1, bounds.height)), 0.42, 1.18);
  const x = -bounds.minX * z + (width - bounds.width * z) / 2;
  const y = top - bounds.minY * z;
  return { x, y, z };
}

/** Center one node in the viewport without changing zoom. */
export function centerOn(node, viewport, z, nodeW = NODE_W, nodeH = NODE_H) {
  return {
    x: (viewport.width || 900) / 2 - (node.x + nodeW / 2) * z,
    y: (viewport.height || 700) / 2 - (node.y + nodeH / 2) * z,
    z,
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
