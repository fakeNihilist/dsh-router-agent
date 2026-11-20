/* dsh-router-agent — generated client bundle. Do not edit. */
window.__ModuleLoader__.load({
  id: 'dsh-router-agent',
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    (function (require, module, exports) {
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react9 = __toESM(require("react"), 1);

// src/client/RouterPanel.jsx
var import_react8 = __toESM(require("react"), 1);

// src/client/api.js
async function apiState(project) {
  const query = project ? `?project=${encodeURIComponent(project)}` : "";
  const response = await fetch(`/api/router/state${query}`, {
    headers: { accept: "application/json" }
  });
  return readResponse(response);
}
async function apiOp(op, payload = {}) {
  const response = await fetch("/api/router/api", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ ...payload, op })
  });
  return readResponse(response);
}
async function readResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
  }
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error?.message ?? `\u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
    error.code = body?.error?.code ?? `http-${response.status}`;
    error.status = response.status;
    error.details = body?.error?.details;
    throw error;
  }
  return body;
}

// src/client/Canvas.jsx
var import_react3 = __toESM(require("react"), 1);

// src/client/NodeCard.jsx
var import_react2 = __toESM(require("react"), 1);

// src/client/icons.jsx
var import_react = __toESM(require("react"), 1);
var base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true
};
function RouterIcon({ size = 20 }) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, width: size, height: size, viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "6", cy: "6", r: "2.2" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "18", cy: "6", r: "2.2" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "12", cy: "18", r: "2.2" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "M8.2 6h7.6M7.2 8l4 8M16.8 8l-4 8" }));
}
function SearchIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "11", cy: "11", r: "6.5" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "m16 16 4 4" }));
}
function HistoryIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("path", { d: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "M3.5 4.5v4h4M12 7.5V12l3 2" }));
}
function SettingsIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" }));
}
function MoreIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "5", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "12", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "19", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }));
}
function CompressIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("path", { d: "M9 4H4v5M15 20h5v-5M4 9l5-5M20 15l-5 5" }));
}
function CloseIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("path", { d: "m6 6 12 12M18 6 6 18" }));
}
function StopIcon(props) {
  return /* @__PURE__ */ import_react.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "12", cy: "12", r: "8.5" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "M9 9h6v6H9z" }));
}

// src/client/NodeCard.jsx
function level(percent) {
  if (percent === null || percent === void 0) return "ok";
  if (percent >= 85) return "high";
  if (percent >= 60) return "warn";
  return "ok";
}
function NodeCard({
  node,
  x,
  y,
  selected,
  pending,
  isNew,
  dim,
  onSelect,
  onOpen,
  onCompress,
  canCompress = true
}) {
  const percent = node.context?.percent;
  return /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "dra-node",
      "data-session-id": node.sessionId,
      "data-selected": selected ? "true" : "false",
      "data-pending": pending ? "true" : "false",
      "data-running": node.running ? "true" : "false",
      "data-new": isNew ? "true" : "false",
      "data-dim": dim ? "true" : "false",
      style: { left: `${x}px`, top: `${y}px` },
      role: "button",
      tabIndex: 0,
      "aria-label": node.title,
      onClick: (event) => {
        event.stopPropagation();
        onSelect?.(node.sessionId);
      },
      onDoubleClick: (event) => {
        event.stopPropagation();
        onOpen?.(node.sessionId);
      },
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(node.sessionId);
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "dra-node-top" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "dra-node-title" }, node.title), /* @__PURE__ */ import_react2.default.createElement("span", { className: "dra-node-dot", title: node.running ? "\u6B63\u5728\u8FD0\u884C" : "\u7A7A\u95F2" })),
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "dra-node-meta" }, /* @__PURE__ */ import_react2.default.createElement("span", null, node.lastActiveLabel), /* @__PURE__ */ import_react2.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react2.default.createElement("span", { className: "dra-ctx", "data-level": level(percent), title: percent === null ? "\u4E0A\u4E0B\u6587\u672A\u77E5" : `\u4E0A\u4E0B\u6587 ${percent}%` }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "dra-ctx-text" }, percent === null || percent === void 0 ? "\u2014" : `${percent}%`), /* @__PURE__ */ import_react2.default.createElement("span", { className: "dra-ctx-bar" }, /* @__PURE__ */ import_react2.default.createElement("i", { style: { width: `${Math.min(100, Math.max(0, percent ?? 0))}%` } })), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        className: "dra-compress",
        type: "button",
        title: canCompress ? "\u538B\u7F29\u4E0A\u4E0B\u6587" : "\u5F53\u524D\u90E8\u7F72\u4E0D\u652F\u6301\u538B\u7F29",
        "aria-label": "\u538B\u7F29\u4E0A\u4E0B\u6587",
        disabled: !canCompress,
        onClick: (event) => {
          event.stopPropagation();
          onCompress?.(node);
        }
      },
      /* @__PURE__ */ import_react2.default.createElement(CompressIcon, { width: 13, height: 13 })
    )))
  );
}

// src/client/layout.js
var NODE_W = 248;
var NODE_H = 88;
var byActivity = (left, right) => Number(left.lastActiveAt || 0) - Number(right.lastActiveAt || 0) || String(left.sessionId).localeCompare(String(right.sessionId));
function buildLayout(sessions, mode = "vertical", opts = {}) {
  const nodeW = opts.nodeW ?? NODE_W;
  const nodeH = opts.nodeH ?? NODE_H;
  const gapX = opts.gapX ?? (mode === "horizontal" ? 96 : 44);
  const gapY = opts.gapY ?? (mode === "horizontal" ? 46 : 78);
  const rows = Array.isArray(sessions) ? sessions : [];
  const byId = new Map(rows.map((row) => [row.sessionId, row]));
  const children = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!row.parentSessionId || !byId.has(row.parentSessionId)) continue;
    const list = children.get(row.parentSessionId) ?? [];
    list.push(row);
    children.set(row.parentSessionId, list);
  }
  for (const list of children.values()) list.sort(byActivity);
  const roots = rows.filter((row) => !row.parentSessionId || !byId.has(row.parentSessionId)).sort(byActivity);
  const positions = /* @__PURE__ */ new Map();
  const edges = [];
  if (mode === "horizontal") {
    const heights = /* @__PURE__ */ new Map();
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
        depth
      });
      let cursor2 = top;
      for (const kid of kids) {
        const kidSpan = heights.get(kid.sessionId) ?? nodeH;
        place(kid, depth + 1, cursor2);
        cursor2 += kidSpan + gapY;
      }
    };
    let cursor = 0;
    for (const root of roots) {
      const span = measure(root);
      place(root, 0, cursor);
      cursor += span + gapY;
    }
  } else {
    const widths = /* @__PURE__ */ new Map();
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
        depth
      });
      let cursor2 = left;
      for (const kid of kids) {
        const kidSpan = widths.get(kid.sessionId) ?? nodeW;
        place(kid, depth + 1, cursor2);
        cursor2 += kidSpan + gapX;
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
    ...positions.get(row.sessionId)
  }));
  const maxX = nodes.reduce((max, node) => Math.max(max, node.x + nodeW), 0);
  const maxY = nodes.reduce((max, node) => Math.max(max, node.y + nodeH), 0);
  return { nodes, edges, roots: roots.map((row) => row.sessionId), width: maxX, height: maxY, nodeW, nodeH, mode };
}
function edgePath(edge, mode = "vertical") {
  const { fromPos, toPos } = edge;
  if (mode === "horizontal") {
    const x12 = fromPos.x + NODE_W;
    const y12 = fromPos.y + NODE_H / 2;
    const x22 = toPos.x;
    const y22 = toPos.y + NODE_H / 2;
    const mid2 = (x12 + x22) / 2;
    return `M ${x12} ${y12} C ${mid2} ${y12}, ${mid2} ${y22}, ${x22} ${y22}`;
  }
  const x1 = fromPos.x + NODE_W / 2;
  const y1 = fromPos.y + NODE_H;
  const x2 = toPos.x + NODE_W / 2;
  const y2 = toPos.y;
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}
function boundsOf(nodes, nodeW = NODE_W, nodeH = NODE_H) {
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
function fitSelection(layout, viewport, mode = "vertical", opts = {}) {
  if (!layout.nodes.length) return { x: 0, y: 0, z: 1 };
  const width = Math.max(320, viewport.width || 900);
  const narrow = width < 700;
  const medium = width < 980;
  const rootIds = new Set(layout.roots);
  const roots = layout.nodes.filter((node) => rootIds.has(node.sessionId)).sort((a, b) => Number(b.lastActiveAt || 0) - Number(a.lastActiveAt || 0));
  const keep = narrow ? 1 : medium ? 3 : 4;
  const selectedRoots = new Set(roots.slice(0, keep).map((row) => row.sessionId));
  const keepIds = /* @__PURE__ */ new Set();
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
  const top = mode === "horizontal" ? 28 : narrow ? 18 : 72;
  const bottomReserve = opts.bottomReserve ?? (narrow ? 250 : 230);
  const availableH = Math.max(120, (viewport.height || 800) - top - bottomReserve);
  const z = clamp(Math.min(availableW / Math.max(1, bounds.width), availableH / Math.max(1, bounds.height)), 0.42, 1.18);
  const x = -bounds.minX * z + (width - bounds.width * z) / 2;
  const y = top - bounds.minY * z;
  return { x, y, z };
}
function centerOn(node, viewport, z, nodeW = NODE_W, nodeH = NODE_H) {
  return {
    x: (viewport.width || 900) / 2 - (node.x + nodeW / 2) * z,
    y: (viewport.height || 700) / 2 - (node.y + nodeH / 2) * z,
    z
  };
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// src/client/Canvas.jsx
function Canvas({
  layout,
  view,
  setView,
  selectedId,
  pendingIds,
  newIds,
  search,
  onSelect,
  onOpen,
  onCompress,
  onViewportChange,
  onFit,
  onLatest,
  canCompress = true
}) {
  const canvasRef = (0, import_react3.useRef)(null);
  const [viewport, setViewport] = (0, import_react3.useState)({ width: 900, height: 700 });
  const [panning, setPanning] = (0, import_react3.useState)(false);
  const viewRef = (0, import_react3.useRef)(view);
  viewRef.current = view;
  const panRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    const element = canvasRef.current;
    if (!element) return void 0;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const next = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
      setViewport(next);
      onViewportChange?.(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onViewportChange]);
  (0, import_react3.useEffect)(() => {
    const element = canvasRef.current;
    if (!element) return void 0;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const current = viewRef.current;
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      const z = clamp(current.z * factor, 0.25, 2.5);
      const worldX = (px - current.x) / current.z;
      const worldY = (py - current.y) / current.z;
      setView({ x: px - worldX * z, y: py - worldY * z, z });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [setView]);
  const onPointerDown = (0, import_react3.useCallback)(
    (event) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (target.closest?.(".dra-node, .dra-detail, .dra-zoom, .dra-proposal, .dra-modal, button, select, input, textarea")) {
        return;
      }
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        viewX: viewRef.current.x,
        viewY: viewRef.current.y
      };
      setPanning(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    []
  );
  const onPointerMove = (0, import_react3.useCallback)((event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    setView({
      x: pan.viewX + event.clientX - pan.startX,
      y: pan.viewY + event.clientY - pan.startY,
      z: viewRef.current.z
    });
  }, [setView]);
  const endPan = (0, import_react3.useCallback)(() => {
    panRef.current = null;
    setPanning(false);
  }, []);
  const query = String(search ?? "").trim().toLowerCase();
  const dimmed = (node) => query ? !String(node.title ?? "").toLowerCase().includes(query) : false;
  return /* @__PURE__ */ import_react3.default.createElement(
    "div",
    {
      className: "dra-canvas",
      "data-canvas": true,
      ref: canvasRef,
      "data-panning": panning ? "true" : "false",
      onPointerDown,
      onPointerMove,
      onPointerUp: endPan,
      onPointerCancel: endPan,
      onDoubleClick: (event) => {
        if (!event.target.closest?.(".dra-node")) onFit?.();
      }
    },
    /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        className: "dra-world",
        style: { transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }
      },
      /* @__PURE__ */ import_react3.default.createElement(
        "svg",
        {
          className: "dra-edges",
          width: Math.max(1, layout.width),
          height: Math.max(1, layout.height),
          "aria-hidden": true
        },
        layout.edges.map((edge) => /* @__PURE__ */ import_react3.default.createElement(
          "path",
          {
            key: `${edge.from}-${edge.to}`,
            className: "dra-edge",
            d: edgePath(edge, layout.mode),
            "data-dim": dimmed(edgeNode(edge.from)) || dimmed(edgeNode(edge.to)) ? "true" : "false"
          }
        ))
      ),
      layout.nodes.map((node) => /* @__PURE__ */ import_react3.default.createElement(
        NodeCard,
        {
          key: node.sessionId,
          node,
          x: node.x,
          y: node.y,
          selected: selectedId === node.sessionId,
          pending: pendingIds.has(node.sessionId),
          isNew: newIds.has(node.sessionId),
          dim: dimmed(node),
          onSelect,
          onOpen,
          onCompress,
          canCompress
        }
      ))
    ),
    /* @__PURE__ */ import_react3.default.createElement("div", { className: "dra-zoom" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        className: "dra-icon-btn",
        type: "button",
        title: "\u7F29\u5C0F",
        onClick: () => setView({ ...view, z: clamp(view.z / 1.15, 0.25, 2.5) })
      },
      "\u2212"
    ), /* @__PURE__ */ import_react3.default.createElement("span", { className: "dra-zoom-label" }, Math.round(view.z * 100), "%"), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        className: "dra-icon-btn",
        type: "button",
        title: "\u653E\u5927",
        onClick: () => setView({ ...view, z: clamp(view.z * 1.15, 0.25, 2.5) })
      },
      "+"
    ), /* @__PURE__ */ import_react3.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u9002\u5E94\u753B\u5E03", onClick: onFit }, "\u26F6"), /* @__PURE__ */ import_react3.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u56DE\u5230\u6700\u8FD1", onClick: onLatest }, "\u25CE"))
  );
  function edgeNode(id) {
    return layout.nodes.find((node) => node.sessionId === id);
  }
}

// src/client/Composer.jsx
var import_react4 = __toESM(require("react"), 1);
function Composer({
  task,
  setTask,
  mode,
  setMode,
  permissions,
  setPermissions,
  auto,
  setAuto,
  busy,
  disabled,
  disabledReason,
  onSend,
  planAvailable = true,
  permissionAvailable = true
}) {
  const submit = () => {
    if (!task.trim() || busy || disabled) return;
    onSend();
  };
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "dra-composer" }, /* @__PURE__ */ import_react4.default.createElement(
    "textarea",
    {
      value: task,
      onChange: (event) => setTask(event.target.value),
      onKeyDown: (event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault();
          submit();
        }
      },
      placeholder: disabled ? disabledReason : "\u63CF\u8FF0\u8981\u505A\u7684\u4EFB\u52A1\uFF0CRouter \u4F1A\u5224\u65AD\u7EE7\u7EED\u3001\u5206\u53C9\u8FD8\u662F\u65B0\u5EFA\u2026",
      disabled,
      rows: 2,
      "aria-label": "\u4EFB\u52A1",
      "data-composer-input": true
    }
  ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dra-composer-bar" }, /* @__PURE__ */ import_react4.default.createElement(
    "select",
    {
      className: "dra-select",
      value: mode,
      onChange: (event) => setMode(event.target.value),
      "aria-label": "\u6A21\u5F0F",
      disabled: disabled || !planAvailable
    },
    /* @__PURE__ */ import_react4.default.createElement("option", { value: "standard" }, "\u6807\u51C6"),
    /* @__PURE__ */ import_react4.default.createElement("option", { value: "plan" }, "\u8BA1\u5212\u6A21\u5F0F")
  ), /* @__PURE__ */ import_react4.default.createElement(
    "select",
    {
      className: "dra-select",
      value: permissions,
      onChange: (event) => setPermissions(event.target.value),
      "aria-label": "\u5DE5\u4F5C\u533A\u6743\u9650",
      disabled: disabled || !permissionAvailable
    },
    /* @__PURE__ */ import_react4.default.createElement("option", { value: "read-only" }, "\u53EA\u8BFB"),
    /* @__PURE__ */ import_react4.default.createElement("option", { value: "workspace-write" }, "\u5DE5\u4F5C\u533A\u5185\u4FEE\u6539"),
    /* @__PURE__ */ import_react4.default.createElement("option", { value: "danger-full-access" }, "\u5B8C\u5168\u8BBF\u95EE")
  ), /* @__PURE__ */ import_react4.default.createElement("label", { className: "dra-auto", "data-on": auto ? "true" : "false", title: "\u5F00\u542F\u540E RA \u5224\u65AD\u5B8C\u76F4\u63A5\u6267\u884C\uFF0C\u4E0D\u518D\u786E\u8BA4" }, /* @__PURE__ */ import_react4.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: auto,
      onChange: (event) => setAuto(event.target.checked),
      disabled
    }
  ), /* @__PURE__ */ import_react4.default.createElement("span", { className: "dra-switch" }), "\u81EA\u52A8\u6267\u884C"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react4.default.createElement("span", { className: "dra-tag" }, mode === "plan" ? "\u8BA1\u5212" : "\u6807\u51C6", " \xB7", " ", permissions === "read-only" ? "\u53EA\u8BFB" : permissions === "danger-full-access" ? "\u5B8C\u5168\u8BBF\u95EE" : "\u5DE5\u4F5C\u533A"), /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary",
      type: "button",
      disabled: !task.trim() || busy || disabled,
      onClick: submit,
      "data-send": true
    },
    busy ? "\u53D1\u9001\u4E2D\u2026" : "\u53D1\u9001"
  )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dra-hint", "data-warn": auto ? "true" : "false" }, disabled ? disabledReason : auto ? "\u81EA\u52A8\u6267\u884C\u5DF2\u5F00\u542F\uFF1ARA \u5224\u65AD\u540E\u7531 Host \u6821\u9A8C\u5E76\u76F4\u63A5\u53D1\u9001\u3002" : "\u9ED8\u8BA4\u9700\u8981\u786E\u8BA4\uFF1B\u6A21\u5F0F\u4E0E\u6743\u9650\u6309\u4F1A\u8BDD\u7EA7\u751F\u6548\uFF0C\u786E\u8BA4\u5361\u4F1A\u663E\u793A\u76EE\u6807\u53D8\u5316\u3002"));
}

// src/client/Detail.jsx
var import_react5 = __toESM(require("react"), 1);
function tokens(value) {
  if (value === null || value === void 0) return "\u2014";
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}m`;
  if (value >= 1e3) return `${Math.round(value / 1e3)}k`;
  return String(value);
}
function level2(percent) {
  if (percent === null || percent === void 0) return "ok";
  if (percent >= 85) return "high";
  if (percent >= 60) return "warn";
  return "ok";
}
function Detail({
  session,
  pendingFork,
  onOpen,
  onCompress,
  onStop,
  onRename,
  onSelectAtSeq,
  onClose,
  canCompress = true
}) {
  const [editing, setEditing] = (0, import_react5.useState)(false);
  const [title, setTitle] = (0, import_react5.useState)(session.title);
  (0, import_react5.useEffect)(() => {
    setTitle(session.title);
    setEditing(false);
  }, [session.sessionId, session.title]);
  const percent = session.context?.percent;
  const boundary = pendingFork?.atSeq ?? session.boundaries?.[0]?.atSeq ?? "";
  const commit = () => {
    const clean = title.trim();
    setEditing(false);
    if (clean && clean !== session.title) onRename?.(session.sessionId, clean);
  };
  return /* @__PURE__ */ import_react5.default.createElement("aside", { className: "dra-detail", "data-detail": true, "aria-label": "\u4F1A\u8BDD\u8BE6\u60C5" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-head" }, editing ? /* @__PURE__ */ import_react5.default.createElement(
    "input",
    {
      className: "dra-select dra-grow",
      value: title,
      autoFocus: true,
      onChange: (event) => setTitle(event.target.value),
      onBlur: commit,
      onKeyDown: (event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") {
          setTitle(session.title);
          setEditing(false);
        }
      },
      "aria-label": "\u4F1A\u8BDD\u540D\u79F0"
    }
  ) : /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-title", onDoubleClick: () => setEditing(true), title: "\u53CC\u51FB\u91CD\u547D\u540D" }, session.title), /* @__PURE__ */ import_react5.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u5173\u95ED\u8BE6\u60C5", onClick: onClose }, /* @__PURE__ */ import_react5.default.createElement(CloseIcon, { width: 14, height: 14 }))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-meta" }, session.running ? "\u6B63\u5728\u8FD0\u884C" : "\u7A7A\u95F2", " \xB7 ", session.turns, " \u8F6E \xB7 \u6700\u540E\u6D3B\u8DC3 ", session.lastActiveLabel), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react5.default.createElement("button", { className: "dra-btn dra-btn-primary dra-grow", type: "button", onClick: () => onOpen?.(session.sessionId) }, "\u6253\u5F00\u4F1A\u8BDD"), !editing ? /* @__PURE__ */ import_react5.default.createElement("button", { className: "dra-btn", type: "button", onClick: () => setEditing(true) }, "\u91CD\u547D\u540D") : null), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-section" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-label" }, "\u5206\u53C9\u70B9"), session.boundaries?.length ? /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react5.default.createElement(
    "select",
    {
      className: "dra-select dra-grow",
      value: String(boundary),
      onChange: (event) => onSelectAtSeq?.(session.sessionId, Number(event.target.value)),
      disabled: !pendingFork,
      title: pendingFork ? "\u66F4\u6362 RA \u63D0\u8BAE\u7684\u5206\u53C9\u70B9" : "\u7B49 RA \u63D0\u51FA\u5206\u53C9\u540E\u518D\u9009\u62E9",
      "aria-label": "\u5206\u53C9\u70B9"
    },
    session.boundaries.map((item) => /* @__PURE__ */ import_react5.default.createElement("option", { key: item.atSeq, value: String(item.atSeq) }, "T", item.turn, " \xB7 ", item.label))
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-field-help" }, session.boundaryCount > (session.boundaries?.length ?? 0) ? `\u53EA\u663E\u793A\u6700\u8FD1 ${session.boundaries.length} \u8F6E\uFF08\u5171 ${session.boundaryCount} \u8F6E\uFF09\u3002` : null, pendingFork ? "\u8FD9\u662F RA \u63D0\u8BAE\u7684\u5206\u53C9\u70B9\uFF0C\u53EF\u4EE5\u5728\u8FD9\u91CC\u66F4\u6362\uFF1B\u786E\u8BA4\u540E\u4ECE\u8BE5\u8F6E\u4E4B\u540E\u5206\u53C9\u3002" : "\u5206\u53C9\u70B9\u7531 RA \u5728\u63D0\u8BAE\u4E2D\u7ED9\u51FA\uFF1B\u8FD9\u91CC\u53EA\u5C55\u793A\u53EF\u7528\u8FB9\u754C\u3002")) : /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-field-help" }, "\u8FD8\u6CA1\u6709\u5DF2\u5B8C\u6210\u7684\u8F6E\u6B21\uFF0C\u4E0D\u80FD\u5206\u53C9\u3002")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-section" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-label" }, "\u4E0A\u4E0B\u6587"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-grow" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-ctx-text" }, tokens(session.context?.usedTokens), " / ", tokens(session.context?.limitTokens), percent === null || percent === void 0 ? " \xB7 \u672A\u77E5" : ` \xB7 ${percent}%`), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-ctx-bar", style: { width: "100%", marginTop: 6 }, "data-level": level2(percent) }, /* @__PURE__ */ import_react5.default.createElement("i", { style: { width: `${Math.min(100, Math.max(0, percent ?? 0))}%` } }))), /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-sm",
      type: "button",
      disabled: !canCompress || percent === null || percent === void 0,
      onClick: () => onCompress?.(session),
      title: "\u538B\u7F29\u4E0A\u4E0B\u6587"
    },
    /* @__PURE__ */ import_react5.default.createElement(CompressIcon, { width: 12, height: 12 }),
    "\u538B\u7F29"
  ))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-detail-section" }, /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-danger",
      type: "button",
      onClick: () => onStop?.(session),
      title: "\u505C\u6B62\u8DDF\u8E2A\u8FD9\u4E2A\u4F1A\u8BDD\uFF1B\u8DDF\u8E2A\u4E2D\u7684\u5B50\u4F1A\u8BDD\u4F1A\u79FB\u5230\u9876\u5C42"
    },
    /* @__PURE__ */ import_react5.default.createElement(StopIcon, { width: 13, height: 13 }),
    "\u4E0D\u518D\u8DDF\u8E2A\u4F1A\u8BDD"
  )));
}

// src/client/ProposalCard.jsx
var import_react6 = __toESM(require("react"), 1);
var ACTION_LABEL = {
  route: "\u7EE7\u7EED\u5DF2\u6709\u4F1A\u8BDD",
  fork: "\u4ECE\u5386\u53F2\u8F6E\u6B21\u5206\u53C9",
  new: "\u65B0\u5EFA\u5E72\u51C0\u4F1A\u8BDD",
  ask: "\u9700\u8981\u4F60\u786E\u8BA4"
};
function ProposalCard({ proposal, target, busy, onConfirm, onChoose, onAbandon, onAnswer }) {
  const [answer, setAnswer] = (0, import_react6.useState)("");
  if (!proposal) return null;
  const fork = proposal.action === "fork";
  return /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-proposal", "data-proposal": true, "data-auto": proposal.auto ? "true" : "false" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-proposal-head" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "dra-badge", "data-tone": proposal.action === "ask" ? "warn" : void 0 }, ACTION_LABEL[proposal.action] ?? proposal.action), /* @__PURE__ */ import_react6.default.createElement("span", null, proposal.summary), /* @__PURE__ */ import_react6.default.createElement("span", { className: "dra-spacer" }), proposal.auto ? /* @__PURE__ */ import_react6.default.createElement("span", { className: "dra-badge", "data-tone": "warn" }, "\u81EA\u52A8\u6267\u884C") : null), proposal.reason ? /* @__PURE__ */ import_react6.default.createElement("p", { className: "dra-proposal-reason" }, proposal.reason) : null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-proposal-target" }, proposal.action === "new" ? "\u65B0\u4F1A\u8BDD\u4ECE\u4EFB\u52A1\u539F\u6587\u5F00\u59CB\uFF0C\u4E0D\u5E26\u4EA4\u63A5\u5305\u3002" : proposal.action === "ask" ? proposal.question : `\u76EE\u6807\uFF1A${proposal.targetTitle ?? proposal.targetSessionId}`), proposal.targetSessionId && target ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-proposal-target" }, "\u76EE\u6807\u5F53\u524D\uFF1A", proposal.targetPlan ? "\u8BA1\u5212" : "\u6807\u51C6", " \xB7", " ", proposal.targetPermissions === "read-only" ? "\u53EA\u8BFB" : proposal.targetPermissions === "danger-full-access" ? "\u5B8C\u5168\u8BBF\u95EE" : "\u5DE5\u4F5C\u533A", proposal.targetPlan !== null && proposal.targetPlan !== void 0 && (proposal.targetPlan !== (proposal.composer?.mode === "plan") || proposal.targetPermissions !== proposal.composer?.permissions) ? /* @__PURE__ */ import_react6.default.createElement("span", { style: { color: "var(--dra-warn)" } }, " ", "\u2192 ", proposal.composer?.mode === "plan" ? "\u8BA1\u5212" : "\u6807\u51C6", " \xB7", " ", proposal.composer?.permissions === "read-only" ? "\u53EA\u8BFB" : proposal.composer?.permissions === "danger-full-access" ? "\u5B8C\u5168\u8BBF\u95EE" : "\u5DE5\u4F5C\u533A") : null) : null, fork && target?.boundaries?.length ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react6.default.createElement(
    "select",
    {
      className: "dra-select dra-grow",
      value: String(proposal.atSeq ?? ""),
      onChange: (event) => onChoose?.(proposal, Number(event.target.value)),
      "aria-label": "\u5206\u53C9\u70B9"
    },
    target.boundaries.map((item) => /* @__PURE__ */ import_react6.default.createElement("option", { key: item.atSeq, value: String(item.atSeq) }, "T", item.turn, " \xB7 ", item.label))
  )) : null, fork && target && target.boundaryCount > (target.boundaries?.length ?? 0) ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u663E\u793A\u6700\u8FD1 ", target.boundaries.length, " \u8F6E\uFF08\u5171 ", target.boundaryCount, " \u8F6E\uFF09\u3002") : null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dra-proposal-actions" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "dra-tag" }, proposal.composer?.mode === "plan" ? "\u8BA1\u5212" : "\u6807\u51C6"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "dra-tag" }, proposal.composer?.permissions === "read-only" ? "\u53EA\u8BFB" : proposal.composer?.permissions === "danger-full-access" ? "\u5B8C\u5168\u8BBF\u95EE" : "\u5DE5\u4F5C\u533A"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "dra-spacer" }), proposal.action === "ask" ? /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, proposal.options?.length ? proposal.options.map((option) => /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-sm",
      type: "button",
      key: option,
      disabled: busy,
      onClick: () => onAnswer?.(proposal, option)
    },
    option
  )) : /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement(
    "input",
    {
      className: "dra-select",
      value: answer,
      placeholder: "\u56DE\u7B54 RA\u2026",
      onChange: (event) => setAnswer(event.target.value),
      onKeyDown: (event) => {
        if (event.key === "Enter" && answer.trim()) onAnswer?.(proposal, answer.trim());
      },
      "aria-label": "\u56DE\u7B54 Router"
    }
  ), /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary dra-btn-sm",
      type: "button",
      disabled: !answer.trim() || busy,
      onClick: () => onAnswer?.(proposal, answer.trim())
    },
    "\u56DE\u7B54"
  ))) : /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement("button", { className: "dra-btn dra-btn-ghost dra-btn-sm", type: "button", disabled: busy, onClick: () => onAbandon?.(proposal) }, "\u53D6\u6D88"), /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary dra-btn-sm",
      type: "button",
      disabled: busy,
      onClick: () => onConfirm?.(proposal)
    },
    busy ? "\u6267\u884C\u4E2D\u2026" : "\u786E\u8BA4\u53D1\u9001"
  ))));
}

// src/client/Modals.jsx
var import_react7 = __toESM(require("react"), 1);
function tokens2(value) {
  if (value === null || value === void 0) return "\u2014";
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}m`;
  if (value >= 1e3) return `${Math.round(value / 1e3)}k`;
  return String(value);
}
function Mask({ children, onClose, label }) {
  return /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-mask", onMouseDown: (event) => event.target === event.currentTarget && onClose?.() }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal", role: "dialog", "aria-modal": "true", "aria-label": label }, children));
}
function Head({ title, onClose }) {
  return /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-head" }, /* @__PURE__ */ import_react7.default.createElement("span", null, title), /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u5173\u95ED", onClick: onClose }, /* @__PURE__ */ import_react7.default.createElement(CloseIcon, { width: 14, height: 14 })));
}
function SettingsModal({ settings, models, onSave, onClose }) {
  const [layout, setLayout] = (0, import_react7.useState)(settings?.layout ?? "vertical");
  const [ra, setRa] = (0, import_react7.useState)(modelValue(settings?.raModel));
  const [fresh, setFresh] = (0, import_react7.useState)(modelValue(settings?.defaultSessionModel));
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const groups = models?.groups ?? [];
  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        layout,
        raModel: parseModel(ra),
        defaultSessionModel: parseModel(fresh)
      });
      onClose?.();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react7.default.createElement(Mask, { onClose, label: "Router \u8BBE\u7F6E" }, /* @__PURE__ */ import_react7.default.createElement(Head, { title: "Router \u8BBE\u7F6E", onClose }), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { htmlFor: "dra-layout" }, "\u8282\u70B9\u6392\u5217\u65B9\u5F0F"), /* @__PURE__ */ import_react7.default.createElement("select", { id: "dra-layout", className: "dra-select", value: layout, onChange: (event) => setLayout(event.target.value) }, /* @__PURE__ */ import_react7.default.createElement("option", { value: "vertical" }, "\u7EB5\u5411 \xB7 \u6839\u4ECE\u5DE6\u5230\u53F3\uFF0C\u5206\u53C9\u5411\u4E0B"), /* @__PURE__ */ import_react7.default.createElement("option", { value: "horizontal" }, "\u6A2A\u5411 \xB7 \u6839\u4ECE\u4E0A\u5230\u4E0B\uFF0C\u5206\u53C9\u5411\u53F3"))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { htmlFor: "dra-ra-model" }, "RA \u6A21\u578B"), /* @__PURE__ */ import_react7.default.createElement("select", { id: "dra-ra-model", className: "dra-select", value: ra, onChange: (event) => setRa(event.target.value) }, /* @__PURE__ */ import_react7.default.createElement("option", { value: "" }, "\u8DDF\u968F\u90E8\u7F72\u9ED8\u8BA4"), groups.map((group) => /* @__PURE__ */ import_react7.default.createElement("optgroup", { key: group.id, label: group.name ?? group.id }, group.models.map((model) => /* @__PURE__ */ import_react7.default.createElement("option", { key: `${group.id}|${model.id}`, value: `${group.id}|${model.id}` }, model.name ?? model.id))))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u5F71\u54CD Router \u4F1A\u8BDD\uFF0C\u4E0D\u6539\u53D8\u6574\u4E2A\u90E8\u7F72\u7684\u9ED8\u8BA4\u6A21\u578B\u3002")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { htmlFor: "dra-new-model" }, "\u65B0\u4F1A\u8BDD\u9ED8\u8BA4\u6A21\u578B"), /* @__PURE__ */ import_react7.default.createElement("select", { id: "dra-new-model", className: "dra-select", value: fresh, onChange: (event) => setFresh(event.target.value) }, /* @__PURE__ */ import_react7.default.createElement("option", { value: "" }, "\u8DDF\u968F\u90E8\u7F72\u9ED8\u8BA4"), groups.map((group) => /* @__PURE__ */ import_react7.default.createElement("optgroup", { key: group.id, label: group.name ?? group.id }, group.models.map((model) => /* @__PURE__ */ import_react7.default.createElement("option", { key: `${group.id}|${model.id}`, value: `${group.id}|${model.id}` }, model.name ?? model.id))))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u7528\u4E8E Router \u65B0\u5EFA\u7684\u4F1A\u8BDD\uFF1B\u5DF2\u6709\u4F1A\u8BDD\u4FDD\u6301\u539F\u6A21\u578B\u3002")), groups.length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-error" }, "\u6CA1\u6709\u53EF\u7528\u7684\u6A21\u578B\u76EE\u5F55\uFF0C\u6A21\u578B\u8BBE\u7F6E\u6682\u65F6\u4E0D\u53EF\u7528\u3002") : null), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose }, "\u53D6\u6D88"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn dra-btn-primary", type: "button", disabled: busy, onClick: save }, busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58")));
}
function HistoryModal({ ra, history, onClose, onRefresh }) {
  const [tab, setTab] = (0, import_react7.useState)("dispatch");
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const refresh = async () => {
    setBusy(true);
    try {
      await onRefresh?.();
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react7.default.createElement(Mask, { onClose, label: "Router \u5386\u53F2" }, /* @__PURE__ */ import_react7.default.createElement(Head, { title: "Router \u5386\u53F2", onClose }), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-row", style: { marginTop: 0 } }, /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: `dra-btn dra-btn-sm ${tab === "dispatch" ? "dra-btn-primary" : ""}`,
      type: "button",
      onClick: () => setTab("dispatch")
    },
    /* @__PURE__ */ import_react7.default.createElement(HistoryIcon, { width: 12, height: 12 }),
    "\u6D3E\u53D1\u8BB0\u5F55"
  ), /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: `dra-btn dra-btn-sm ${tab === "ra" ? "dra-btn-primary" : ""}`,
      type: "button",
      onClick: () => setTab("ra")
    },
    "\u4E0E RA \u7684\u5BF9\u8BDD"
  ), /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", disabled: busy, onClick: refresh }, "\u5237\u65B0")), tab === "ra" ? /* @__PURE__ */ import_react7.default.createElement("div", { style: { marginTop: 10 } }, (ra?.messages ?? []).length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help" }, "\u8FD8\u6CA1\u6709\u4E0E RA \u7684\u5BF9\u8BDD\u3002\u53D1\u9001\u4E00\u4E2A\u4EFB\u52A1\u540E\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002") : (ra.messages ?? []).map((message, index) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-msg", "data-role": message.role, key: `${message.at}-${index}` }, message.text))) : (history ?? []).length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help", style: { marginTop: 10 } }, "\u8FD8\u6CA1\u6709\u6D3E\u53D1\u8BB0\u5F55\u3002") : /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list", style: { marginTop: 10 } }, history.map((row) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-row", key: row.id }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-grow" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-title" }, row.task), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-sub" }, actionLabel(row.action), " \xB7 ", row.targetTitle ?? row.targetSessionId ?? "\u65B0\u4F1A\u8BDD", " \xB7", " ", resultLabel(row.result), " \xB7 ", new Date(row.at).toLocaleString("zh-CN", { hour12: false })), row.reason ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-sub" }, "\u7406\u7531\uFF1A", row.reason) : null), row.mode === "auto" ? /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-badge", "data-tone": "warn" }, "\u81EA\u52A8") : null)))));
}
function UntrackedModal({ items, onRestore, onClose }) {
  const [busyId, setBusyId] = (0, import_react7.useState)(null);
  const restore = async (id) => {
    setBusyId(id);
    try {
      await onRestore?.(id);
    } finally {
      setBusyId(null);
    }
  };
  return /* @__PURE__ */ import_react7.default.createElement(Mask, { onClose, label: "\u672A\u8DDF\u8E2A\u4F1A\u8BDD" }, /* @__PURE__ */ import_react7.default.createElement(Head, { title: "\u672A\u8DDF\u8E2A\u4F1A\u8BDD", onClose }), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help", style: { marginBottom: 10 } }, "\u9ED8\u8BA4\u53EA\u8DDF\u8E2A\u6700\u8FD1\u4E00\u5468\u7684\u4F1A\u8BDD\u3002\u505C\u6B62\u8DDF\u8E2A\u7684\u4F1A\u8BDD\u4E5F\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\uFF1B\u6062\u590D\u540E\u91CD\u65B0\u8FDB\u5165 RA \u7684\u4E0A\u4E0B\u6587\u3002"), items.length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help" }, "\u6CA1\u6709\u672A\u8DDF\u8E2A\u7684\u4F1A\u8BDD\u3002") : /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list" }, items.map((item) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-row", key: item.sessionId }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-grow" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-title" }, item.title), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-sub" }, item.reason === "stopped" ? "\u624B\u52A8\u505C\u6B62\u8DDF\u8E2A" : "\u4E00\u5468\u524D", " \xB7 \u6700\u540E\u6D3B\u8DC3 ", item.lastActiveLabel)), /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-sm",
      type: "button",
      disabled: busyId === item.sessionId,
      onClick: () => restore(item.sessionId)
    },
    busyId === item.sessionId ? "\u6062\u590D\u4E2D\u2026" : "\u6062\u590D"
  ))))));
}
function CompressModal({ session, onConfirm, onClose }) {
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const percent = session.context?.percent;
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(session);
      onClose?.();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react7.default.createElement(Mask, { onClose, label: "\u538B\u7F29\u4E0A\u4E0B\u6587" }, /* @__PURE__ */ import_react7.default.createElement(Head, { title: "\u538B\u7F29\u4E0A\u4E0B\u6587", onClose }), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-title" }, session.title), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help", style: { marginTop: 6 } }, "\u5F53\u524D ", tokens2(session.context?.usedTokens), " / ", tokens2(session.context?.limitTokens), percent === null || percent === void 0 ? "" : `\uFF08${percent}%\uFF09`, "\u3002\u538B\u7F29\u4F1A\u8C03\u7528 DSH \u7684\u539F\u751F /compact\uFF0C \u53EA\u5F71\u54CD\u8BE5\u4F1A\u8BDD\u7684\u4E0A\u4E0B\u6587\uFF0C\u4E0D\u6539\u5199\u5386\u53F2\u4E8B\u4EF6\u3002")), session.running ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-error" }, "\u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C\uFF1B\u538B\u7F29\u9700\u8981\u7A7A\u95F2\u7684 Agent\u3002\u7B49\u672C\u8F6E\u7ED3\u675F\u540E\u518D\u8BD5\u3002") : null), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose }, "\u53D6\u6D88"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn dra-btn-primary", type: "button", disabled: busy || session.running, onClick: confirm }, busy ? "\u538B\u7F29\u4E2D\u2026" : "\u786E\u8BA4\u538B\u7F29")));
}
function StopModal({ session, onConfirm, onClose }) {
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(session);
      onClose?.();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react7.default.createElement(Mask, { onClose, label: "\u505C\u6B62\u8DDF\u8E2A\u4F1A\u8BDD" }, /* @__PURE__ */ import_react7.default.createElement(Head, { title: "\u505C\u6B62\u8DDF\u8E2A\u4F1A\u8BDD", onClose }), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-list-title" }, session.title), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help", style: { marginTop: 8 } }, "\u505C\u6B62\u8DDF\u8E2A\u540E\uFF0C\u5B83\u4F1A\u4ECE RA \u7684\u4E0A\u4E0B\u6587\u548C\u753B\u5E03\u4E2D\u79FB\u9664\uFF0C\u4F46\u4F1A\u8BDD\u672C\u8EAB\u4E0D\u4F1A\u88AB\u5220\u9664\u3002 \u5982\u679C\u5B83\u662F\u7236\u4F1A\u8BDD\uFF0C\u8DDF\u8E2A\u4E2D\u7684\u5B50\u4F1A\u8BDD\u4F1A\u79FB\u5230\u9876\u5C42\u7EE7\u7EED\u8DDF\u8E2A\uFF1B\u6062\u590D\u7236\u4F1A\u8BDD\u540E\u4F1A\u81EA\u52A8\u56DE\u6302\u3002 \u4E4B\u540E\u53EF\u4EE5\u5728\u201C\u672A\u8DDF\u8E2A\u4F1A\u8BDD\u201D\u91CC\u6062\u590D\u3002")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose }, "\u53D6\u6D88"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn dra-btn-danger", type: "button", disabled: busy, onClick: confirm }, busy ? "\u5904\u7406\u4E2D\u2026" : "\u505C\u6B62\u8DDF\u8E2A")));
}
function OnboardingOverlay({ onboarding, currentTitle, onRetry }) {
  if (!onboarding || onboarding.total === 0 || onboarding.status === "complete") return null;
  const percent = onboarding.total ? Math.round(onboarding.done / onboarding.total * 100) : 0;
  return /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-mask", style: { background: "color-mix(in srgb, #000 26%, transparent)" } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal", style: { width: "min(420px, 100%)" } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-head" }, /* @__PURE__ */ import_react7.default.createElement("span", null, "\u9996\u6B21\u63A5\u5165\uFF1A\u5EFA\u7ACB\u4F1A\u8BDD\u7D22\u5F15"), /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), onboarding.status === "running" ? /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spin" }) : null), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u7D22\u5F15\u6700\u8FD1 7 \u5929\u6709\u6D3B\u52A8\u7684\u4F1A\u8BDD\u3002\u5B8C\u6210\u540E\u624D\u80FD\u5F00\u59CB\u8DEF\u7531\uFF1B\u4E2D\u65AD\u540E\u53EF\u4EE5\u7EE7\u7EED\u3002"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-progress", style: { marginTop: 12 } }, /* @__PURE__ */ import_react7.default.createElement("i", { style: { width: `${percent}%` } })), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-detail-meta" }, onboarding.done, " / ", onboarding.total, currentTitle ? ` \xB7 ${currentTitle}` : ""), /* @__PURE__ */ import_react7.default.createElement("span", { className: "dra-spacer" }), onboarding.failed?.length ? /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", onClick: onRetry }, "\u91CD\u8BD5\u5931\u8D25\u9879") : null), onboarding.failed?.length ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-field-help", style: { color: "var(--dra-error)", marginTop: 8 } }, onboarding.failed.length, " \u4E2A\u4F1A\u8BDD\u7D22\u5F15\u5931\u8D25\uFF1B\u8DEF\u7531\u4ECD\u53EF\u7528\uFF0C\u8BE6\u60C5\u4F1A\u9000\u56DE\u62BD\u53D6\u5F0F\u7D22\u5F15\u3002") : null)));
}
function Toast({ message }) {
  if (!message) return null;
  return /* @__PURE__ */ import_react7.default.createElement(
    "div",
    {
      className: "dra-proposal",
      style: {
        position: "absolute",
        zIndex: 30,
        left: "50%",
        top: 62,
        transform: "translateX(-50%)",
        width: "min(520px, calc(100% - 24px))"
      },
      role: "status"
    },
    /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-proposal-head" }, message)
  );
}
function modelValue(value) {
  return value?.provider && value?.model ? `${value.provider}|${value.model}` : "";
}
function parseModel(value) {
  if (!value) return null;
  const [provider, model] = value.split("|");
  return provider && model ? { provider, model } : null;
}
function actionLabel(action) {
  return { route: "\u7EE7\u7EED", fork: "\u5206\u53C9", new: "\u65B0\u5EFA", ask: "\u8FFD\u95EE" }[action] ?? action;
}
function resultLabel(result) {
  return {
    sent: "\u5DF2\u53D1\u9001",
    created: "\u5DF2\u65B0\u5EFA",
    forked: "\u5DF2\u5206\u53C9",
    auto: "\u81EA\u52A8\u6267\u884C",
    abandoned: "\u672A\u6267\u884C",
    failed: "\u5931\u8D25",
    asked: "\u5DF2\u8FFD\u95EE"
  }[result] ?? result;
}

// src/client/RouterPanel.jsx
var POLL_MS = 2200;
function RouterPanel({ openSession }) {
  const [data, setData] = (0, import_react8.useState)(null);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)(null);
  const [project, setProject] = (0, import_react8.useState)(null);
  const [search, setSearch] = (0, import_react8.useState)("");
  const [task, setTask] = (0, import_react8.useState)("");
  const [mode, setMode] = (0, import_react8.useState)("standard");
  const [permissions, setPermissions] = (0, import_react8.useState)("workspace-write");
  const [auto, setAuto] = (0, import_react8.useState)(false);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [selectedId, setSelectedId] = (0, import_react8.useState)(null);
  const [modal, setModal] = (0, import_react8.useState)(null);
  const [toast, setToast] = (0, import_react8.useState)(null);
  const [view, setView] = (0, import_react8.useState)({ x: 0, y: 0, z: 1 });
  const [viewport, setViewport] = (0, import_react8.useState)({ width: 900, height: 700 });
  const [newIds, setNewIds] = (0, import_react8.useState)(() => /* @__PURE__ */ new Set());
  const viewportRef = (0, import_react8.useRef)(viewport);
  viewportRef.current = viewport;
  const dataRef = (0, import_react8.useRef)(data);
  dataRef.current = data;
  const historySeen = (0, import_react8.useRef)(/* @__PURE__ */ new Set());
  const composerProject = (0, import_react8.useRef)(null);
  const fitKey = (0, import_react8.useRef)("");
  const lastFit = (0, import_react8.useRef)(null);
  const timerRef = (0, import_react8.useRef)(0);
  const refresh = (0, import_react8.useCallback)(
    async (silent = false) => {
      try {
        const next = await apiState(project);
        setData(next);
        setError(null);
        if (next.selectedProject && next.selectedProject.project !== project) {
          setProject(next.selectedProject.project);
        }
        return next;
      } catch (reason) {
        if (!silent) setError(reason);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [project]
  );
  (0, import_react8.useEffect)(() => {
    refresh(false);
  }, [refresh]);
  (0, import_react8.useEffect)(() => {
    timerRef.current = window.setInterval(() => refresh(true), POLL_MS);
    return () => window.clearInterval(timerRef.current);
  }, [refresh]);
  (0, import_react8.useEffect)(() => {
    if (!toast) return void 0;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  (0, import_react8.useEffect)(() => {
    const composer = data?.settings?.composer;
    const key = data?.selectedProject?.project;
    if (!composer || !key || composerProject.current === key) return;
    composerProject.current = key;
    setMode(composer.mode);
    setPermissions(composer.permissions);
    setAuto(!!composer.auto);
  }, [data?.settings?.composer, data?.selectedProject?.project]);
  const tree = data?.tree ?? { sessions: [], edges: [], roots: [], trackedCount: 0 };
  const layoutMode = data?.settings?.layout === "horizontal" ? "horizontal" : "vertical";
  const layout = (0, import_react8.useMemo)(() => buildLayout(tree.sessions, layoutMode), [tree.sessions, layoutMode]);
  const selected = (0, import_react8.useMemo)(
    () => tree.sessions.find((row) => row.sessionId === selectedId) ?? null,
    [tree.sessions, selectedId]
  );
  const pendingList = data?.pending ?? [];
  const pending = pendingList[0] ?? null;
  const pendingIds = (0, import_react8.useMemo)(
    () => new Set(pendingList.map((item) => item.targetSessionId).filter(Boolean)),
    [pendingList]
  );
  const layoutRef = (0, import_react8.useRef)(layout);
  layoutRef.current = layout;
  const pendingRef = (0, import_react8.useRef)(pending);
  pendingRef.current = pending;
  const onboarding = data?.onboarding;
  const onboardingRunning = onboarding?.status === "running";
  const raRunning = !!data?.ra?.running;
  const disabled = onboardingRunning || raRunning || !data?.selectedProject;
  const disabledReason = onboardingRunning ? `\u9996\u6B21\u63A5\u5165\u7D22\u5F15\u8FDB\u884C\u4E2D\uFF08${onboarding.done}/${onboarding.total}\uFF09\uFF0C\u5B8C\u6210\u540E\u624D\u80FD\u8DEF\u7531\u3002` : raRunning ? "Router \u6B63\u5728\u5224\u65AD\u4E0A\u4E00\u4E2A\u4EFB\u52A1\uFF1B\u5B8C\u6210\u540E\u53EF\u4EE5\u7EE7\u7EED\u53D1\u9001\u3002" : !data?.selectedProject ? "\u8FD8\u6CA1\u6709\u53EF\u8DEF\u7531\u7684\u9879\u76EE\u4F1A\u8BDD\u3002" : "";
  (0, import_react8.useEffect)(() => {
    if (!data?.selectedProject || layout.nodes.length === 0) return;
    const key = `${data.selectedProject.project}|${layoutMode}`;
    if (fitKey.current === key) return;
    fitKey.current = key;
    const fitted = fitSelection(layout, viewportRef.current, layoutMode, { bottomReserve: pending ? 390 : 230 });
    lastFit.current = fitted;
    setView(fitted);
  }, [data?.selectedProject, layoutMode, layout.nodes.length, pending]);
  const handleViewport = (0, import_react8.useCallback)(
    (next) => {
      setViewport(next);
      setView((current) => {
        const fitted = lastFit.current;
        if (fitted && Math.abs(current.x - fitted.x) < 1 && Math.abs(current.y - fitted.y) < 1 && Math.abs(current.z - fitted.z) < 1e-3) {
          const replacement = fitSelection(layoutRef.current, next, layoutMode, {
            bottomReserve: pendingRef.current ? 390 : 230
          });
          lastFit.current = replacement;
          return replacement;
        }
        return current;
      });
    },
    [layoutMode]
  );
  (0, import_react8.useEffect)(() => {
    const rows = data?.history ?? [];
    if (historySeen.current.size === 0) {
      for (const row of rows) historySeen.current.add(row.id);
      return;
    }
    for (const row of rows) {
      if (historySeen.current.has(row.id)) continue;
      historySeen.current.add(row.id);
      if (row.mode === "auto") setToast(`\u81EA\u52A8\u6267\u884C\uFF1A${row.targetTitle ?? row.targetSessionId ?? "\u65B0\u4F1A\u8BDD"} \xB7 \u5DF2\u53D1\u9001`);
    }
  }, [data?.history]);
  const run = async (work, successMessage) => {
    setBusy(true);
    setError(null);
    try {
      const result = await work();
      if (successMessage) setToast(successMessage);
      await refresh(true);
      return result;
    } catch (reason) {
      setError(reason);
      setToast(reason.message);
      await refresh(true);
      throw reason;
    } finally {
      setBusy(false);
    }
  };
  const send = async () => {
    const text = task.trim();
    if (!text || disabled) return;
    try {
      await run(
        () => apiOp("ask", { project: data.selectedProject.project, task: text, composer: { mode, permissions, auto } }),
        auto ? "\u5DF2\u4EA4\u7ED9 Router\uFF1B\u81EA\u52A8\u6267\u884C\u5F00\u542F\uFF0C\u5224\u65AD\u540E\u76F4\u63A5\u53D1\u9001\u3002" : "\u5DF2\u4EA4\u7ED9 Router\uFF0C\u6B63\u5728\u5206\u6790\u3002"
      );
      setTask("");
    } catch {
    }
  };
  const confirm = async (proposal) => {
    await run(async () => {
      const response = await apiOp("confirm", {
        project: data.selectedProject.project,
        token: proposal.token
      });
      const result = response.result;
      const id = result?.sessionId ?? result?.targetSessionId;
      if (id) {
        setNewIds((current) => new Set(current).add(id));
        window.setTimeout(() => {
          setNewIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }, 2400);
        if (result.result === "forked" || result.result === "created") setSelectedId(id);
      }
      return response;
    }, "\u5DF2\u786E\u8BA4\u5E76\u53D1\u9001\u3002").catch(() => {
    });
  };
  const choose = async (proposal, atSeq) => {
    await run(
      () => apiOp("choose", { project: data.selectedProject.project, token: proposal.token, atSeq }),
      "\u5206\u53C9\u70B9\u5DF2\u66F4\u65B0\u3002"
    ).catch(() => {
    });
  };
  const abandon = async (proposal) => {
    await run(
      () => apiOp("abandon", { project: data.selectedProject.project, token: proposal.token }),
      "\u63D0\u8BAE\u5DF2\u53D6\u6D88\u3002"
    ).catch(() => {
    });
  };
  const answer = async (proposal, value) => {
    await run(
      () => apiOp("answer", { project: data.selectedProject.project, token: proposal.token, answer: value }),
      "\u5DF2\u56DE\u7B54 Router\u3002"
    ).catch(() => {
    });
  };
  const compress = async (session) => {
    await run(
      () => apiOp("compress", { project: data.selectedProject.project, sessionId: session.sessionId }),
      "\u4E0A\u4E0B\u6587\u538B\u7F29\u5B8C\u6210\u3002"
    );
  };
  const stop = async (session) => {
    await run(
      () => apiOp("stop", { project: data.selectedProject.project, sessionId: session.sessionId }),
      "\u5DF2\u505C\u6B62\u8DDF\u8E2A\uFF1B\u53EF\u5728\u201C\u672A\u8DDF\u8E2A\u4F1A\u8BDD\u201D\u4E2D\u6062\u590D\u3002"
    ).catch(() => {
    });
    if (selectedId === session.sessionId) setSelectedId(null);
  };
  const restore = async (sessionId) => {
    await run(
      () => apiOp("restore", { project: data.selectedProject.project, sessionId }),
      "\u5DF2\u6062\u590D\u8DDF\u8E2A\u3002"
    ).catch(() => {
    });
  };
  const rename = async (sessionId, title) => {
    await run(
      () => apiOp("rename", { project: data.selectedProject.project, sessionId, title }),
      "\u540D\u79F0\u5DF2\u66F4\u65B0\u3002"
    ).catch(() => {
    });
  };
  const saveSettings = async (settings) => {
    const result = await run(
      () => apiOp("settings", { project: data.selectedProject.project, settings }),
      "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002"
    );
    fitKey.current = "";
    return result;
  };
  const fitAll = () => {
    if (!layout.nodes.length) return;
    const bounds = boundsOf(layout.nodes, layout.nodeW, layout.nodeH);
    const width = viewport.width;
    const height = viewport.height;
    const z = clamp(
      Math.min((width - 60) / Math.max(1, bounds.width), (height - (pending ? 390 : 230)) / Math.max(1, bounds.height)),
      0.25,
      1.4
    );
    const fitted = {
      x: (width - bounds.width * z) / 2 - bounds.minX * z,
      y: (height - bounds.height * z) / 2 - bounds.minY * z - 30,
      z
    };
    lastFit.current = fitted;
    setView(fitted);
  };
  const latest = () => {
    if (!layout.nodes.length) return;
    const node = [...layout.nodes].sort((a, b) => Number(b.lastActiveAt || 0) - Number(a.lastActiveAt || 0))[0];
    lastFit.current = null;
    setView(centerOn(node, viewportRef.current, Math.max(0.75, view.z), layout.nodeW, layout.nodeH));
  };
  const onSearchKey = (event) => {
    if (event.key !== "Enter") return;
    const query = search.trim().toLowerCase();
    if (!query) return;
    const hit = tree.sessions.find((row) => String(row.title).toLowerCase().includes(query));
    if (!hit) return;
    setSelectedId(hit.sessionId);
    const node = layout.nodes.find((row) => row.sessionId === hit.sessionId);
    if (node) setView(centerOn(node, viewportRef.current, Math.max(0.8, view.z), layout.nodeW, layout.nodeH));
  };
  const currentTitle = onboarding?.current ? tree.sessions.find((row) => row.sessionId === onboarding.current)?.title : null;
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra" }, /* @__PURE__ */ import_react8.default.createElement("header", { className: "dra-header" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-brand" }, /* @__PURE__ */ import_react8.default.createElement(RouterIcon, null), /* @__PURE__ */ import_react8.default.createElement("span", null, "Router")), /* @__PURE__ */ import_react8.default.createElement("label", { className: "dra-project", title: data?.selectedProject?.project ?? "\u9009\u62E9\u4E00\u4E2A\u9879\u76EE" }, /* @__PURE__ */ import_react8.default.createElement(
    "select",
    {
      value: data?.selectedProject?.project ?? "",
      onChange: (event) => {
        setProject(event.target.value);
        setSelectedId(null);
        fitKey.current = "";
      },
      "aria-label": "\u9879\u76EE"
    },
    (data?.projects ?? []).length === 0 ? /* @__PURE__ */ import_react8.default.createElement("option", { value: "" }, "\u65E0\u9879\u76EE") : null,
    (data?.projects ?? []).map((row) => /* @__PURE__ */ import_react8.default.createElement("option", { key: row.project, value: row.project }, row.name, " \xB7 ", row.sessions))
  ), /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-caret" }, "\u25BE")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-search" }, /* @__PURE__ */ import_react8.default.createElement(SearchIcon, { width: 14, height: 14 }), /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      value: search,
      onChange: (event) => setSearch(event.target.value),
      onKeyDown: onSearchKey,
      placeholder: "\u641C\u7D22\u4F1A\u8BDD",
      "aria-label": "\u641C\u7D22\u4F1A\u8BDD"
    }
  )), /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-head-actions" }, /* @__PURE__ */ import_react8.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u4E0E RA \u7684\u5BF9\u8BDD\u5386\u53F2", onClick: () => setModal("history") }, /* @__PURE__ */ import_react8.default.createElement(HistoryIcon, null)), /* @__PURE__ */ import_react8.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "Router \u8BBE\u7F6E", onClick: () => setModal("settings") }, /* @__PURE__ */ import_react8.default.createElement(SettingsIcon, null)), /* @__PURE__ */ import_react8.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u672A\u8DDF\u8E2A\u4F1A\u8BDD", onClick: () => setModal("untracked") }, /* @__PURE__ */ import_react8.default.createElement(MoreIcon, null)))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-body" }, error ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-error", role: "alert" }, /* @__PURE__ */ import_react8.default.createElement("span", null, error.message), /* @__PURE__ */ import_react8.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", onClick: () => refresh(false) }, "\u91CD\u8BD5")) : null, layout.nodes.length > 0 ? /* @__PURE__ */ import_react8.default.createElement(
    Canvas,
    {
      layout,
      view,
      setView,
      selectedId,
      pendingIds,
      newIds,
      search,
      onSelect: setSelectedId,
      onOpen: (id) => openSession?.(id),
      onCompress: (session) => setModal({ type: "compress", session }),
      canCompress: data?.probe?.compact !== false,
      onViewportChange: handleViewport,
      onFit: fitAll,
      onLatest: latest
    }
  ) : /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-empty" }, /* @__PURE__ */ import_react8.default.createElement("h3", null, loading ? "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" : data?.selectedProject ? "\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u53EF\u8DDF\u8E2A\u7684\u4F1A\u8BDD" : "\u8FD8\u6CA1\u6709\u9879\u76EE"), /* @__PURE__ */ import_react8.default.createElement("p", null, data?.selectedProject ? "\u9ED8\u8BA4\u53EA\u8DDF\u8E2A\u6700\u8FD1 7 \u5929\u6709\u6D3B\u52A8\u7684\u4F1A\u8BDD\u3002\u53EF\u4EE5\u53BB\u201C\u672A\u8DDF\u8E2A\u4F1A\u8BDD\u201D\u6062\u590D\u66F4\u65E9\u7684\u4F1A\u8BDD\uFF0C\u6216\u5148\u5728 DSH \u4E2D\u7EE7\u7EED\u4E00\u4E2A\u4F1A\u8BDD\u3002" : "\u5148\u5728 DSH \u4E2D\u6253\u5F00\u4E00\u4E2A\u9879\u76EE\u5E76\u521B\u5EFA\u4F1A\u8BDD\u3002")), selected ? /* @__PURE__ */ import_react8.default.createElement(
    Detail,
    {
      session: selected,
      pendingFork: pendingList.find(
        (item) => item.action === "fork" && item.targetSessionId === selected.sessionId
      ) ?? null,
      onOpen: (id) => openSession?.(id),
      onCompress: (session) => setModal({ type: "compress", session }),
      onStop: (session) => setModal({ type: "stop", session }),
      onRename: rename,
      onSelectAtSeq: (sessionId, atSeq) => {
        const proposal = pendingList.find(
          (item) => item.action === "fork" && item.targetSessionId === sessionId
        );
        if (proposal) choose(proposal, atSeq);
      },
      onClose: () => setSelectedId(null),
      canCompress: data?.probe?.compact !== false
    }
  ) : null, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-composer-wrap" }, pendingList.length > 0 ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposals" }, pendingList.map((proposal) => {
    const target = proposal.targetSessionId ? tree.sessions.find((row) => row.sessionId === proposal.targetSessionId) ?? null : null;
    return /* @__PURE__ */ import_react8.default.createElement(
      ProposalCard,
      {
        key: proposal.token,
        proposal,
        target,
        busy,
        onConfirm: confirm,
        onChoose: choose,
        onAbandon: abandon,
        onAnswer: answer
      }
    );
  })) : data?.ra?.running ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-head" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-spin" }), /* @__PURE__ */ import_react8.default.createElement("span", null, "Router \u6B63\u5728\u67E5\u770B\u4F1A\u8BDD\u5E76\u5224\u65AD\u2026"))) : null, /* @__PURE__ */ import_react8.default.createElement(
    Composer,
    {
      task,
      setTask,
      mode,
      setMode,
      permissions,
      setPermissions,
      auto,
      setAuto,
      busy,
      disabled,
      disabledReason,
      onSend: send,
      planAvailable: data?.probe?.planMode !== false,
      permissionAvailable: data?.probe?.permissionPresets !== false
    }
  )), /* @__PURE__ */ import_react8.default.createElement(
    OnboardingOverlay,
    {
      onboarding,
      currentTitle,
      onRetry: () => run(() => apiOp("onboarding", { project: data.selectedProject.project }), "\u6B63\u5728\u91CD\u8BD5\u7D22\u5F15\u2026").catch(() => {
      })
    }
  ), /* @__PURE__ */ import_react8.default.createElement(Toast, { message: toast })), modal === "settings" ? /* @__PURE__ */ import_react8.default.createElement(
    SettingsModal,
    {
      settings: data?.settings,
      models: data?.models,
      onSave: saveSettings,
      onClose: () => setModal(null)
    }
  ) : null, modal === "history" ? /* @__PURE__ */ import_react8.default.createElement(
    HistoryModal,
    {
      ra: data?.ra,
      history: data?.history,
      onRefresh: () => refresh(false),
      onClose: () => setModal(null)
    }
  ) : null, modal === "untracked" ? /* @__PURE__ */ import_react8.default.createElement(
    UntrackedModal,
    {
      items: data?.untracked ?? [],
      onRestore: async (id) => {
        await restore(id);
        setModal(null);
      },
      onClose: () => setModal(null)
    }
  ) : null, modal?.type === "compress" ? /* @__PURE__ */ import_react8.default.createElement(
    CompressModal,
    {
      session: modal.session,
      onConfirm: compress,
      onClose: () => setModal(null)
    }
  ) : null, modal?.type === "stop" ? /* @__PURE__ */ import_react8.default.createElement(
    StopModal,
    {
      session: modal.session,
      onConfirm: stop,
      onClose: () => setModal(null)
    }
  ) : null);
}

// src/client/css.js
var CSS = `
.dra {
  --dra-bg: var(--dsw-alias-bg-module-platform, #f5f6f7);
  --dra-layer: var(--dsw-alias-bg-layer-2, #ffffff);
  --dra-layer-3: var(--dsw-alias-bg-layer-1, #ffffff);
  --dra-border: var(--dsw-alias-border-l2, rgba(15,17,21,.10));
  --dra-border-strong: var(--dsw-alias-border-l3, rgba(15,17,21,.16));
  --dra-text: var(--dsw-alias-label-primary, #0f1115);
  --dra-text-2: var(--dsw-alias-label-secondary, #61666b);
  --dra-text-3: var(--dsw-alias-label-tertiary, #81858c);
  --dra-accent: var(--dsw-alias-state-business-primary, #4176e6);
  --dra-accent-soft: color-mix(in srgb, var(--dra-accent) 16%, transparent);
  --dra-warn: var(--dsw-alias-state-warn-primary, #f59e0b);
  --dra-error: var(--dsw-alias-state-error-primary, #ec1313);
  --dra-ok: var(--dsw-alias-state-success-primary, #22c55e);
  --dra-shadow: 0 12px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--dra-text);
  background: var(--dra-bg);
  font-family: var(--dsw-font-family, ui-sans-serif, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  container-type: inline-size;
  color-scheme: inherit;
  --dra-node-w: 248px;
  --dra-node-h: 88px;
}

.dra *, .dra *::before, .dra *::after { box-sizing: border-box; }
.dra button, .dra input, .dra textarea, .dra select { font: inherit; }
.dra button { cursor: pointer; }
.dra button:disabled { cursor: not-allowed; opacity: .45; }

.dra-header {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  min-height: 50px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--dra-border);
  background: color-mix(in srgb, var(--dra-bg) 88%, transparent);
  backdrop-filter: blur(10px);
}
.dra-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 650;
  font-size: 14px;
  letter-spacing: .1px;
  white-space: nowrap;
}
.dra-brand svg { color: var(--dra-accent); }
.dra-project {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 300px;
  flex: 0 0 auto;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dra-border);
  border-radius: 9px;
  background: var(--dra-layer);
  color: var(--dra-text-2);
  font-size: 12.5px;
}
.dra-project select {
  min-width: 0;
  max-width: 250px;
  border: 0;
  outline: 0;
  appearance: none;
  background: transparent;
  color: var(--dra-text);
  font-size: 12.5px;
  font-weight: 550;
}
.dra-project .dra-caret { color: var(--dra-text-3); font-size: 10px; }
.dra-search {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1 1 auto;
  max-width: 360px;
  min-width: 120px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--dra-border);
  border-radius: 9px;
  background: var(--dra-layer);
  color: var(--dra-text-3);
  transition: border-color .15s, box-shadow .15s;
}
.dra-search:focus-within {
  border-color: color-mix(in srgb, var(--dra-accent) 55%, var(--dra-border));
  box-shadow: 0 0 0 3px var(--dra-accent-soft);
}
.dra-search input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--dra-text);
  font-size: 12.5px;
}
.dra-search input::placeholder { color: var(--dra-text-3); }
.dra-head-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}
.dra-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--dra-text-2);
}
.dra-icon-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.07)); color: var(--dra-text); }
.dra-icon-btn[data-active="true"] { color: var(--dra-accent); background: var(--dra-accent-soft); }

.dra-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
.dra-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  cursor: grab;
  background-color: var(--dra-bg);
  background-image: radial-gradient(circle at center, color-mix(in srgb, var(--dra-text-3) 20%, transparent) 0.8px, transparent 0.9px);
  background-size: 22px 22px;
  touch-action: none;
}
.dra-canvas[data-panning="true"] { cursor: grabbing; }
.dra-world {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  will-change: transform;
}
.dra-edges {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;
}
.dra-edge {
  fill: none;
  stroke: color-mix(in srgb, var(--dra-accent) 62%, var(--dra-border-strong));
  stroke-width: 1.6;
  opacity: .78;
}
.dra-edge.dim { opacity: .18; }

.dra-node {
  position: absolute;
  width: var(--dra-node-w);
  min-height: var(--dra-node-h);
  padding: 11px 12px 10px;
  border: 1px solid var(--dra-border);
  border-radius: 12px;
  background: var(--dra-layer);
  box-shadow: 0 1px 0 rgba(255,255,255,.03) inset, 0 8px 22px rgba(0,0,0,.12);
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s, opacity .18s, transform .18s;
  user-select: none;
}
.dra-node:hover {
  border-color: var(--dra-border-strong);
  box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 12px 28px rgba(0,0,0,.18);
}
.dra-node[data-selected="true"] {
  border-color: color-mix(in srgb, var(--dra-accent) 70%, var(--dra-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--dra-accent) 45%, transparent), 0 12px 30px rgba(0,0,0,.18);
}
.dra-node[data-pending="true"] {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--dra-warn) 75%, var(--dra-border));
}
.dra-node[data-running="true"] {
  animation: dra-breathe 2.4s ease-in-out infinite;
}
.dra-node[data-new="true"] { animation: dra-flash 1.2s ease-out 2; }
.dra-node[data-dim="true"] { opacity: .32; }
.dra-node[data-stopped="true"] { opacity: .68; }
@keyframes dra-breathe {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dra-accent) 0%, transparent), 0 8px 22px rgba(0,0,0,.12); }
  50% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--dra-accent) 20%, transparent), 0 8px 26px rgba(0,0,0,.16); }
}
@keyframes dra-flash {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dra-ok) 55%, transparent); }
  70% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--dra-ok) 0%, transparent); }
  100% { box-shadow: 0 8px 22px rgba(0,0,0,.12); }
}
.dra-node-top { display: flex; align-items: flex-start; gap: 8px; }
.dra-node-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: .1px;
}
.dra-node-dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--dra-ok);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dra-ok) 14%, transparent);
}
.dra-node[data-running="true"] .dra-node-dot { background: var(--dra-accent); box-shadow: 0 0 0 3px var(--dra-accent-soft); }
.dra-node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  color: var(--dra-text-3);
  font-size: 11.5px;
  white-space: nowrap;
}
.dra-node-meta .dra-spacer { flex: 1 1 auto; }
.dra-ctx {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dra-ctx-bar {
  position: relative;
  width: 42px;
  height: 2px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--dra-text-3) 24%, transparent);
  overflow: hidden;
}
.dra-ctx-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 2px;
  background: var(--dra-ok);
}
.dra-ctx[data-level="warn"] .dra-ctx-bar > i { background: var(--dra-warn); }
.dra-ctx[data-level="high"] .dra-ctx-bar > i { background: var(--dra-error); }
.dra-ctx-text { font-size: 11px; color: var(--dra-text-2); font-variant-numeric: tabular-nums; }
.dra-compress {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin: -3px -4px -3px 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dra-text-3);
}
.dra-compress:hover { background: var(--dra-layer-3); color: var(--dra-text); }

.dra-detail {
  position: absolute;
  z-index: 4;
  top: 12px;
  right: 12px;
  width: 302px;
  max-height: calc(100% - 24px);
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--dra-border-strong);
  border-radius: 14px;
  background: color-mix(in srgb, var(--dra-layer) 94%, var(--dra-bg));
  box-shadow: var(--dra-shadow);
  backdrop-filter: blur(12px);
}
.dra-detail-head { display: flex; align-items: flex-start; gap: 8px; }
.dra-detail-title { flex: 1 1 auto; font-size: 14px; font-weight: 650; line-height: 1.35; }
.dra-detail-meta { margin-top: 5px; color: var(--dra-text-3); font-size: 11.5px; }
.dra-detail-section { margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--dra-border); }
.dra-detail-label { color: var(--dra-text-3); font-size: 11px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; }
.dra-detail-row { display: flex; align-items: center; gap: 8px; margin-top: 7px; }
.dra-detail-row .dra-grow { flex: 1 1 auto; min-width: 0; }
.dra-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--dra-border);
  border-radius: 8px;
  background: var(--dra-layer-3);
  color: var(--dra-text);
  font-size: 12px;
  font-weight: 550;
  white-space: nowrap;
}
.dra-btn:hover { border-color: var(--dra-border-strong); }
.dra-btn-primary {
  border-color: color-mix(in srgb, var(--dra-accent) 70%, var(--dra-border));
  background: var(--dra-accent);
  color: var(--dsw-alias-label-primary-foreground, #fff);
}
.dra-btn-primary:hover { filter: brightness(1.06); }
.dra-btn-danger { color: var(--dra-error); border-color: color-mix(in srgb, var(--dra-error) 40%, var(--dra-border)); background: transparent; }
.dra-btn-ghost { border-color: transparent; background: transparent; color: var(--dra-text-2); }
.dra-btn-ghost:hover { background: var(--dra-layer-3); color: var(--dra-text); }
.dra-btn-sm { height: 26px; padding: 0 9px; font-size: 11.5px; border-radius: 7px; }

.dra-select {
  height: 30px;
  min-width: 0;
  padding: 0 26px 0 9px;
  border: 1px solid var(--dra-border);
  border-radius: 8px;
  background: var(--dra-layer-3);
  color: var(--dra-text);
  font-size: 12px;
  outline: 0;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--dra-text-3) 50%), linear-gradient(135deg, var(--dra-text-3) 50%, transparent 50%);
  background-position: calc(100% - 13px) 13px, calc(100% - 9px) 13px;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
}
.dra-select:focus { border-color: color-mix(in srgb, var(--dra-accent) 55%, var(--dra-border)); }

.dra-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  text-align: center;
  color: var(--dra-text-2);
}
.dra-empty h3 { margin: 0; font-size: 15px; font-weight: 650; color: var(--dra-text); }
.dra-empty p { margin: 0; max-width: 380px; font-size: 12.5px; line-height: 1.6; color: var(--dra-text-3); }
.dra-probe {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  max-width: 520px;
}
.dra-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--dra-border);
  border-radius: 999px;
  background: var(--dra-layer);
  color: var(--dra-text-3);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
}
.dra-chip::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--dra-ok); }
.dra-chip[data-ok="false"]::before { background: var(--dra-error); }

.dra-composer-wrap {
  position: absolute;
  z-index: 5;
  left: 50%;
  bottom: 14px;
  width: min(760px, calc(100% - 28px));
  transform: translateX(-50%);
}
.dra-proposals {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: min(46vh, 460px);
  overflow-y: auto;
  padding: 2px;
  margin-bottom: 8px;
}
.dra-proposals .dra-proposal { margin-bottom: 0; }
.dra-composer {
  border: 1px solid var(--dra-border-strong);
  border-radius: 13px;
  background: color-mix(in srgb, var(--dra-layer) 96%, var(--dra-bg));
  box-shadow: 0 10px 34px rgba(0,0,0,.22);
  overflow: hidden;
}
.dra-composer textarea {
  display: block;
  width: 100%;
  min-height: 54px;
  max-height: 180px;
  padding: 12px 13px 8px;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  color: var(--dra-text);
  font-size: 13px;
  line-height: 1.55;
}
.dra-composer textarea::placeholder { color: var(--dra-text-3); }
.dra-composer-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px 8px 10px;
  border-top: 1px solid var(--dra-border);
}
.dra-composer-bar .dra-spacer { flex: 1 1 auto; }
.dra-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 7px;
  border-radius: 6px;
  background: var(--dra-layer-3);
  color: var(--dra-text-3);
  font-size: 10.5px;
  white-space: nowrap;
}
.dra-auto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 7px;
  border-radius: 7px;
  color: var(--dra-text-2);
  font-size: 11.5px;
  user-select: none;
  cursor: pointer;
}
.dra-auto input { position: absolute; opacity: 0; pointer-events: none; }
.dra-switch {
  position: relative;
  width: 28px;
  height: 16px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dra-text-3) 34%, transparent);
  transition: background .16s;
}
.dra-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  transition: transform .16s;
  box-shadow: 0 1px 2px rgba(0,0,0,.3);
}
.dra-auto input:checked + .dra-switch { background: var(--dra-warn); }
.dra-auto input:checked + .dra-switch::after { transform: translateX(12px); }
.dra-auto[data-on="true"] { color: var(--dra-warn); }
.dra-hint { padding: 0 10px 8px; color: var(--dra-text-3); font-size: 10.5px; }
.dra-hint[data-warn="true"] { color: var(--dra-warn); }

.dra-proposal {
  margin-bottom: 8px;
  padding: 11px 12px;
  border: 1px solid color-mix(in srgb, var(--dra-accent) 36%, var(--dra-border));
  border-radius: 12px;
  background: color-mix(in srgb, var(--dra-layer) 96%, var(--dra-accent) 3%);
  box-shadow: 0 8px 26px rgba(0,0,0,.18);
}
.dra-proposal[data-auto="true"] { border-color: color-mix(in srgb, var(--dra-warn) 42%, var(--dra-border)); }
.dra-proposal-head { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 650; }
.dra-proposal-head .dra-spacer { flex: 1 1 auto; }
.dra-badge {
  display: inline-flex;
  align-items: center;
  height: 19px;
  padding: 0 6px;
  border-radius: 5px;
  background: var(--dra-accent-soft);
  color: var(--dra-accent);
  font-size: 10px;
  font-weight: 600;
}
.dra-badge[data-tone="warn"] { background: color-mix(in srgb, var(--dra-warn) 16%, transparent); color: var(--dra-warn); }
.dra-proposal-reason { margin: 7px 0 0; color: var(--dra-text-2); font-size: 12px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.dra-proposal-target { margin-top: 7px; color: var(--dra-text-3); font-size: 11.5px; }
.dra-proposal-actions { display: flex; align-items: center; gap: 7px; margin-top: 10px; }
.dra-proposal-actions .dra-spacer { flex: 1 1 auto; }

.dra-thread {
  position: absolute;
  z-index: 3;
  left: 14px;
  bottom: 14px;
  width: min(430px, calc(100% - 28px));
  max-height: 42%;
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--dra-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--dra-layer) 94%, transparent);
  backdrop-filter: blur(10px);
}
.dra-msg { margin: 4px 0; padding: 8px 10px; border-radius: 9px; font-size: 12px; line-height: 1.55; white-space: pre-wrap; }
.dra-msg[data-role="user"] { margin-left: 24px; background: var(--dra-accent-soft); }
.dra-msg[data-role="assistant"] { margin-right: 16px; background: var(--dra-layer-3); }
.dra-msg[data-role="tool"] { color: var(--dra-text-3); font-size: 11px; }

.dra-modal-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: color-mix(in srgb, #000 38%, transparent);
  backdrop-filter: blur(2px);
}
.dra-modal {
  width: min(460px, 100%);
  max-height: calc(100% - 20px);
  overflow: auto;
  border: 1px solid var(--dra-border-strong);
  border-radius: 14px;
  background: var(--dra-layer);
  box-shadow: var(--dra-shadow);
}
.dra-modal-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 14px;
  border-bottom: 1px solid var(--dra-border);
  font-size: 13.5px;
  font-weight: 650;
}
.dra-modal-head .dra-spacer { flex: 1 1 auto; }
.dra-modal-body { padding: 13px 14px; }
.dra-modal-foot { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-top: 1px solid var(--dra-border); }
.dra-modal-foot .dra-spacer { flex: 1 1 auto; }
.dra-field { margin-bottom: 13px; }
.dra-field:last-child { margin-bottom: 0; }
.dra-field label { display: block; margin-bottom: 6px; color: var(--dra-text-2); font-size: 11.5px; font-weight: 600; }
.dra-field .dra-select { width: 100%; }
.dra-field-help { margin-top: 5px; color: var(--dra-text-3); font-size: 11px; line-height: 1.5; }

.dra-list { display: flex; flex-direction: column; gap: 6px; }
.dra-list-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border: 1px solid var(--dra-border);
  border-radius: 9px;
  background: var(--dra-layer-3);
}
.dra-list-row .dra-grow { flex: 1 1 auto; min-width: 0; }
.dra-list-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; font-weight: 550; }
.dra-list-sub { margin-top: 2px; color: var(--dra-text-3); font-size: 11px; }

.dra-progress { height: 4px; border-radius: 4px; background: color-mix(in srgb, var(--dra-text-3) 22%, transparent); overflow: hidden; }
.dra-progress > i { display: block; height: 100%; border-radius: 4px; background: var(--dra-accent); transition: width .25s; }

.dra-zoom {
  position: absolute;
  z-index: 4;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px;
  border: 1px solid var(--dra-border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--dra-layer) 92%, transparent);
  box-shadow: 0 4px 14px rgba(0,0,0,.14);
}
.dra-zoom .dra-icon-btn { width: 26px; height: 26px; border-radius: 6px; font-size: 13px; }
.dra-zoom-label { min-width: 38px; text-align: center; color: var(--dra-text-3); font-size: 10.5px; font-variant-numeric: tabular-nums; }

.dra-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--dra-text-3); }
.dra-error {
  display: flex; align-items: center; gap: 9px;
  margin: 10px; padding: 9px 11px;
  border: 1px solid color-mix(in srgb, var(--dra-error) 42%, var(--dra-border));
  border-radius: 9px;
  background: color-mix(in srgb, var(--dra-error) 9%, transparent);
  color: var(--dra-error);
  font-size: 12px;
}
.dra-spin {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--dra-accent) 30%, transparent);
  border-top-color: var(--dra-accent);
  animation: dra-spin .8s linear infinite;
}
@keyframes dra-spin { to { transform: rotate(360deg); } }

@container (max-width: 720px) {
  .dra-header { flex-wrap: wrap; gap: 6px; padding: 7px 10px; }
  .dra-search { order: 3; flex-basis: 100%; max-width: none; }
  .dra-project { max-width: 180px; }
  .dra-detail { top: 8px; right: 8px; left: 8px; width: auto; max-height: 46%; }
  .dra-composer-wrap { width: calc(100% - 16px); bottom: 8px; }
  .dra-thread { left: 8px; right: 8px; width: auto; max-height: 34%; bottom: 8px; }
  .dra-zoom { bottom: 8px; right: 8px; }
}
@container (max-width: 480px) {
  .dra-brand span { display: none; }
  .dra-composer-bar { flex-wrap: wrap; }
  .dra-tag { display: none; }
}

@media (prefers-color-scheme: light) {
  .dra { --dra-shadow: 0 12px 36px rgba(28,36,52,.14), 0 2px 8px rgba(28,36,52,.08); }
  .dra-node, .dra-composer, .dra-detail, .dra-modal { box-shadow: 0 8px 26px rgba(28,36,52,.10); }
}
`;

// src/client/index.jsx
var PANEL_ID = "dsh-router-agent";
var STYLE_ATTR = 'data-plugin="dsh-router-agent"';
function insertStyles() {
  if (typeof document === "undefined") return () => {
  };
  const previous = document.querySelector(`style[${STYLE_ATTR}]`);
  if (previous) {
    previous.textContent = CSS;
    return () => {
    };
  }
  const style = document.createElement("style");
  style.setAttribute("data-plugin", "dsh-router-agent");
  style.textContent = CSS;
  document.head.appendChild(style);
  return () => style.remove();
}
function SidebarIcon({ size = 20 }) {
  return /* @__PURE__ */ import_react9.default.createElement(RouterIcon, { size });
}
var inject = ["slots"];
function apply(ctx) {
  ctx.effect(() => insertStyles(), "dsh-router-agent: styles");
  const openSession = (sessionId) => {
    try {
      ctx.get("uiWorkspace")?.openSession?.(sessionId);
    } catch {
    }
  };
  const Panel = (props) => /* @__PURE__ */ import_react9.default.createElement(RouterPanel, { ...props, openSession });
  ctx.slots.inject(
    "main",
    () => ctx.slots.register(
      {
        name: "main",
        key: PANEL_ID
      },
      Panel
    )
  );
  ctx.slots.inject(
    "sidebar.panellist",
    () => ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: PANEL_ID,
        order: 30,
        label: () => "Router"
      },
      SidebarIcon
    )
  );
}

    })(require, module, exports);
    return module.exports;
  },
});
