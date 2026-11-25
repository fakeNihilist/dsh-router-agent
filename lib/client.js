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
var import_react11 = __toESM(require("react"), 1);

// src/client/RouterPanel.jsx
var import_react10 = __toESM(require("react"), 1);

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
var import_react2 = __toESM(require("react"), 1);

// src/client/NodeCard.jsx
var import_react = __toESM(require("react"), 1);
function level(percent) {
  if (percent === null || percent === void 0) return "ok";
  if (percent >= 85) return "high";
  if (percent >= 60) return "warn";
  return "ok";
}
function ContextRing({ percent }) {
  const known = percent !== null && percent !== void 0;
  const value = Math.min(100, Math.max(0, known ? percent : 0));
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  return /* @__PURE__ */ import_react.default.createElement(
    "span",
    {
      className: "dra-ring",
      "data-level": level(percent),
      "data-known": known ? "true" : "false",
      title: known ? `\u4E0A\u4E0B\u6587 ${percent}%` : "\u4E0A\u4E0B\u6587\u672A\u77E5"
    },
    /* @__PURE__ */ import_react.default.createElement("svg", { width: 18, height: 18, viewBox: "0 0 18 18", "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("circle", { className: "dra-ring-track", cx: "9", cy: "9", r: radius }), known ? /* @__PURE__ */ import_react.default.createElement(
      "circle",
      {
        className: "dra-ring-fill",
        cx: "9",
        cy: "9",
        r: radius,
        strokeDasharray: `${circumference} ${circumference}`,
        strokeDashoffset: circumference * (1 - value / 100),
        transform: "rotate(-90 9 9)"
      }
    ) : null)
  );
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
  onOpen
}) {
  const percent = node.context?.percent;
  return /* @__PURE__ */ import_react.default.createElement(
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
    /* @__PURE__ */ import_react.default.createElement("div", { className: "dra-node-top" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "dra-node-title" }, node.title), /* @__PURE__ */ import_react.default.createElement("span", { className: "dra-node-dot", title: node.running ? "\u6B63\u5728\u8FD0\u884C" : "\u7A7A\u95F2" })),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "dra-node-meta" }, /* @__PURE__ */ import_react.default.createElement("span", null, node.lastActiveLabel), /* @__PURE__ */ import_react.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react.default.createElement("span", { className: "dra-ctx" }, /* @__PURE__ */ import_react.default.createElement(ContextRing, { percent }), /* @__PURE__ */ import_react.default.createElement("span", { className: "dra-ctx-text" }, percent === null || percent === void 0 ? "\u2014" : `${percent}%`)))
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
  onViewportChange,
  onFit,
  onLatest
}) {
  const canvasRef = (0, import_react2.useRef)(null);
  const [viewport, setViewport] = (0, import_react2.useState)({ width: 900, height: 700 });
  const [panning, setPanning] = (0, import_react2.useState)(false);
  const viewRef = (0, import_react2.useRef)(view);
  viewRef.current = view;
  const panRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  const onPointerDown = (0, import_react2.useCallback)(
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
  const onPointerMove = (0, import_react2.useCallback)((event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    setView({
      x: pan.viewX + event.clientX - pan.startX,
      y: pan.viewY + event.clientY - pan.startY,
      z: viewRef.current.z
    });
  }, [setView]);
  const endPan = (0, import_react2.useCallback)(() => {
    panRef.current = null;
    setPanning(false);
  }, []);
  const query = String(search ?? "").trim().toLowerCase();
  const dimmed = (node) => query ? !String(node.title ?? "").toLowerCase().includes(query) : false;
  return /* @__PURE__ */ import_react2.default.createElement(
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
    /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        className: "dra-world",
        style: { transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }
      },
      /* @__PURE__ */ import_react2.default.createElement(
        "svg",
        {
          className: "dra-edges",
          width: Math.max(1, layout.width),
          height: Math.max(1, layout.height),
          "aria-hidden": true
        },
        layout.edges.map((edge) => /* @__PURE__ */ import_react2.default.createElement(
          "path",
          {
            key: `${edge.from}-${edge.to}`,
            className: "dra-edge",
            d: edgePath(edge, layout.mode),
            "data-dim": dimmed(edgeNode(edge.from)) || dimmed(edgeNode(edge.to)) ? "true" : "false"
          }
        ))
      ),
      layout.nodes.map((node) => /* @__PURE__ */ import_react2.default.createElement(
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
          onOpen
        }
      ))
    ),
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "dra-zoom" }, /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        className: "dra-icon-btn",
        type: "button",
        title: "\u7F29\u5C0F",
        onClick: () => setView({ ...view, z: clamp(view.z / 1.15, 0.25, 2.5) })
      },
      "\u2212"
    ), /* @__PURE__ */ import_react2.default.createElement("span", { className: "dra-zoom-label" }, Math.round(view.z * 100), "%"), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        className: "dra-icon-btn",
        type: "button",
        title: "\u653E\u5927",
        onClick: () => setView({ ...view, z: clamp(view.z * 1.15, 0.25, 2.5) })
      },
      "+"
    ), /* @__PURE__ */ import_react2.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u9002\u5E94\u753B\u5E03", onClick: onFit }, "\u26F6"), /* @__PURE__ */ import_react2.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u56DE\u5230\u6700\u8FD1", onClick: onLatest }, "\u25CE"))
  );
  function edgeNode(id) {
    return layout.nodes.find((node) => node.sessionId === id);
  }
}

// src/client/Composer.jsx
var import_react5 = __toESM(require("react"), 1);

// src/client/Select.jsx
var import_react3 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var counter = 0;
function Caret() {
  return /* @__PURE__ */ import_react3.default.createElement("svg", { className: "dra-caret", width: "10", height: "10", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ import_react3.default.createElement(
    "path",
    {
      d: "M4 6.5 8 10.5 12 6.5",
      stroke: "currentColor",
      strokeWidth: "1.3",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ));
}
function buildEntries(options, groups) {
  const list = [];
  for (const option of options ?? []) list.push({ kind: "option", ...option });
  for (const group of groups ?? []) {
    list.push({ kind: "group", label: group.label ?? group.id ?? "" });
    for (const option of group.options ?? []) list.push({ kind: "option", ...option });
  }
  return list;
}
function Select({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder = "\u8BF7\u9009\u62E9",
  disabled = false,
  className = "",
  id,
  ariaLabel,
  title,
  menuMinWidth = 200
}) {
  const [open, setOpen] = (0, import_react3.useState)(false);
  const [active, setActive] = (0, import_react3.useState)(-1);
  const [placement, setPlacement] = (0, import_react3.useState)(null);
  const [baseId] = (0, import_react3.useState)(() => `dra-sel-${counter += 1}`);
  const rootRef = (0, import_react3.useRef)(null);
  const triggerRef = (0, import_react3.useRef)(null);
  const popRef = (0, import_react3.useRef)(null);
  const entries = (0, import_react3.useMemo)(() => buildEntries(options, groups), [options, groups]);
  const selectable = (0, import_react3.useMemo)(
    () => entries.filter((entry) => entry.kind === "option" && !entry.disabled),
    [entries]
  );
  const current = entries.find((entry) => entry.kind === "option" && entry.value === value);
  const label = current?.label ?? placeholder;
  const listboxId = `${baseId}-listbox`;
  const optionDomId = (0, import_react3.useCallback)(
    (entry) => `${baseId}-opt-${entries.indexOf(entry)}`,
    [baseId, entries]
  );
  const place = (0, import_react3.useCallback)(() => {
    const trigger = triggerRef.current;
    const panel2 = trigger?.closest?.(".dra");
    if (!trigger || !panel2) return;
    const rect = trigger.getBoundingClientRect();
    const panelRect = panel2.getBoundingClientRect();
    const gap = 5;
    const edge = 8;
    const below = panelRect.bottom - rect.bottom - gap - edge;
    const above = rect.top - panelRect.top - gap - edge;
    const up = below < 170 && above > below;
    const width = Math.max(
      120,
      Math.min(Math.max(rect.width, Math.min(menuMinWidth, panelRect.width - edge * 2)), panelRect.width - edge * 2)
    );
    const left = Math.min(
      Math.max(edge, rect.left - panelRect.left),
      Math.max(edge, panelRect.width - edge - width)
    );
    setPlacement({
      up,
      left,
      width,
      maxHeight: Math.max(120, Math.min(320, up ? above : below)),
      top: rect.bottom - panelRect.top + gap,
      bottom: panelRect.bottom - rect.top + gap
    });
  }, [menuMinWidth]);
  const close = (0, import_react3.useCallback)((focusTrigger = false) => {
    setOpen(false);
    setPlacement(null);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);
  const openMenu = (0, import_react3.useCallback)(() => {
    if (disabled) return;
    place();
    const at = selectable.findIndex((entry) => entry.value === value);
    setActive(at >= 0 ? at : 0);
    setOpen(true);
  }, [disabled, place, selectable, value]);
  const toggle = () => {
    if (disabled) return;
    if (open) close(true);
    else openMenu();
  };
  const choose = (entry) => {
    if (!entry || entry.kind !== "option" || entry.disabled) return;
    close(true);
    if (entry.value !== value) onChange?.(entry.value, entry);
  };
  (0, import_react3.useEffect)(() => {
    if (!open) return void 0;
    const onPointer = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (popRef.current?.contains(event.target)) return;
      close(false);
    };
    const onViewport = (event) => {
      if (event?.target && popRef.current?.contains(event.target)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [open, close]);
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    popRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);
  const onKeyDown = (event) => {
    if (disabled) return;
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      close(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!selectable.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((currentIndex) => {
        const from = currentIndex >= 0 ? currentIndex : 0;
        return (from + delta + selectable.length) % selectable.length;
      });
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (selectable.length) setActive(event.key === "Home" ? 0 : selectable.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(selectable[active]);
    }
  };
  const activeEntry = selectable[active];
  const panel = open && placement ? triggerRef.current?.closest?.(".dra") ?? document.body : null;
  return /* @__PURE__ */ import_react3.default.createElement("div", { className: `dra-select ${className}`.trim(), ref: rootRef }, /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      ref: triggerRef,
      id,
      type: "button",
      className: "dra-select-trigger",
      disabled,
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      "aria-controls": open ? listboxId : void 0,
      "aria-activedescendant": open && activeEntry ? optionDomId(activeEntry) : void 0,
      "aria-label": ariaLabel,
      title: title ?? label,
      "data-value": value ?? "",
      onClick: toggle,
      onKeyDown
    },
    /* @__PURE__ */ import_react3.default.createElement("span", { className: "dra-select-value" }, label),
    /* @__PURE__ */ import_react3.default.createElement(Caret, null)
  ), panel ? (0, import_react_dom.createPortal)(
    /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        ref: popRef,
        id: listboxId,
        className: "dra-select-pop",
        role: "listbox",
        "aria-label": ariaLabel,
        style: {
          left: placement.left,
          width: placement.width,
          maxHeight: placement.maxHeight,
          ...placement.up ? { bottom: placement.bottom, top: "auto" } : { top: placement.top, bottom: "auto" }
        }
      },
      entries.map(
        (entry, index) => entry.kind === "group" ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "dra-select-group", role: "presentation", key: `${baseId}-g-${index}` }, entry.label) : /* @__PURE__ */ import_react3.default.createElement(
          "div",
          {
            id: optionDomId(entry),
            className: "dra-select-option",
            role: "option",
            key: `${baseId}-o-${index}`,
            "aria-selected": entry.value === value,
            "aria-disabled": entry.disabled || void 0,
            "data-value": entry.value,
            "data-selected": entry.value === value ? "true" : void 0,
            "data-active": activeEntry === entry ? "true" : void 0,
            "data-disabled": entry.disabled ? "true" : void 0,
            title: entry.label,
            onMouseDown: (event) => event.preventDefault(),
            onMouseEnter: () => {
              const at = selectable.indexOf(entry);
              if (at >= 0) setActive(at);
            },
            onClick: () => choose(entry)
          },
          /* @__PURE__ */ import_react3.default.createElement("span", { className: "dra-select-option-label" }, entry.label),
          entry.value === value ? /* @__PURE__ */ import_react3.default.createElement("span", { className: "dra-select-check", "aria-hidden": "true" }, "\u2713") : null
        )
      )
    ),
    panel
  ) : null);
}

// src/client/Tooltip.jsx
var import_react4 = __toESM(require("react"), 1);
var import_react_dom2 = require("react-dom");
function Tip({ label, children }) {
  const [open, setOpen] = (0, import_react4.useState)(false);
  const [placement, setPlacement] = (0, import_react4.useState)(null);
  const anchorRef = (0, import_react4.useRef)(null);
  const timerRef = (0, import_react4.useRef)(0);
  const show = (0, import_react4.useCallback)(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const anchor = anchorRef.current;
      const panel2 = anchor?.closest?.(".dra");
      if (!anchor || !panel2) return;
      const rect = anchor.getBoundingClientRect();
      const panelRect = panel2.getBoundingClientRect();
      const half = 130;
      const center = rect.left - panelRect.left + rect.width / 2;
      setPlacement({
        left: Math.min(Math.max(center, half + 8), Math.max(half + 8, panelRect.width - half - 8)),
        top: rect.top - panelRect.top - 8
      });
      setOpen(true);
    }, 140);
  }, []);
  const hide = (0, import_react4.useCallback)(() => {
    window.clearTimeout(timerRef.current);
    setOpen(false);
  }, []);
  (0, import_react4.useEffect)(() => () => window.clearTimeout(timerRef.current), []);
  (0, import_react4.useEffect)(() => {
    if (!open) return void 0;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);
  const panel = open && placement ? anchorRef.current?.closest?.(".dra") : null;
  return /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(
    "span",
    {
      ref: anchorRef,
      className: "dra-tip-anchor",
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide
    },
    children
  ), panel && placement ? (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ import_react4.default.createElement("span", { className: "dra-tip", role: "tooltip", style: { left: placement.left, top: placement.top } }, label),
    panel
  ) : null);
}

// src/client/Composer.jsx
var OPERATION_OPTIONS = [
  { value: "workspace-write", label: "\u5DE5\u4F5C\u533A\u5185\u4FEE\u6539" },
  { value: "danger-full-access", label: "\u5B8C\u5168\u8BBF\u95EE" },
  { value: "plan", label: "\u8BA1\u5212\u6A21\u5F0F" }
];
var MANUAL_ACTIONS = [
  { value: "route", label: "\u6307\u5B9A", title: "\u628A\u4EFB\u52A1\u53D1\u9001\u5230\u8FD9\u4E2A\u4F1A\u8BDD" },
  { value: "fork", label: "\u5206\u53C9", title: "\u4ECE\u8BE5\u4F1A\u8BDD\u7684\u67D0\u4E00\u8F6E\u5206\u53C9\u540E\u53D1\u9001" },
  { value: "new", label: "\u65B0\u4F1A\u8BDD", title: "\u65B0\u5EFA\u4E00\u4E2A\u5E72\u51C0\u4F1A\u8BDD\u540E\u53D1\u9001" }
];
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
  onManualSend,
  manualTarget,
  onClearTarget,
  planAvailable = true,
  permissionAvailable = true
}) {
  const [manualAction, setManualAction] = (0, import_react5.useState)("route");
  const [atSeq, setAtSeq] = (0, import_react5.useState)(null);
  const boundaries = manualTarget?.boundaries ?? [];
  const manual = !!manualTarget;
  (0, import_react5.useEffect)(() => {
    if (!manualTarget) return;
    setManualAction("route");
    setAtSeq(manualTarget.boundaries?.at(-1)?.atSeq ?? null);
  }, [manualTarget?.sessionId]);
  (0, import_react5.useEffect)(() => {
    if (!manualTarget) return;
    if (!boundaries.some((item) => item.atSeq === atSeq)) {
      setAtSeq(boundaries.at(-1)?.atSeq ?? null);
    }
  }, [boundaries, atSeq, manualTarget]);
  const operation = mode === "plan" ? "plan" : permissions === "danger-full-access" ? "danger-full-access" : "workspace-write";
  const changeOperation = (value) => {
    if (value === "plan") {
      setMode("plan");
      setPermissions("workspace-write");
    } else {
      setMode("standard");
      setPermissions(value);
    }
  };
  const action = MANUAL_ACTIONS.find((item) => item.value === manualAction) ?? MANUAL_ACTIONS[0];
  const canFork = boundaries.length > 0;
  const operationOptions = planAvailable ? OPERATION_OPTIONS : OPERATION_OPTIONS.filter((item) => item.value !== "plan");
  const submit = () => {
    if (!task.trim() || busy || disabled) return;
    if (manual) {
      onManualSend?.(manualAction, manualAction === "fork" ? atSeq : null);
    } else {
      onSend();
    }
  };
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-composer" }, manual ? /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-manual" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-manual-head" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "dra-manual-label" }, "\u624B\u52A8\u6D3E\u53D1"), /* @__PURE__ */ import_react5.default.createElement("span", { className: "dra-manual-title", title: manualTarget.title }, manualTarget.title), /* @__PURE__ */ import_react5.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      className: "dra-manual-clear",
      type: "button",
      title: "\u53D6\u6D88\u9009\u62E9\uFF0C\u4EA4\u7ED9 Router \u5224\u65AD",
      "aria-label": "\u53D6\u6D88\u9009\u62E9\uFF0C\u4EA4\u7ED9 Router \u5224\u65AD",
      onClick: onClearTarget
    },
    "\xD7"
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-manual-actions" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-seg", role: "group", "aria-label": "\u624B\u52A8\u6D3E\u53D1\u52A8\u4F5C" }, MANUAL_ACTIONS.map((item) => /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      key: item.value,
      className: "dra-seg-btn",
      type: "button",
      "data-active": manualAction === item.value ? "true" : "false",
      disabled: item.value === "fork" && !canFork,
      title: item.value === "fork" && !canFork ? "\u8BE5\u4F1A\u8BDD\u8FD8\u6CA1\u6709\u5DF2\u5B8C\u6210\u8F6E\u6B21\uFF0C\u65E0\u6CD5\u5206\u53C9" : item.title,
      onClick: () => setManualAction(item.value)
    },
    item.label
  ))), manualAction === "fork" ? /* @__PURE__ */ import_react5.default.createElement(
    Select,
    {
      className: "dra-fork-select",
      value: String(atSeq ?? ""),
      onChange: (next) => setAtSeq(Number(next)),
      options: boundaries.map((item) => ({
        value: String(item.atSeq),
        label: `T${item.turn} \xB7 ${item.label}`
      })),
      placeholder: "\u9009\u62E9\u5206\u53C9\u70B9",
      ariaLabel: "\u5206\u53C9\u70B9",
      menuMinWidth: 260
    }
  ) : /* @__PURE__ */ import_react5.default.createElement("span", { className: "dra-manual-hint" }, manualAction === "route" ? "\u53D1\u9001\u540E\u4ECD\u9700\u786E\u8BA4" : "\u4E0D\u7EE7\u627F\u9009\u4E2D\u4F1A\u8BDD\u7684\u4E0A\u4E0B\u6587"))) : null, /* @__PURE__ */ import_react5.default.createElement(
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
      placeholder: disabled ? disabledReason : manual ? `\u63CF\u8FF0\u8981${action.value === "new" ? "\u65B0\u5EFA\u5E76\u53D1\u9001" : action.value === "fork" ? "\u5206\u53C9\u5E76\u53D1\u9001" : "\u53D1\u9001\u5230\u8BE5\u4F1A\u8BDD"}\u7684\u4EFB\u52A1\u2026` : "\u63CF\u8FF0\u8981\u505A\u7684\u4EFB\u52A1\uFF0CRouter \u4F1A\u5224\u65AD\u7EE7\u7EED\u3001\u5206\u53C9\u8FD8\u662F\u65B0\u5EFA\u2026",
      disabled,
      rows: 3,
      "aria-label": "\u4EFB\u52A1",
      "data-composer-input": true
    }
  ), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dra-composer-bar" }, /* @__PURE__ */ import_react5.default.createElement(
    Select,
    {
      className: "dra-operation-select",
      value: operation,
      onChange: changeOperation,
      options: operationOptions,
      disabled: disabled || !permissionAvailable,
      ariaLabel: "\u64CD\u4F5C\u6743\u9650",
      menuMinWidth: 170
    }
  ), /* @__PURE__ */ import_react5.default.createElement(
    Tip,
    {
      label: manual ? "\u624B\u52A8\u6D3E\u53D1\u59CB\u7EC8\u9700\u8981\u786E\u8BA4\uFF0C\u4E0D\u4F7F\u7528\u81EA\u52A8\u6267\u884C" : "\u5F00\u542F\u540E RA \u5224\u65AD\u5B8C\u76F4\u63A5\u6267\u884C\uFF0C\u4E0D\u518D\u786E\u8BA4"
    },
    /* @__PURE__ */ import_react5.default.createElement("label", { className: "dra-auto", "data-on": auto && !manual ? "true" : "false", "data-manual": manual ? "true" : "false" }, /* @__PURE__ */ import_react5.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: auto,
        onChange: (event) => setAuto(event.target.checked),
        disabled: disabled || manual,
        "aria-label": "\u81EA\u52A8\u6267\u884C"
      }
    ), /* @__PURE__ */ import_react5.default.createElement("span", { className: "dra-switch" }), "\u81EA\u52A8\u6267\u884C")
  ), /* @__PURE__ */ import_react5.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary",
      type: "button",
      disabled: !task.trim() || busy || disabled || manual && manualAction === "fork" && !atSeq,
      onClick: submit,
      title: manual ? "\u751F\u6210\u5F85\u786E\u8BA4\u63D0\u8BAE\uFF0C\u786E\u8BA4\u540E\u624D\u53D1\u9001" : void 0,
      "data-send": true
    },
    busy ? "\u53D1\u9001\u4E2D\u2026" : "\u53D1\u9001"
  )));
}

// src/client/Detail.jsx
var import_react7 = __toESM(require("react"), 1);

// src/client/icons.jsx
var import_react6 = __toESM(require("react"), 1);
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
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, width: size, height: size, viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "6", cy: "6", r: "2.2" }), /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "18", cy: "6", r: "2.2" }), /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "12", cy: "18", r: "2.2" }), /* @__PURE__ */ import_react6.default.createElement("path", { d: "M8.2 6h7.6M7.2 8l4 8M16.8 8l-4 8" }));
}
function SearchIcon(props) {
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "11", cy: "11", r: "6.5" }), /* @__PURE__ */ import_react6.default.createElement("path", { d: "m16 16 4 4" }));
}
function HistoryIcon(props) {
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react6.default.createElement("path", { d: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" }), /* @__PURE__ */ import_react6.default.createElement("path", { d: "M3.5 4.5v4h4M12 7.5V12l3 2" }));
}
function SettingsIcon(props) {
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ import_react6.default.createElement("path", { d: "M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" }));
}
function MoreIcon(props) {
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "5", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "12", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "19", cy: "12", r: "1.2", fill: "currentColor", stroke: "none" }));
}
function CompressIcon({ size = 14, ...props }) {
  return /* @__PURE__ */ import_react6.default.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 1024 1024",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
      ...props
    },
    /* @__PURE__ */ import_react6.default.createElement("path", { d: "M743.253333 515.413333c0-8.533333-3.413333-17.066667-10.24-23.893333-6.826667-6.826667-15.36-10.24-23.893333-10.24H296.277333c-8.533333 0-17.066667 3.413333-23.893333 10.24-6.826667 6.826667-10.24 15.36-10.24 23.893333 0 8.533333 3.413333 17.066667 10.24 23.893334 6.826667 6.826667 15.36 10.24 23.893333 10.24h412.842667c8.533333 0 17.066667-3.413333 23.893333-10.24 6.826667-6.826667 10.24-15.36 10.24-23.893334z" }),
    /* @__PURE__ */ import_react6.default.createElement("path", { d: "M987.204267 187.869867c0-69.9392-34.133333-105.7792-104.072534-105.7792h-174.011733c-8.533333 0-17.066667 3.413333-23.893333 10.24s-10.24 15.36-10.24 23.893333 3.413333 17.066667 10.24 23.893333 15.36 10.24 23.893333 10.24h174.011733c23.893333 0 35.84 11.946667 35.84 37.546667v661.9136c0 23.893333-11.946667 35.84-35.84 37.546667h-174.011733c-8.533333 0-17.066667 3.413333-23.893333 10.24s-10.24 15.36-10.24 23.893333 3.413333 17.066667 10.24 23.893333 15.36 10.24 23.893333 10.24h175.7184c68.232533-1.706667 102.365867-35.84 102.365867-105.7792V187.869867zM634.0608 223.675733c-6.826667-6.826667-15.36-10.24-23.893333-8.533333-10.24 1.706667-18.773333 5.12-23.893334 11.946667l-47.752533 57.992533V65.024c0-8.533333-3.413333-17.066667-10.24-23.893333s-15.36-10.24-23.893333-10.24c-8.533333 0-17.066667 3.413333-23.893334 10.24s-10.24 15.36-10.24 23.893333v218.350933l-46.045866-47.752533c-6.826667-6.826667-15.36-10.24-23.893334-10.24-10.24 0-18.773333 3.413333-25.6 10.24-6.826667 5.12-10.24 13.653333-10.24 23.893333 0 8.533333 3.413333 17.066667 10.24 23.893334l104.072534 107.485866c0 1.706667 0 1.706667 1.706666 3.413334l1.706667 1.706666c5.12 5.12 10.24 8.533333 17.066667 10.24 5.12 1.706667 11.946667 0 17.066666-1.706666s10.24-5.12 15.36-10.24l105.7792-122.845867c6.826667-6.826667 10.24-15.36 8.533334-23.893333-1.706667-10.24-5.12-18.773333-11.946667-23.893334zM325.290667 92.330667c-6.826667-6.826667-15.36-10.24-23.893334-10.24H141.038933c-35.84 0-61.405867 10.24-76.765866 29.013333-18.773333 15.36-29.013333 40.96-27.306667 76.765867v661.9136c-1.706667 34.133333 8.533333 59.6992 27.306667 76.765866 15.36 18.773333 40.96 27.306667 76.765866 29.013334H301.397333c8.533333 0 17.066667-3.413333 23.893334-10.24s10.24-15.36 10.24-23.893334c0-8.533333-3.413333-17.066667-10.24-23.893333s-15.36-10.24-23.893334-10.24H141.038933c-11.946667 0-22.186667-3.413333-29.013333-8.533333-5.12-6.826667-6.826667-15.36-6.826667-27.306667V187.869867c0-13.653333 1.706667-23.893333 6.826667-29.013334 6.826667-5.12 17.066667-8.533333 29.013333-8.533333H301.397333c8.533333 0 17.066667-3.413333 23.893334-10.24s10.24-15.36 10.24-23.893333c0-8.4992-3.413333-17.032533-10.24-23.8592zM364.509867 776.430933c1.706667 8.533333 5.12 17.066667 11.946666 22.186667 6.826667 6.826667 15.36 10.24 25.6 8.533333 8.533333-1.706667 17.066667-5.12 22.186667-11.946666l49.4592-56.285867-1.706667 220.0576c0 8.533333 3.413333 17.066667 10.24 23.893333s15.36 10.24 23.893334 10.24 17.066667-3.413333 23.893333-8.533333c6.826667-8.533333 10.24-17.066667 10.24-25.6l1.706667-220.0576 46.045866 47.752533c5.12 6.826667 13.653333 10.24 23.893334 10.24 8.533333 0 17.066667-3.413333 23.893333-8.533333 6.826667-6.826667 10.24-15.36 10.24-23.893333 0-10.24-3.413333-18.773333-8.533333-25.6l-102.365867-105.7792c-5.12-5.12-10.24-10.24-15.36-13.653334-6.826667-3.413333-13.653333-3.413333-22.186667-1.706666s-13.653333 5.12-18.773333 10.24l-105.7792 122.845866c-6.826667 6.826667-10.24 15.36-8.533333 25.6z" })
  );
}
function CloseIcon(props) {
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react6.default.createElement("path", { d: "m6 6 12 12M18 6 6 18" }));
}
function StopIcon(props) {
  return /* @__PURE__ */ import_react6.default.createElement("svg", { ...base, ...props }, /* @__PURE__ */ import_react6.default.createElement("circle", { cx: "12", cy: "12", r: "8.5" }), /* @__PURE__ */ import_react6.default.createElement("path", { d: "M9 9h6v6H9z" }));
}

// src/client/Detail.jsx
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
  onOpen,
  onCompress,
  onStop,
  onRename,
  onClose,
  canCompress = true
}) {
  const [editing, setEditing] = (0, import_react7.useState)(false);
  const [title, setTitle] = (0, import_react7.useState)(session.title);
  (0, import_react7.useEffect)(() => {
    setTitle(session.title);
    setEditing(false);
  }, [session.sessionId, session.title]);
  const percent = session.context?.percent;
  const commit = () => {
    const clean = title.trim();
    setEditing(false);
    if (clean && clean !== session.title) onRename?.(session.sessionId, clean);
  };
  return /* @__PURE__ */ import_react7.default.createElement("aside", { className: "dra-detail", "data-detail": true, "aria-label": "\u4F1A\u8BDD\u8BE6\u60C5" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-head" }, editing ? /* @__PURE__ */ import_react7.default.createElement(
    "input",
    {
      className: "dra-input dra-grow",
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
  ) : /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-title", onDoubleClick: () => setEditing(true), title: "\u53CC\u51FB\u91CD\u547D\u540D" }, session.title), /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u5173\u95ED\u8BE6\u60C5", onClick: onClose }, /* @__PURE__ */ import_react7.default.createElement(CloseIcon, { width: 14, height: 14 }))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-meta" }, session.running ? "\u6B63\u5728\u8FD0\u884C" : "\u7A7A\u95F2", " \xB7 ", session.turns, " \u8F6E \xB7 \u6700\u540E\u6D3B\u8DC3 ", session.lastActiveLabel), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn dra-btn-primary dra-grow", type: "button", onClick: () => onOpen?.(session.sessionId) }, "\u6253\u5F00\u4F1A\u8BDD"), !editing ? /* @__PURE__ */ import_react7.default.createElement("button", { className: "dra-btn", type: "button", onClick: () => setEditing(true) }, "\u91CD\u547D\u540D") : null), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-section" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-label" }, "\u4E0A\u4E0B\u6587"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-grow" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-ctx-text" }, tokens(session.context?.usedTokens), " / ", tokens(session.context?.limitTokens), percent === null || percent === void 0 ? " \xB7 \u672A\u77E5" : ` \xB7 ${percent}%`), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-ctx-bar", style: { width: "100%", marginTop: 6 }, "data-level": level2(percent) }, /* @__PURE__ */ import_react7.default.createElement("i", { style: { width: `${Math.min(100, Math.max(0, percent ?? 0))}%` } }))), /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-sm",
      type: "button",
      disabled: !canCompress || percent === null || percent === void 0,
      onClick: () => onCompress?.(session),
      title: "\u538B\u7F29\u4E0A\u4E0B\u6587"
    },
    /* @__PURE__ */ import_react7.default.createElement(CompressIcon, { width: 12, height: 12 }),
    "\u538B\u7F29"
  ))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dra-detail-section" }, /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-danger",
      type: "button",
      onClick: () => onStop?.(session),
      title: "\u505C\u6B62\u8DDF\u8E2A\u8FD9\u4E2A\u4F1A\u8BDD\uFF1B\u8DDF\u8E2A\u4E2D\u7684\u5B50\u4F1A\u8BDD\u4F1A\u79FB\u5230\u9876\u5C42"
    },
    /* @__PURE__ */ import_react7.default.createElement(StopIcon, { width: 13, height: 13 }),
    "\u4E0D\u518D\u8DDF\u8E2A\u4F1A\u8BDD"
  )));
}

// src/client/ProposalCard.jsx
var import_react8 = __toESM(require("react"), 1);
var ACTION_LABEL = {
  route: "\u7EE7\u7EED\u5DF2\u6709\u4F1A\u8BDD",
  fork: "\u4ECE\u5386\u53F2\u8F6E\u6B21\u5206\u53C9",
  new: "\u65B0\u5EFA\u5E72\u51C0\u4F1A\u8BDD",
  ask: "\u9700\u8981\u4F60\u786E\u8BA4"
};
var PLAN_LABEL = (value) => value ? "\u8BA1\u5212" : "\u6807\u51C6";
var PERMISSION_LABEL = (value) => value === "read-only" ? "\u53EA\u8BFB" : value === "danger-full-access" ? "\u5B8C\u5168\u8BBF\u95EE" : value === "workspace-write" ? "\u5DE5\u4F5C\u533A" : "\u672A\u77E5";
function routeSettingNote(proposal) {
  const planKnown = proposal.targetPlan !== null && proposal.targetPlan !== void 0;
  const permissionKnown = proposal.targetPermissions !== null && proposal.targetPermissions !== void 0;
  const planAfter = proposal.composer?.mode === "plan";
  const permissionAfter = proposal.composer?.permissions ?? "workspace-write";
  if (!planKnown || !permissionKnown) {
    return `\u76EE\u6807\u5F53\u524D\u8BBE\u7F6E\u672A\u77E5\uFF1B\u786E\u8BA4\u540E\u5C06\u5E94\u7528 ${PLAN_LABEL(planAfter)} \xB7 ${PERMISSION_LABEL(permissionAfter)}`;
  }
  if (planAfter === proposal.targetPlan && permissionAfter === proposal.targetPermissions) return null;
  return `\u76EE\u6807\u8BBE\u7F6E\u5C06\u6539\u53D8\uFF1A${PLAN_LABEL(proposal.targetPlan)} \xB7 ${PERMISSION_LABEL(proposal.targetPermissions)} \u2192 ${PLAN_LABEL(planAfter)} \xB7 ${PERMISSION_LABEL(permissionAfter)}`;
}
function ProposalCard({
  proposal,
  target,
  sessions = [],
  index = 0,
  total = 1,
  busy,
  onConfirm,
  onChoose,
  onAbandon,
  onAnswer,
  onRetry,
  onRetarget
}) {
  const [answer, setAnswer] = (0, import_react8.useState)("");
  const [revising, setRevising] = (0, import_react8.useState)(false);
  const [note, setNote] = (0, import_react8.useState)("");
  const [retargeting, setRetargeting] = (0, import_react8.useState)(false);
  if (!proposal) return null;
  const fork = proposal.action === "fork";
  const ask = proposal.action === "ask";
  const route = proposal.action === "route";
  const delta = route ? routeSettingNote(proposal) : null;
  const sessionOptions = sessions.map((row) => ({
    value: row.sessionId,
    label: row.title
  }));
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal", "data-proposal": true, "data-auto": proposal.auto ? "true" : "false" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-head" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-badge", "data-tone": ask ? "warn" : void 0 }, ACTION_LABEL[proposal.action] ?? proposal.action), /* @__PURE__ */ import_react8.default.createElement("span", null, proposal.summary), /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-spacer" }), total > 1 ? /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-badge dra-queue-badge" }, index + 1, "/", total) : null, proposal.auto ? /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-badge", "data-tone": "warn" }, "\u81EA\u52A8\u6267\u884C") : null), proposal.task ? /* @__PURE__ */ import_react8.default.createElement("p", { className: "dra-proposal-task", title: proposal.task }, proposal.task) : null, proposal.reason ? /* @__PURE__ */ import_react8.default.createElement("p", { className: "dra-proposal-reason" }, proposal.reason) : null, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-target" }, proposal.action === "new" ? "\u65B0\u4F1A\u8BDD\u4ECE\u4EFB\u52A1\u539F\u6587\u5F00\u59CB\uFF0C\u4E0D\u5E26\u4EA4\u63A5\u5305\u3002" : ask ? proposal.question : `\u76EE\u6807\uFF1A${proposal.targetTitle ?? proposal.targetSessionId}`, route && target?.running ? " \xB7 \u6B63\u5728\u8FD0\u884C\uFF0C\u786E\u8BA4\u540E\u4EFB\u52A1\u4F1A\u6392\u961F" : null), fork ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-target" }, "\u5206\u53C9\u4F1A\u8BDD\u5C06\u4F7F\u7528\uFF1A", PLAN_LABEL(proposal.composer?.mode === "plan"), " \xB7", " ", PERMISSION_LABEL(proposal.composer?.permissions)) : null, proposal.action === "new" ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-target" }, "\u65B0\u4F1A\u8BDD\u5C06\u4F7F\u7528\uFF1A", PLAN_LABEL(proposal.composer?.mode === "plan"), " \xB7", " ", PERMISSION_LABEL(proposal.composer?.permissions)) : null, delta ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-target" }, delta) : null, fork && target?.boundaries?.length ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react8.default.createElement(
    Select,
    {
      className: "dra-grow",
      value: String(proposal.atSeq ?? ""),
      onChange: (next) => onChoose?.(proposal, Number(next)),
      options: target.boundaries.map((item) => ({
        value: String(item.atSeq),
        label: `T${item.turn} \xB7 ${item.label}`
      })),
      ariaLabel: "\u5206\u53C9\u70B9",
      menuMinWidth: 260
    }
  )) : null, fork && target && target.boundaryCount > (target.boundaries?.length ?? 0) ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u663E\u793A\u6700\u8FD1 ", target.boundaries.length, " \u8F6E\uFF08\u5171 ", target.boundaryCount, " \u8F6E\uFF09\u3002") : null, retargeting && !ask ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-row" }, /* @__PURE__ */ import_react8.default.createElement(
    Select,
    {
      className: "dra-grow",
      value: proposal.targetSessionId ?? "",
      onChange: (next) => {
        setRetargeting(false);
        onRetarget?.(proposal, next);
      },
      options: sessionOptions,
      placeholder: "\u9009\u62E9\u65B0\u7684\u76EE\u6807\u4F1A\u8BDD",
      ariaLabel: "\u65B0\u7684\u76EE\u6807\u4F1A\u8BDD",
      menuMinWidth: 260
    }
  )) : null, revising ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-row" }, /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      className: "dra-input dra-grow",
      value: note,
      placeholder: "\u53EF\u9009\uFF1A\u544A\u8BC9 RA \u54EA\u91CC\u5224\u65AD\u9519\u4E86",
      onChange: (event) => setNote(event.target.value),
      onKeyDown: (event) => {
        if (event.key === "Enter" && !busy) onRetry?.(proposal, note.trim());
      },
      "aria-label": "\u7EA0\u6B63\u8BF4\u660E"
    }
  ), /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary dra-btn-sm",
      type: "button",
      disabled: busy,
      onClick: () => onRetry?.(proposal, note.trim())
    },
    "\u91CD\u65B0\u5224\u65AD"
  ), /* @__PURE__ */ import_react8.default.createElement("button", { className: "dra-btn dra-btn-ghost dra-btn-sm", type: "button", onClick: () => setRevising(false) }, "\u53D6\u6D88")) : null, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dra-proposal-actions" }, ask ? /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, proposal.options?.length ? proposal.options.map((option) => /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-sm",
      type: "button",
      key: option,
      disabled: busy,
      onClick: () => onAnswer?.(proposal, option)
    },
    option
  )) : /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      className: "dra-input",
      value: answer,
      placeholder: "\u56DE\u7B54 RA\u2026",
      onChange: (event) => setAnswer(event.target.value),
      onKeyDown: (event) => {
        if (event.key === "Enter" && answer.trim()) onAnswer?.(proposal, answer.trim());
      },
      "aria-label": "\u56DE\u7B54 Router"
    }
  ), /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary dra-btn-sm",
      type: "button",
      disabled: !answer.trim() || busy,
      onClick: () => onAnswer?.(proposal, answer.trim())
    },
    "\u56DE\u7B54"
  )), onRetry && !revising ? /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-ghost dra-btn-sm",
      type: "button",
      disabled: busy,
      onClick: () => setRevising(true)
    },
    "\u91CD\u65B0\u5224\u65AD"
  ) : null) : /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-ghost dra-btn-sm",
      type: "button",
      disabled: busy,
      onClick: () => onAbandon?.(proposal)
    },
    "\u53D6\u6D88"
  ), onRetarget && !retargeting ? /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-ghost dra-btn-sm",
      type: "button",
      disabled: busy,
      onClick: () => setRetargeting(true)
    },
    "\u6362\u76EE\u6807"
  ) : null, onRetry && !revising ? /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-ghost dra-btn-sm",
      type: "button",
      disabled: busy,
      onClick: () => setRevising(true)
    },
    "\u91CD\u65B0\u5224\u65AD"
  ) : null, /* @__PURE__ */ import_react8.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react8.default.createElement(
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
var import_react9 = __toESM(require("react"), 1);
function tokens2(value) {
  if (value === null || value === void 0) return "\u2014";
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}m`;
  if (value >= 1e3) return `${Math.round(value / 1e3)}k`;
  return String(value);
}
function Mask({ children, onClose, label, className = "" }) {
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-mask", onMouseDown: (event) => event.target === event.currentTarget && onClose?.() }, /* @__PURE__ */ import_react9.default.createElement("div", { className: `dra-modal ${className}`.trim(), role: "dialog", "aria-modal": "true", "aria-label": label }, children));
}
function Head({ title, onClose }) {
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-head" }, /* @__PURE__ */ import_react9.default.createElement("span", null, title), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u5173\u95ED", onClick: onClose }, /* @__PURE__ */ import_react9.default.createElement(CloseIcon, { width: 14, height: 14 })));
}
function SettingsModal({ settings, models, onSave, onClose }) {
  const [layout, setLayout] = (0, import_react9.useState)(settings?.layout ?? "vertical");
  const savedRa = modelValue(settings?.raModel);
  const savedIndex = modelValue(settings?.indexModel);
  const savedFresh = modelValue(settings?.defaultSessionModel);
  const fallbackModel = defaultModelValue(models);
  const [ra, setRa] = (0, import_react9.useState)(() => savedRa || fallbackModel);
  const [index, setIndex] = (0, import_react9.useState)(() => savedIndex || fallbackModel);
  const [fresh, setFresh] = (0, import_react9.useState)(() => savedFresh || fallbackModel);
  const [autoAsk, setAutoAsk] = (0, import_react9.useState)(settings?.autoAsk ?? "keep");
  const [trackingDays, setTrackingDays] = (0, import_react9.useState)(String(settings?.trackingDays ?? 7));
  const [busy, setBusy] = (0, import_react9.useState)(false);
  const groups = models?.groups ?? [];
  const modelForSave = (value, saved) => !saved && value === fallbackModel ? null : parseModel(value);
  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        layout,
        raModel: modelForSave(ra, savedRa),
        indexModel: modelForSave(index, savedIndex),
        defaultSessionModel: modelForSave(fresh, savedFresh),
        autoAsk,
        trackingDays: Number(trackingDays)
      });
      onClose?.();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react9.default.createElement(Mask, { onClose, label: "Router \u8BBE\u7F6E" }, /* @__PURE__ */ import_react9.default.createElement(Head, { title: "Router \u8BBE\u7F6E", onClose }), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { htmlFor: "dra-layout" }, "\u8282\u70B9\u6392\u5217\u65B9\u5F0F"), /* @__PURE__ */ import_react9.default.createElement(
    Select,
    {
      id: "dra-layout",
      value: layout,
      onChange: setLayout,
      options: [
        { value: "vertical", label: "\u7EB5\u5411 \xB7 \u6839\u4ECE\u5DE6\u5230\u53F3\uFF0C\u5206\u53C9\u5411\u4E0B" },
        { value: "horizontal", label: "\u6A2A\u5411 \xB7 \u6839\u4ECE\u4E0A\u5230\u4E0B\uFF0C\u5206\u53C9\u5411\u53F3" }
      ],
      ariaLabel: "\u8282\u70B9\u6392\u5217\u65B9\u5F0F"
    }
  )), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { htmlFor: "dra-ra-model" }, "Router \u6A21\u578B\uFF08\u5BF9\u8BDD\uFF09"), /* @__PURE__ */ import_react9.default.createElement(
    Select,
    {
      id: "dra-ra-model",
      value: ra,
      onChange: setRa,
      groups: modelGroups(groups),
      disabled: groups.length === 0,
      placeholder: "\u9009\u62E9\u6A21\u578B",
      ariaLabel: "Router \u6A21\u578B",
      menuMinWidth: 260
    }
  ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u7528\u4E8E Router \u7684\u5BF9\u8BDD\u4E0E\u8DEF\u7531\u5224\u65AD\uFF0C\u4E0D\u6539\u53D8\u76EE\u6807\u4F1A\u8BDD\u7684\u6A21\u578B\u3002")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { htmlFor: "dra-index-model" }, "\u7D22\u5F15\u6A21\u578B"), /* @__PURE__ */ import_react9.default.createElement(
    Select,
    {
      id: "dra-index-model",
      value: index,
      onChange: setIndex,
      groups: modelGroups(groups),
      disabled: groups.length === 0,
      placeholder: "\u9009\u62E9\u6A21\u578B",
      ariaLabel: "\u7D22\u5F15\u6A21\u578B",
      menuMinWidth: 260
    }
  ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u7528\u4E8E\u9996\u6B21\u5EFA\u7ACB\u7D22\u5F15\u548C\u540E\u53F0\u6458\u8981\u5237\u65B0\uFF1B\u9ED8\u8BA4\u8DDF\u968F\u90E8\u7F72\u9ED8\u8BA4\u6A21\u578B\u3002\u9009\u62E9\u66F4\u5F3A\u7684\u6A21\u578B\u4F1A\u66F4\u51C6\uFF0C\u4E5F\u66F4\u8D35\u3002")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { htmlFor: "dra-new-model" }, "\u65B0\u4F1A\u8BDD\u9ED8\u8BA4\u6A21\u578B"), /* @__PURE__ */ import_react9.default.createElement(
    Select,
    {
      id: "dra-new-model",
      value: fresh,
      onChange: setFresh,
      groups: modelGroups(groups),
      disabled: groups.length === 0,
      placeholder: "\u9009\u62E9\u6A21\u578B",
      ariaLabel: "\u65B0\u4F1A\u8BDD\u9ED8\u8BA4\u6A21\u578B",
      menuMinWidth: 260
    }
  ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u7528\u4E8E Router \u65B0\u5EFA\u548C\u5206\u53C9\u7684\u4F1A\u8BDD\uFF1B\u5DF2\u6709\u4F1A\u8BDD\u4FDD\u6301\u539F\u6A21\u578B\u3002")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { htmlFor: "dra-auto-ask" }, "\u81EA\u52A8\u6267\u884C\u9047\u5230\u8FFD\u95EE\u65F6"), /* @__PURE__ */ import_react9.default.createElement(
    Select,
    {
      id: "dra-auto-ask",
      value: autoAsk,
      onChange: setAutoAsk,
      options: [
        { value: "keep", label: "\u4FDD\u7559\u8FFD\u95EE \xB7 \u7B49\u7528\u6237\u56DE\u7B54" },
        { value: "suggest", label: "\u81EA\u52A8\u91C7\u7528\u7B2C\u4E00\u4E2A\u5EFA\u8BAE\u9879" },
        { value: "decide", label: "\u4EA4\u7ED9 RA \u5224\u65AD \xB7 \u4E0D\u5141\u8BB8\u8FFD\u95EE" }
      ],
      ariaLabel: "\u81EA\u52A8\u6267\u884C\u9047\u5230\u8FFD\u95EE\u65F6",
      menuMinWidth: 240
    }
  ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u4EC5\u5728\u8F93\u5165\u533A\u5F00\u542F\u201C\u81EA\u52A8\u6267\u884C\u201D\u65F6\u751F\u6548\uFF1B\u5173\u95ED\u81EA\u52A8\u6267\u884C\u65F6\u59CB\u7EC8\u4FDD\u7559\u8FFD\u95EE\u3002")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { htmlFor: "dra-tracking-days" }, "\u8DDF\u8E2A\u8303\u56F4"), /* @__PURE__ */ import_react9.default.createElement(
    Select,
    {
      id: "dra-tracking-days",
      value: trackingDays,
      onChange: setTrackingDays,
      options: [
        { value: "3", label: "\u6700\u8FD1 3 \u5929" },
        { value: "7", label: "\u6700\u8FD1 7 \u5929" },
        { value: "14", label: "\u6700\u8FD1 14 \u5929" },
        { value: "30", label: "\u6700\u8FD1 30 \u5929" },
        { value: "90", label: "\u6700\u8FD1 90 \u5929" }
      ],
      ariaLabel: "\u8DDF\u8E2A\u8303\u56F4"
    }
  ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u53EA\u8DDF\u8E2A\u8FD9\u4E2A\u8303\u56F4\u5185\u6709\u6D3B\u52A8\u7684\u4F1A\u8BDD\uFF1B\u624B\u52A8\u6062\u590D\u6216\u56FA\u5B9A\u7684\u4F1A\u8BDD\u59CB\u7EC8\u4FDD\u7559\u3002\u4FEE\u6539\u8303\u56F4\u4E0D\u4F1A\u5220\u9664\u5DF2\u6709\u7D22\u5F15\u3002")), groups.length === 0 ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-error" }, "\u6CA1\u6709\u53EF\u7528\u7684\u6A21\u578B\u76EE\u5F55\uFF0C\u6A21\u578B\u8BBE\u7F6E\u6682\u65F6\u4E0D\u53EF\u7528\u3002") : null), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose }, "\u53D6\u6D88"), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn dra-btn-primary", type: "button", disabled: busy, onClick: save }, busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58")));
}
function HistoryModal({ ra, history, onOpenRA, onClose }) {
  const rows = history ?? [];
  return /* @__PURE__ */ import_react9.default.createElement(Mask, { onClose, label: "Router \u5386\u53F2" }, /* @__PURE__ */ import_react9.default.createElement(Head, { title: "\u6D3E\u53D1\u8BB0\u5F55", onClose }), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-detail-row", style: { marginTop: 0 } }, /* @__PURE__ */ import_react9.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-sm",
      type: "button",
      disabled: !ra?.sessionId,
      onClick: () => onOpenRA?.(ra.sessionId),
      title: ra?.sessionId ? "\u5728 DSH \u4E2D\u6253\u5F00 Router \u4F1A\u8BDD" : "\u8FD8\u6CA1\u6709 Router \u4F1A\u8BDD"
    },
    "\u6253\u5F00 RA \u4F1A\u8BDD"
  ), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-field-help" }, "\u53EA\u8BB0\u5F55 Router \u786E\u8BA4\u6216\u81EA\u52A8\u6267\u884C\u7684\u6D3E\u53D1\u3002")), rows.length === 0 ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help", style: { marginTop: 10 } }, "\u8FD8\u6CA1\u6709\u6D3E\u53D1\u8BB0\u5F55\u3002") : /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list", style: { marginTop: 10 } }, rows.map((row) => /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-row", key: row.id }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-grow" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-title" }, row.task), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-sub" }, actionLabel(row.action), " \xB7 ", row.targetTitle ?? row.targetSessionId ?? "\u65B0\u4F1A\u8BDD", " \xB7", " ", resultLabel(row.result), " \xB7 ", new Date(row.at).toLocaleString("zh-CN", { hour12: false })), row.reason ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-sub" }, "\u7406\u7531\uFF1A", row.reason) : null), row.mode === "auto" ? /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-badge", "data-tone": "warn" }, "\u81EA\u52A8") : null)))));
}
function UntrackedModal({ items, onRestore, onClose }) {
  const [selected, setSelected] = (0, import_react9.useState)(() => /* @__PURE__ */ new Set());
  const [busy, setBusy] = (0, import_react9.useState)(false);
  const list = items ?? [];
  const chosen = list.filter((item) => selected.has(item.sessionId));
  const allChecked = list.length > 0 && chosen.length === list.length;
  const toggle = (sessionId, checked) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(sessionId);
      else next.delete(sessionId);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(allChecked ? /* @__PURE__ */ new Set() : new Set(list.map((item) => item.sessionId)));
  };
  const restore = async () => {
    if (!chosen.length) return;
    setBusy(true);
    try {
      await onRestore?.(chosen.map((item) => item.sessionId));
      onClose?.();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react9.default.createElement(Mask, { onClose, label: "\u672A\u8DDF\u8E2A\u4F1A\u8BDD", className: "dra-modal-untracked" }, /* @__PURE__ */ import_react9.default.createElement(Head, { title: "\u672A\u8DDF\u8E2A\u4F1A\u8BDD", onClose }), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, list.length === 0 ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u6CA1\u6709\u672A\u8DDF\u8E2A\u7684\u4F1A\u8BDD\u3002") : /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list" }, list.map((item) => {
    const checked = selected.has(item.sessionId);
    return /* @__PURE__ */ import_react9.default.createElement("label", { className: "dra-list-row dra-check-row", "data-checked": checked ? "true" : "false", key: item.sessionId }, /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        type: "checkbox",
        className: "dra-check",
        checked,
        disabled: busy,
        onChange: (event) => toggle(item.sessionId, event.target.checked),
        "aria-label": `\u6062\u590D ${item.title}`
      }
    ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-grow" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-title" }, item.title), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-sub" }, item.reason === "stopped" ? "\u624B\u52A8\u505C\u6B62\u8DDF\u8E2A" : "\u4E00\u5468\u524D", " \xB7 \u6700\u540E\u6D3B\u8DC3 ", item.lastActiveLabel)));
  }))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react9.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-ghost dra-btn-sm",
      type: "button",
      disabled: busy || list.length === 0,
      onClick: toggleAll
    },
    allChecked ? "\u53D6\u6D88\u5168\u9009" : "\u5168\u9009"
  ), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-modal-count" }, "\u5DF2\u52FE\u9009 ", chosen.length, " / ", list.length), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose, disabled: busy }, "\u53D6\u6D88"), /* @__PURE__ */ import_react9.default.createElement(
    "button",
    {
      className: "dra-btn dra-btn-primary",
      type: "button",
      disabled: !chosen.length || busy,
      onClick: restore
    },
    busy ? "\u6062\u590D\u4E2D\u2026" : "\u6062\u590D\u6240\u9009"
  )));
}
function CompressModal({ session, onConfirm, onClose }) {
  const [busy, setBusy] = (0, import_react9.useState)(false);
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
  return /* @__PURE__ */ import_react9.default.createElement(Mask, { onClose, label: "\u538B\u7F29\u4E0A\u4E0B\u6587" }, /* @__PURE__ */ import_react9.default.createElement(Head, { title: "\u538B\u7F29\u4E0A\u4E0B\u6587", onClose }), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-title" }, session.title), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help", style: { marginTop: 6 } }, "\u5F53\u524D ", tokens2(session.context?.usedTokens), " / ", tokens2(session.context?.limitTokens), percent === null || percent === void 0 ? "" : `\uFF08${percent}%\uFF09`, "\u3002\u538B\u7F29\u4F1A\u8C03\u7528 DSH \u7684\u539F\u751F /compact\uFF0C \u53EA\u5F71\u54CD\u8BE5\u4F1A\u8BDD\u7684\u4E0A\u4E0B\u6587\uFF0C\u4E0D\u6539\u5199\u5386\u53F2\u4E8B\u4EF6\u3002")), session.running ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-error" }, "\u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C\uFF1B\u538B\u7F29\u9700\u8981\u7A7A\u95F2\u7684 Agent\u3002\u7B49\u672C\u8F6E\u7ED3\u675F\u540E\u518D\u8BD5\u3002") : null), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose }, "\u53D6\u6D88"), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn dra-btn-primary", type: "button", disabled: busy || session.running, onClick: confirm }, busy ? "\u538B\u7F29\u4E2D\u2026" : "\u786E\u8BA4\u538B\u7F29")));
}
function StopModal({ session, onConfirm, onClose }) {
  const [busy, setBusy] = (0, import_react9.useState)(false);
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
  return /* @__PURE__ */ import_react9.default.createElement(Mask, { onClose, label: "\u505C\u6B62\u8DDF\u8E2A\u4F1A\u8BDD" }, /* @__PURE__ */ import_react9.default.createElement(Head, { title: "\u505C\u6B62\u8DDF\u8E2A\u4F1A\u8BDD", onClose }), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-list-title" }, session.title), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help", style: { marginTop: 8 } }, "\u505C\u6B62\u8DDF\u8E2A\u540E\uFF0C\u5B83\u4F1A\u4ECE RA \u7684\u4E0A\u4E0B\u6587\u548C\u753B\u5E03\u4E2D\u79FB\u9664\uFF0C\u4F46\u4F1A\u8BDD\u672C\u8EAB\u4E0D\u4F1A\u88AB\u5220\u9664\u3002 \u5982\u679C\u5B83\u662F\u7236\u4F1A\u8BDD\uFF0C\u8DDF\u8E2A\u4E2D\u7684\u5B50\u4F1A\u8BDD\u4F1A\u79FB\u5230\u9876\u5C42\u7EE7\u7EED\u8DDF\u8E2A\uFF1B\u6062\u590D\u7236\u4F1A\u8BDD\u540E\u4F1A\u81EA\u52A8\u56DE\u6302\u3002 \u4E4B\u540E\u53EF\u4EE5\u5728\u201C\u672A\u8DDF\u8E2A\u4F1A\u8BDD\u201D\u91CC\u6062\u590D\u3002")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn", type: "button", onClick: onClose }, "\u53D6\u6D88"), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn dra-btn-danger", type: "button", disabled: busy, onClick: confirm }, busy ? "\u5904\u7406\u4E2D\u2026" : "\u505C\u6B62\u8DDF\u8E2A")));
}
function OnboardingOverlay({
  onboarding,
  currentTitle,
  trackingDays = 7,
  onStart,
  onSkip
}) {
  const [busy, setBusy] = (0, import_react9.useState)(false);
  if (!onboarding || onboarding.total === 0) return null;
  const start = async () => {
    setBusy(true);
    try {
      await onStart?.();
    } finally {
      setBusy(false);
    }
  };
  if (onboarding.status === "awaiting") {
    return /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-mask", style: { background: "color-mix(in srgb, #000 26%, transparent)" } }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal", style: { width: "min(460px, 100%)" } }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-head" }, /* @__PURE__ */ import_react9.default.createElement("span", null, "\u9996\u6B21\u63A5\u5165\uFF1A\u5EFA\u7ACB\u4F1A\u8BDD\u7D22\u5F15")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u5C06\u7D22\u5F15\u6700\u8FD1 ", trackingDays, " \u5929\u6709\u6D3B\u52A8\u7684 ", onboarding.total, " \u4E2A\u4F1A\u8BDD", onboarding.done > 0 ? `\uFF08\u5176\u4E2D ${onboarding.done} \u4E2A\u5DF2\u6709\u53EF\u7528\u7D22\u5F15\uFF09` : "", "\u3002 \u7D22\u5F15\u4F1A\u6309\u201C\u7D22\u5F15\u6A21\u578B\u201D\u8C03\u7528\u6A21\u578B\uFF0C\u4E4B\u540E\u65B0\u589E\u6216\u66F4\u65B0\u7684\u4F1A\u8BDD\u4F1A\u81EA\u52A8\u5237\u65B0\u3002"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help", style: { marginTop: 8 } }, "\u73B0\u5728\u5148\u8DEF\u7531\u4E5F\u53EF\u4EE5\uFF0C\u4F46 Router \u53EA\u80FD\u5148\u770B\u6807\u9898\uFF1B\u5EFA\u7ACB\u7D22\u5F15\u540E\u5224\u65AD\u4F1A\u66F4\u51C6\u3002")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-foot" }, /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn", type: "button", disabled: busy, onClick: () => onSkip?.() }, "\u7A0D\u540E"), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn dra-btn-primary", type: "button", disabled: busy, onClick: start }, busy ? "\u542F\u52A8\u4E2D\u2026" : "\u5F00\u59CB\u7D22\u5F15"))));
  }
  if (onboarding.status !== "running") return null;
  const percent = onboarding.total ? Math.round(onboarding.done / onboarding.total * 100) : 0;
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-mask", style: { background: "color-mix(in srgb, #000 26%, transparent)" } }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal", style: { width: "min(420px, 100%)" } }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-head" }, /* @__PURE__ */ import_react9.default.createElement("span", null, "\u6B63\u5728\u5EFA\u7ACB\u4F1A\u8BDD\u7D22\u5F15"), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spin" })), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-modal-body" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-field-help" }, "\u7D22\u5F15\u5B8C\u6210\u540E\u624D\u80FD\u7EE7\u7EED\u53D1\u9001\u4EFB\u52A1\uFF1B\u4E2D\u65AD\u540E\u53EF\u4EE5\u4ECE\u63D0\u793A\u6761\u7EE7\u7EED\u3002"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-progress", style: { marginTop: 12 } }, /* @__PURE__ */ import_react9.default.createElement("i", { style: { width: `${percent}%` } })), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-detail-row" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-detail-meta" }, onboarding.done, " / ", onboarding.total, currentTitle ? ` \xB7 ${currentTitle}` : ""), /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-spacer" }), onboarding.failed?.length ? /* @__PURE__ */ import_react9.default.createElement("span", { className: "dra-field-help", style: { color: "var(--dra-error)" } }, onboarding.failed.length, " \u4E2A\u5931\u8D25") : null))));
}
function IndexBanner({ onboarding, onStart }) {
  if (!onboarding || onboarding.total === 0) return null;
  const failed = onboarding.failed?.length ?? 0;
  const skipped = onboarding.status === "skipped";
  const failedRun = onboarding.status === "failed";
  const partial = onboarding.status === "complete" && failed > 0;
  if (!skipped && !failedRun && !partial) return null;
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-index-banner", role: "status" }, /* @__PURE__ */ import_react9.default.createElement("span", null, skipped ? "\u4F1A\u8BDD\u7D22\u5F15\u8FD8\u6CA1\u5EFA\u7ACB\uFF0CRouter \u76EE\u524D\u53EA\u80FD\u5148\u770B\u6807\u9898\u3002" : failedRun ? "\u7D22\u5F15\u4E2D\u65AD\uFF0C\u5C1A\u672A\u5B8C\u6210\u3002" : `${failed} \u4E2A\u4F1A\u8BDD\u7D22\u5F15\u5931\u8D25\uFF0C\u5931\u8D25\u9879\u4F1A\u9000\u56DE\u62BD\u53D6\u5F0F\u7D22\u5F15\u3002`), /* @__PURE__ */ import_react9.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", onClick: () => onStart?.(failedRun || partial ? "retry" : "start") }, skipped ? "\u5F00\u59CB\u7D22\u5F15" : "\u91CD\u8BD5"));
}
function Toast({ message }) {
  if (!message) return null;
  return /* @__PURE__ */ import_react9.default.createElement(
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
    /* @__PURE__ */ import_react9.default.createElement("div", { className: "dra-proposal-head" }, message)
  );
}
function modelValue(value) {
  return value?.provider && value?.model ? `${value.provider}|${value.model}` : "";
}
function modelGroups(groups) {
  return (groups ?? []).map((group) => ({
    label: group.name ?? group.id,
    options: (group.models ?? []).map((model) => ({
      value: `${group.id}|${model.id}`,
      label: model.name ?? model.id
    }))
  }));
}
function defaultModelValue(models) {
  const fallback = models?.default;
  const groups = models?.groups ?? [];
  if (!fallback?.provider || !fallback?.model) return "";
  const exact = groups.find((group2) => group2.id === fallback.provider);
  if (exact && (exact.models ?? []).some((model) => model.id === fallback.model)) {
    return `${exact.id}|${fallback.model}`;
  }
  const group = groups.find((item) => (item.models ?? []).some((model) => model.id === fallback.model));
  return group ? `${group.id}|${fallback.model}` : "";
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
    revised: "\u91CD\u65B0\u5224\u65AD",
    failed: "\u5931\u8D25",
    asked: "\u5DF2\u8FFD\u95EE"
  }[result] ?? result;
}

// src/client/RouterPanel.jsx
var POLL_MS = 2200;
function fitReserve(composerTop, pending) {
  if (composerTop > 0) return composerTop + 12;
  return pending ? 390 : 230;
}
function RouterPanel({ openSession }) {
  const [data, setData] = (0, import_react10.useState)(null);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [error, setError] = (0, import_react10.useState)(null);
  const [project, setProject] = (0, import_react10.useState)(null);
  const [search, setSearch] = (0, import_react10.useState)("");
  const [task, setTask] = (0, import_react10.useState)("");
  const [mode, setMode] = (0, import_react10.useState)("standard");
  const [permissions, setPermissions] = (0, import_react10.useState)("workspace-write");
  const [auto, setAuto] = (0, import_react10.useState)(false);
  const [busy, setBusy] = (0, import_react10.useState)(false);
  const [selectedId, setSelectedId] = (0, import_react10.useState)(null);
  const [modal, setModal] = (0, import_react10.useState)(null);
  const [toast, setToast] = (0, import_react10.useState)(null);
  const [view, setView] = (0, import_react10.useState)({ x: 0, y: 0, z: 1 });
  const [viewport, setViewport] = (0, import_react10.useState)({ width: 900, height: 700 });
  const [newIds, setNewIds] = (0, import_react10.useState)(() => /* @__PURE__ */ new Set());
  const [composerTop, setComposerTop] = (0, import_react10.useState)(0);
  const [raIssue, setRaIssue] = (0, import_react10.useState)(null);
  const [clock, setClock] = (0, import_react10.useState)(Date.now());
  const viewportRef = (0, import_react10.useRef)(viewport);
  viewportRef.current = viewport;
  const panelRef = (0, import_react10.useRef)(null);
  const composerRef = (0, import_react10.useRef)(null);
  const composerTopRef = (0, import_react10.useRef)(0);
  composerTopRef.current = composerTop;
  const dataRef = (0, import_react10.useRef)(data);
  dataRef.current = data;
  const historySeen = (0, import_react10.useRef)(/* @__PURE__ */ new Set());
  const composerProject = (0, import_react10.useRef)(null);
  const fitKey = (0, import_react10.useRef)("");
  const lastFit = (0, import_react10.useRef)(null);
  const timerRef = (0, import_react10.useRef)(0);
  const pendingTokens = (0, import_react10.useRef)(/* @__PURE__ */ new Map());
  const pendingProject = (0, import_react10.useRef)(null);
  const settledTokens = (0, import_react10.useRef)(/* @__PURE__ */ new Set());
  const refresh = (0, import_react10.useCallback)(
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
  (0, import_react10.useEffect)(() => {
    refresh(false);
  }, [refresh]);
  (0, import_react10.useEffect)(() => {
    timerRef.current = window.setInterval(() => refresh(true), POLL_MS);
    return () => window.clearInterval(timerRef.current);
  }, [refresh]);
  (0, import_react10.useEffect)(() => {
    if (!toast) return void 0;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  (0, import_react10.useEffect)(() => {
    const composer = data?.settings?.composer;
    const key = data?.selectedProject?.project;
    if (!composer || !key || composerProject.current === key) return;
    composerProject.current = key;
    setMode(composer.mode);
    setPermissions(
      composer.permissions === "danger-full-access" ? "danger-full-access" : "workspace-write"
    );
    setAuto(!!composer.auto);
  }, [data?.settings?.composer, data?.selectedProject?.project]);
  const tree = data?.tree ?? { sessions: [], edges: [], roots: [], trackedCount: 0 };
  const layoutMode = data?.settings?.layout === "horizontal" ? "horizontal" : "vertical";
  const layout = (0, import_react10.useMemo)(() => buildLayout(tree.sessions, layoutMode), [tree.sessions, layoutMode]);
  const selected = (0, import_react10.useMemo)(
    () => tree.sessions.find((row) => row.sessionId === selectedId) ?? null,
    [tree.sessions, selectedId]
  );
  const pendingList = data?.pending ?? [];
  const pending = pendingList[0] ?? null;
  const pendingIds = (0, import_react10.useMemo)(
    () => new Set(pendingList.map((item) => item.targetSessionId).filter(Boolean)),
    [pendingList]
  );
  const layoutRef = (0, import_react10.useRef)(layout);
  layoutRef.current = layout;
  const pendingRef = (0, import_react10.useRef)(pending);
  pendingRef.current = pending;
  const onboarding = data?.onboarding;
  const onboardingRunning = onboarding?.status === "running";
  const raRunning = !!data?.ra?.running;
  const disabled = onboardingRunning || raRunning || !data?.selectedProject;
  const disabledReason = onboardingRunning ? `\u9996\u6B21\u63A5\u5165\u7D22\u5F15\u8FDB\u884C\u4E2D\uFF08${onboarding.done}/${onboarding.total}\uFF09\uFF0C\u5B8C\u6210\u540E\u624D\u80FD\u8DEF\u7531\u3002` : raRunning ? "Router \u6B63\u5728\u5224\u65AD\u4E0A\u4E00\u4E2A\u4EFB\u52A1\uFF1B\u5B8C\u6210\u540E\u53EF\u4EE5\u7EE7\u7EED\u53D1\u9001\u3002" : !data?.selectedProject ? "\u8FD8\u6CA1\u6709\u53EF\u8DEF\u7531\u7684\u9879\u76EE\u4F1A\u8BDD\u3002" : "";
  const measureComposer = (0, import_react10.useCallback)(() => {
    const panel = panelRef.current;
    const composer = composerRef.current;
    if (!panel || !composer) return;
    const next = Math.max(0, Math.round(panel.getBoundingClientRect().bottom - composer.getBoundingClientRect().top));
    setComposerTop((current) => Math.abs(current - next) > 1 ? next : current);
  }, []);
  (0, import_react10.useEffect)(() => {
    const element = composerRef.current;
    if (!element) return void 0;
    const observer = new ResizeObserver(measureComposer);
    observer.observe(element);
    measureComposer();
    return () => observer.disconnect();
  }, [measureComposer]);
  (0, import_react10.useEffect)(() => {
    if (!data?.selectedProject || layout.nodes.length === 0) return;
    const key = `${data.selectedProject.project}|${layoutMode}`;
    if (fitKey.current === key) return;
    fitKey.current = key;
    const fitted = fitSelection(layout, viewportRef.current, layoutMode, {
      bottomReserve: fitReserve(composerTopRef.current, pending)
    });
    lastFit.current = fitted;
    setView(fitted);
  }, [data?.selectedProject, layoutMode, layout.nodes.length, pending]);
  const handleViewport = (0, import_react10.useCallback)(
    (next) => {
      setViewport(next);
      measureComposer();
      setView((current) => {
        const fitted = lastFit.current;
        if (fitted && Math.abs(current.x - fitted.x) < 1 && Math.abs(current.y - fitted.y) < 1 && Math.abs(current.z - fitted.z) < 1e-3) {
          const replacement = fitSelection(layoutRef.current, next, layoutMode, {
            bottomReserve: fitReserve(composerTopRef.current, pendingRef.current)
          });
          lastFit.current = replacement;
          return replacement;
        }
        return current;
      });
    },
    [layoutMode, measureComposer]
  );
  (0, import_react10.useEffect)(() => {
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
  (0, import_react10.useEffect)(() => {
    const list = data?.pending ?? [];
    const projectKey = data?.selectedProject?.project ?? null;
    const current = new Map(list.map((proposal) => [proposal.token, proposal]));
    if (pendingProject.current !== projectKey) {
      pendingProject.current = projectKey;
      pendingTokens.current = current;
      return;
    }
    for (const [token, proposal] of pendingTokens.current) {
      if (current.has(token) || settledTokens.current.has(token)) continue;
      if (proposal.project && projectKey && proposal.project !== projectKey) continue;
      if (proposal.task) {
        setTask((value) => value.trim() ? value : proposal.task);
        setToast("\u63D0\u8BAE\u5DF2\u5931\u6548\uFF0C\u4EFB\u52A1\u5DF2\u56DE\u5230\u8F93\u5165\u6846\u3002");
      }
    }
    pendingTokens.current = current;
  }, [data?.pending, data?.selectedProject?.project, setTask]);
  (0, import_react10.useEffect)(() => {
    const task2 = data?.ra?.task ?? null;
    const running = !!data?.ra?.running;
    const hasPending = (data?.pending ?? []).length > 0;
    if (!task2 || hasPending) {
      setRaIssue((current) => current ? null : current);
      return;
    }
    if (running) {
      setRaIssue((current) => current ? null : current);
      return;
    }
    if (Date.now() - Number(task2.at || 0) < 8e3) {
      setRaIssue((current) => current ? null : current);
      return;
    }
    setRaIssue(
      (current) => current?.kind === "no-proposal" && current.task?.at === task2.at ? current : { kind: "no-proposal", task: task2 }
    );
  }, [data?.ra?.task, data?.ra?.running, data?.pending]);
  (0, import_react10.useEffect)(() => {
    if (!raRunning) return void 0;
    const timer = window.setInterval(() => setClock(Date.now()), 1e3);
    return () => window.clearInterval(timer);
  }, [raRunning]);
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
  const manualSend = async (action, atSeq) => {
    const text = task.trim();
    if (!text || !selected || disabled) return;
    try {
      await run(
        () => apiOp("manual", {
          project: data.selectedProject.project,
          task: text,
          action,
          targetSessionId: action === "new" ? null : selected.sessionId,
          atSeq: action === "fork" ? atSeq : null,
          composer: { mode, permissions, auto: false }
        }),
        "\u5DF2\u751F\u6210\u5F85\u786E\u8BA4\u63D0\u8BAE\u3002"
      );
      setTask("");
    } catch {
    }
  };
  const confirm = async (proposal) => {
    try {
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
      }, "\u5DF2\u786E\u8BA4\u5E76\u53D1\u9001\u3002");
      settledTokens.current.add(proposal.token);
    } catch {
      if (proposal.task) setTask((value) => value.trim() ? value : proposal.task);
    }
  };
  const choose = async (proposal, atSeq) => {
    await run(
      () => apiOp("choose", { project: data.selectedProject.project, token: proposal.token, atSeq }),
      "\u5206\u53C9\u70B9\u5DF2\u66F4\u65B0\u3002"
    ).catch(() => {
    });
  };
  const abandon = async (proposal) => {
    try {
      await run(
        () => apiOp("abandon", { project: data.selectedProject.project, token: proposal.token }),
        "\u63D0\u8BAE\u5DF2\u53D6\u6D88\uFF0C\u4EFB\u52A1\u5DF2\u56DE\u5230\u8F93\u5165\u6846\u3002"
      );
      settledTokens.current.add(proposal.token);
      if (proposal.task) setTask((value) => value.trim() ? value : proposal.task);
    } catch {
    }
  };
  const answer = async (proposal, value) => {
    try {
      await run(
        () => apiOp("answer", { project: data.selectedProject.project, token: proposal.token, answer: value }),
        "\u5DF2\u56DE\u7B54 Router\u3002"
      );
      settledTokens.current.add(proposal.token);
    } catch {
    }
  };
  const retry = async (proposal, note) => {
    try {
      await run(
        () => apiOp("retry", { project: data.selectedProject.project, token: proposal.token, note }),
        note ? "\u5DF2\u5E26\u7740\u7EA0\u6B63\u4EA4\u7ED9 Router \u91CD\u65B0\u5224\u65AD\u3002" : "\u5DF2\u8BF7 Router \u91CD\u65B0\u5224\u65AD\u3002"
      );
      settledTokens.current.add(proposal.token);
    } catch {
    }
  };
  const retarget = async (proposal, sessionId) => {
    await run(
      () => apiOp("retarget", { project: data.selectedProject.project, token: proposal.token, sessionId }),
      "\u76EE\u6807\u5DF2\u66F4\u65B0\u3002"
    ).catch(() => {
    });
  };
  const cancelTask = async () => {
    await run(
      () => apiOp("cancelTask", { project: data.selectedProject.project }),
      "\u5DF2\u53D6\u6D88 Router \u7684\u5224\u65AD\u3002"
    ).catch(() => {
    });
    setRaIssue(null);
  };
  const retryTask = async () => {
    const failed = raIssue?.task;
    if (!failed?.task) return;
    setRaIssue(null);
    await run(
      () => apiOp("ask", {
        project: data.selectedProject.project,
        task: failed.task,
        composer: failed.composer ?? { mode, permissions, auto }
      }),
      "\u5DF2\u91CD\u65B0\u4EA4\u7ED9 Router\u3002"
    ).catch(() => {
    });
  };
  const startIndex = async (action = "start") => {
    await run(
      () => apiOp("onboarding", { project: data.selectedProject.project, action }),
      action === "retry" ? "\u6B63\u5728\u91CD\u8BD5\u7D22\u5F15\u2026" : "\u6B63\u5728\u5EFA\u7ACB\u4F1A\u8BDD\u7D22\u5F15\u2026"
    ).catch(() => {
    });
  };
  const skipIndex = async () => {
    await run(
      () => apiOp("onboarding", { project: data.selectedProject.project, action: "skip" }),
      "\u7A0D\u540E\u53EF\u4ECE\u753B\u5E03\u4E0A\u65B9\u7684\u63D0\u793A\u6761\u5F00\u59CB\u7D22\u5F15\u3002"
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
  const restoreMany = async (ids) => {
    const list = Array.isArray(ids) ? ids : [];
    if (!list.length) return;
    await run(async () => {
      for (const sessionId of list) {
        await apiOp("restore", { project: data.selectedProject.project, sessionId });
      }
    }, list.length === 1 ? "\u5DF2\u6062\u590D\u8DDF\u8E2A\u3002" : `\u5DF2\u6062\u590D ${list.length} \u4E2A\u4F1A\u8BDD\u3002`);
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
    const reserve = fitReserve(composerTopRef.current, pending);
    const z = clamp(
      Math.min((width - 60) / Math.max(1, bounds.width), (height - reserve) / Math.max(1, bounds.height)),
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
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra", ref: panelRef, style: { "--dra-composer-top": `${composerTop}px` } }, /* @__PURE__ */ import_react10.default.createElement("header", { className: "dra-header" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-brand" }, /* @__PURE__ */ import_react10.default.createElement(RouterIcon, null), /* @__PURE__ */ import_react10.default.createElement("span", null, "Router")), /* @__PURE__ */ import_react10.default.createElement(
    Select,
    {
      className: "dra-project",
      value: data?.selectedProject?.project ?? "",
      onChange: (next) => {
        setProject(next);
        setSelectedId(null);
        fitKey.current = "";
      },
      options: (data?.projects ?? []).map((row) => ({
        value: row.project,
        label: `${row.name} \xB7 ${row.sessions} \u4F1A\u8BDD \xB7 ${row.tracked ?? 0} \u8DDF\u8E2A`
      })),
      placeholder: (data?.projects ?? []).length === 0 ? "\u65E0\u9879\u76EE" : "\u9009\u62E9\u9879\u76EE",
      disabled: (data?.projects ?? []).length === 0,
      ariaLabel: "\u9879\u76EE",
      title: data?.selectedProject?.project ?? "\u9009\u62E9\u4E00\u4E2A\u9879\u76EE",
      menuMinWidth: 260
    }
  ), /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-search" }, /* @__PURE__ */ import_react10.default.createElement(SearchIcon, { width: 14, height: 14 }), /* @__PURE__ */ import_react10.default.createElement(
    "input",
    {
      value: search,
      onChange: (event) => setSearch(event.target.value),
      onKeyDown: onSearchKey,
      placeholder: "\u641C\u7D22\u4F1A\u8BDD",
      "aria-label": "\u641C\u7D22\u4F1A\u8BDD"
    }
  )), /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-head-actions" }, /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u6D3E\u53D1\u8BB0\u5F55", onClick: () => setModal("history") }, /* @__PURE__ */ import_react10.default.createElement(HistoryIcon, null)), /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "Router \u8BBE\u7F6E", onClick: () => setModal("settings") }, /* @__PURE__ */ import_react10.default.createElement(SettingsIcon, null)), /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-icon-btn", type: "button", title: "\u672A\u8DDF\u8E2A\u4F1A\u8BDD", onClick: () => setModal("untracked") }, /* @__PURE__ */ import_react10.default.createElement(MoreIcon, null)))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-body" }, error ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-error", role: "alert" }, /* @__PURE__ */ import_react10.default.createElement("span", null, error.message), /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", onClick: () => refresh(false) }, "\u91CD\u8BD5")) : null, /* @__PURE__ */ import_react10.default.createElement(IndexBanner, { onboarding, onStart: startIndex }), layout.nodes.length > 0 ? /* @__PURE__ */ import_react10.default.createElement(
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
      onViewportChange: handleViewport,
      onFit: fitAll,
      onLatest: latest
    }
  ) : /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-empty" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, loading ? "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" : data?.selectedProject ? "\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u53EF\u8DDF\u8E2A\u7684\u4F1A\u8BDD" : "\u8FD8\u6CA1\u6709\u9879\u76EE"), /* @__PURE__ */ import_react10.default.createElement("p", null, data?.selectedProject ? `\u53EA\u8DDF\u8E2A\u6700\u8FD1 ${data?.settings?.trackingDays ?? 7} \u5929\u6709\u6D3B\u52A8\u7684\u4F1A\u8BDD\u3002\u53EF\u4EE5\u53BB\u201C\u672A\u8DDF\u8E2A\u4F1A\u8BDD\u201D\u6062\u590D\u66F4\u65E9\u7684\u4F1A\u8BDD\uFF0C\u6216\u5148\u5728 DSH \u4E2D\u7EE7\u7EED\u4E00\u4E2A\u4F1A\u8BDD\u3002` : "\u5148\u5728 DSH \u4E2D\u6253\u5F00\u4E00\u4E2A\u9879\u76EE\u5E76\u521B\u5EFA\u4F1A\u8BDD\u3002")), selected ? /* @__PURE__ */ import_react10.default.createElement(
    Detail,
    {
      session: selected,
      onOpen: (id) => openSession?.(id),
      onCompress: (session) => setModal({ type: "compress", session }),
      onStop: (session) => setModal({ type: "stop", session }),
      onRename: rename,
      onClose: () => setSelectedId(null),
      canCompress: data?.probe?.compact !== false
    }
  ) : null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-composer-wrap", ref: composerRef }, pendingList.length > 0 ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-proposals" }, pendingList.map((proposal, index) => {
    const target = proposal.targetSessionId ? tree.sessions.find((row) => row.sessionId === proposal.targetSessionId) ?? null : null;
    return /* @__PURE__ */ import_react10.default.createElement(
      ProposalCard,
      {
        key: proposal.token,
        proposal,
        target,
        sessions: tree.sessions,
        index,
        total: pendingList.length,
        busy,
        onConfirm: confirm,
        onChoose: choose,
        onAbandon: abandon,
        onAnswer: answer,
        onRetry: retry,
        onRetarget: retarget
      }
    );
  })) : data?.ra?.running ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-proposal" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-proposal-head" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "dra-spin" }), /* @__PURE__ */ import_react10.default.createElement("span", null, "Router \u6B63\u5728\u67E5\u770B\u4F1A\u8BDD\u5E76\u5224\u65AD\u2026", data?.ra?.task?.at ? ` ${Math.max(0, Math.floor((clock - Number(data.ra.task.at)) / 1e3))}s` : ""), /* @__PURE__ */ import_react10.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", disabled: busy, onClick: cancelTask }, "\u53D6\u6D88")), data?.ra?.task?.at && clock - Number(data.ra.task.at) > 6e4 ? /* @__PURE__ */ import_react10.default.createElement("p", { className: "dra-proposal-reason" }, "\u5DF2\u7ECF\u8D85\u8FC7 60 \u79D2\u3002\u53EF\u4EE5\u7EE7\u7EED\u7B49\uFF0C\u6216\u53D6\u6D88\u540E\u624B\u52A8\u6307\u5B9A\u76EE\u6807\u3002") : null) : raIssue ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-proposal", "data-issue": "true" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-proposal-head" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "dra-badge", "data-tone": "warn" }, "Router \u672A\u5B8C\u6210"), /* @__PURE__ */ import_react10.default.createElement("span", null, "\u6CA1\u6709\u751F\u6210\u5F85\u786E\u8BA4\u63D0\u8BAE")), /* @__PURE__ */ import_react10.default.createElement("p", { className: "dra-proposal-reason" }, "\u8FD9\u4E00\u8F6E\u5DF2\u7ECF\u7ED3\u675F\uFF0C\u4F46\u6CA1\u6709\u63D0\u4EA4\u63D0\u8BAE\u3002\u53EF\u80FD\u662F\u6A21\u578B\u4E0D\u652F\u6301\u5DE5\u5177\u8C03\u7528\u3001\u8D85\u65F6\u6216\u5224\u65AD\u5931\u8D25\u3002 \u53EF\u4EE5\u91CD\u8BD5\u3001\u6362\u4E00\u4E2A Router \u6A21\u578B\uFF0C\u6216\u9009\u4E2D\u753B\u5E03\u8282\u70B9\u540E\u624B\u52A8\u6D3E\u53D1\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "dra-proposal-actions" }, /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-btn dra-btn-primary dra-btn-sm", type: "button", disabled: busy, onClick: retryTask }, "\u91CD\u65B0\u5224\u65AD"), /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-btn dra-btn-sm", type: "button", onClick: () => setModal("settings") }, "\u6362 Router \u6A21\u578B"), /* @__PURE__ */ import_react10.default.createElement("span", { className: "dra-spacer" }), /* @__PURE__ */ import_react10.default.createElement("button", { className: "dra-btn dra-btn-ghost dra-btn-sm", type: "button", disabled: busy, onClick: cancelTask }, "\u53D6\u6D88\u4EFB\u52A1"))) : null, /* @__PURE__ */ import_react10.default.createElement(
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
      onManualSend: manualSend,
      manualTarget: selected,
      onClearTarget: () => setSelectedId(null),
      planAvailable: data?.probe?.planMode !== false,
      permissionAvailable: data?.probe?.permissionPresets !== false
    }
  )), /* @__PURE__ */ import_react10.default.createElement(
    OnboardingOverlay,
    {
      onboarding,
      currentTitle,
      trackingDays: data?.settings?.trackingDays ?? 7,
      onStart: () => startIndex("start"),
      onSkip: skipIndex
    }
  ), /* @__PURE__ */ import_react10.default.createElement(Toast, { message: toast })), modal === "settings" ? /* @__PURE__ */ import_react10.default.createElement(
    SettingsModal,
    {
      settings: data?.settings,
      models: data?.models,
      onSave: saveSettings,
      onClose: () => setModal(null)
    }
  ) : null, modal === "history" ? /* @__PURE__ */ import_react10.default.createElement(
    HistoryModal,
    {
      ra: data?.ra,
      history: data?.history,
      onOpenRA: (id) => {
        setModal(null);
        openSession?.(id);
      },
      onClose: () => setModal(null)
    }
  ) : null, modal === "untracked" ? /* @__PURE__ */ import_react10.default.createElement(
    UntrackedModal,
    {
      items: data?.untracked ?? [],
      onRestore: restoreMany,
      onClose: () => setModal(null)
    }
  ) : null, modal?.type === "compress" ? /* @__PURE__ */ import_react10.default.createElement(
    CompressModal,
    {
      session: modal.session,
      onConfirm: compress,
      onClose: () => setModal(null)
    }
  ) : null, modal?.type === "stop" ? /* @__PURE__ */ import_react10.default.createElement(
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
  font-size: 13px;
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
  font-size: 15px;
  letter-spacing: .1px;
  white-space: nowrap;
}
.dra-brand svg { color: var(--dra-accent); }
.dra-header .dra-project {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 320px;
  flex: 0 0 auto;
}
.dra-project .dra-select-trigger {
  height: 30px;
  padding: 0 27px 0 10px;
  border-radius: 9px;
  background: var(--dra-layer);
  font-size: 13px;
  font-weight: 550;
}
.dra-project .dra-select-value { max-width: 250px; }
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
  font-size: 13px;
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
  display: flex;
  flex-direction: column;
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
  font-size: 13.5px;
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
  margin-top: auto;
  padding-top: 7px;
  color: var(--dra-text-3);
  font-size: 12px;
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
.dra-ctx[data-level="warn"] .dra-ctx-bar > i,
.dra-ctx-bar[data-level="warn"] > i { background: var(--dra-warn); }
.dra-ctx[data-level="high"] .dra-ctx-bar > i,
.dra-ctx-bar[data-level="high"] > i { background: var(--dra-error); }
.dra-ctx-text { font-size: 11.5px; color: var(--dra-text-2); font-variant-numeric: tabular-nums; }
.dra-ring {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
}
.dra-ring svg { display: block; }
.dra-ring-track {
  fill: none;
  stroke: color-mix(in srgb, var(--dra-text-3) 30%, transparent);
  stroke-width: 2.6;
}
.dra-ring-fill {
  fill: none;
  stroke: var(--dra-ok);
  stroke-width: 2.6;
  stroke-linecap: round;
  transition: stroke-dashoffset .3s ease;
}
.dra-ring[data-level="warn"] .dra-ring-fill { stroke: var(--dra-warn); }
.dra-ring[data-level="high"] .dra-ring-fill { stroke: var(--dra-error); }
.dra-ring[data-known="false"] { opacity: .48; }

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
.dra-detail-title { flex: 1 1 auto; font-size: 14.5px; font-weight: 650; line-height: 1.35; }
.dra-detail-meta { margin-top: 5px; color: var(--dra-text-3); font-size: 12px; }
.dra-detail-section { margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--dra-border); }
.dra-detail-label { color: var(--dra-text-3); font-size: 11.5px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; }
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
  font-size: 12.5px;
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
.dra-btn-sm { height: 26px; padding: 0 9px; font-size: 12px; border-radius: 7px; }

/* Custom dropdown: the closed trigger and the open list share one type scale
   and theme, unlike the OS-drawn native <select> popup. */
.dra-select {
  position: relative;
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  vertical-align: middle;
}
.dra-select-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 0 27px 0 10px;
  border: 1px solid var(--dra-border);
  border-radius: 8px;
  background: var(--dra-layer-3);
  color: var(--dra-text);
  font-size: 13px;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.dra-select-trigger:hover { border-color: var(--dra-border-strong); }
.dra-select-trigger:focus-visible {
  outline: 0;
  border-color: color-mix(in srgb, var(--dra-accent) 55%, var(--dra-border));
  box-shadow: 0 0 0 3px var(--dra-accent-soft);
}
.dra-select-trigger[aria-expanded="true"] {
  border-color: color-mix(in srgb, var(--dra-accent) 55%, var(--dra-border));
  box-shadow: 0 0 0 3px var(--dra-accent-soft);
}
.dra-select-trigger:disabled { opacity: .5; cursor: not-allowed; }
.dra-select-value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dra-caret {
  position: absolute;
  right: 9px;
  top: 50%;
  width: 10px;
  height: 10px;
  color: var(--dra-text-3);
  transform: translateY(-50%);
  transition: transform .15s, color .15s;
  pointer-events: none;
}
.dra-select-trigger[aria-expanded="true"] .dra-caret {
  color: var(--dra-text-2);
  transform: translateY(-50%) rotate(180deg);
}
.dra-select-pop {
  position: absolute;
  z-index: 45;
  padding: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--dra-border-strong);
  border-radius: 10px;
  background: var(--dra-layer);
  box-shadow: var(--dra-shadow);
  animation: dra-pop-in .12s ease-out;
}
@keyframes dra-pop-in {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: none; }
}
.dra-select-group {
  padding: 6px 8px 3px;
  color: var(--dra-text-3);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: .2px;
}
.dra-select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--dra-text);
  font-size: 13px;
  line-height: 1.35;
  cursor: pointer;
  user-select: none;
}
.dra-select-option-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dra-select-option[data-active="true"] { background: color-mix(in srgb, var(--dra-text) 7%, transparent); }
.dra-select-option[data-selected="true"] {
  background: var(--dra-accent-soft);
  color: var(--dra-accent);
  font-weight: 600;
}
.dra-select-option[data-selected="true"][data-active="true"] {
  background: color-mix(in srgb, var(--dra-accent) 22%, transparent);
}
.dra-select-option[data-disabled="true"] { opacity: .42; cursor: not-allowed; }
.dra-select-check { flex: 0 0 auto; color: var(--dra-accent); font-size: 12px; }

.dra-tip-anchor { display: inline-flex; min-width: 0; }
.dra-tip {
  position: absolute;
  z-index: 46;
  width: max-content;
  max-width: min(280px, calc(100% - 16px));
  padding: 6px 9px;
  border: 1px solid var(--dra-border-strong);
  border-radius: 7px;
  background: var(--dra-layer);
  box-shadow: 0 6px 18px rgba(0,0,0,.2);
  color: var(--dra-text);
  font-size: 11.5px;
  line-height: 1.45;
  text-align: center;
  transform: translate(-50%, -100%);
  pointer-events: none;
  animation: dra-tip-in .12s ease-out;
}
.dra-tip::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  background: var(--dra-layer);
  border-right: 1px solid var(--dra-border-strong);
  border-bottom: 1px solid var(--dra-border-strong);
  transform: rotate(45deg);
}
@keyframes dra-tip-in {
  from { opacity: 0; transform: translate(-50%, calc(-100% + 4px)); }
  to { opacity: 1; transform: translate(-50%, -100%); }
}

.dra-input {
  height: 30px;
  min-width: 0;
  padding: 0 9px;
  border: 1px solid var(--dra-border);
  border-radius: 8px;
  outline: 0;
  background: var(--dra-layer-3);
  color: var(--dra-text);
  font-size: 13px;
}
.dra-input:focus {
  border-color: color-mix(in srgb, var(--dra-accent) 55%, var(--dra-border));
  box-shadow: 0 0 0 3px var(--dra-accent-soft);
}
.dra-proposal-actions .dra-input { width: 150px; }

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
.dra-empty h3 { margin: 0; font-size: 16px; font-weight: 650; color: var(--dra-text); }
.dra-empty p { margin: 0; max-width: 380px; font-size: 13px; line-height: 1.6; color: var(--dra-text-3); }
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
  font-size: 11px;
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
.dra-manual {
  padding: 8px 10px 7px;
  border-bottom: 1px solid var(--dra-border);
  background: color-mix(in srgb, var(--dra-accent) 7%, transparent);
}
.dra-manual-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.dra-manual-head .dra-spacer { flex: 1 1 auto; }
.dra-manual-label {
  color: var(--dra-accent);
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: .3px;
  white-space: nowrap;
}
.dra-manual-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dra-text);
  font-size: 12.5px;
  font-weight: 600;
}
.dra-manual-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dra-text-3);
  font-size: 15px;
  line-height: 1;
}
.dra-manual-clear:hover { background: var(--dra-layer-3); color: var(--dra-text); }
.dra-manual-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  min-width: 0;
}
.dra-seg {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--dra-border);
  border-radius: 8px;
  background: var(--dra-layer);
}
.dra-seg-btn {
  height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dra-text-3);
  font-size: 12px;
}
.dra-seg-btn:hover:not(:disabled) { color: var(--dra-text); }
.dra-seg-btn[data-active="true"] {
  background: var(--dra-layer-3);
  color: var(--dra-text);
  box-shadow: 0 1px 2px rgba(0,0,0,.12);
}
.dra-seg-btn:disabled { opacity: .4; }
.dra-fork-select { flex: 1 1 auto; min-width: 0; }
.dra-fork-select .dra-select-trigger { height: 28px; }
.dra-manual-hint { color: var(--dra-text-3); font-size: 11.5px; white-space: nowrap; }
.dra-composer textarea {
  display: block;
  width: 100%;
  min-height: 88px;
  max-height: 220px;
  padding: 12px 13px 8px;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  color: var(--dra-text);
  font-size: 13.5px;
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
.dra-composer-bar .dra-select { flex: 0 0 auto; }
.dra-composer-bar .dra-select-trigger {
  height: 28px;
  background: var(--dra-layer);
}
.dra-operation-select .dra-select-trigger { min-width: 124px; }
.dra-auto {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 7px;
  border-radius: 7px;
  color: var(--dra-text-2);
  font-size: 12px;
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
.dra-auto[data-manual="true"] { opacity: .45; cursor: not-allowed; }
.dra-auto[data-manual="true"] .dra-switch { background: color-mix(in srgb, var(--dra-text-3) 24%, transparent); }

.dra-proposal {
  margin-bottom: 8px;
  padding: 11px 12px;
  border: 1px solid color-mix(in srgb, var(--dra-accent) 36%, var(--dra-border));
  border-radius: 12px;
  background: color-mix(in srgb, var(--dra-layer) 96%, var(--dra-accent) 3%);
  box-shadow: 0 8px 26px rgba(0,0,0,.18);
}
.dra-proposal[data-auto="true"] { border-color: color-mix(in srgb, var(--dra-warn) 42%, var(--dra-border)); }
.dra-proposal[data-issue="true"] { border-color: color-mix(in srgb, var(--dra-warn) 48%, var(--dra-border)); }
.dra-proposal-head { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 650; }
.dra-proposal-head .dra-spacer { flex: 1 1 auto; }
.dra-badge {
  display: inline-flex;
  align-items: center;
  height: 19px;
  padding: 0 6px;
  border-radius: 5px;
  background: var(--dra-accent-soft);
  color: var(--dra-accent);
  font-size: 10.5px;
  font-weight: 600;
}
.dra-badge[data-tone="warn"] { background: color-mix(in srgb, var(--dra-warn) 16%, transparent); color: var(--dra-warn); }
.dra-queue-badge { background: var(--dra-layer-3); color: var(--dra-text-3); font-variant-numeric: tabular-nums; }
.dra-proposal-task {
  margin: 7px 0 0;
  padding: 7px 9px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dra-layer-3) 72%, transparent);
  color: var(--dra-text-2);
  font-size: 12.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dra-proposal-reason { margin: 7px 0 0; color: var(--dra-text-2); font-size: 12.5px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.dra-proposal-target { margin-top: 7px; color: var(--dra-text-3); font-size: 12px; }
.dra-proposal-row { display: flex; align-items: center; gap: 7px; margin-top: 8px; }
.dra-proposal-row .dra-input { flex: 1 1 auto; min-width: 0; }
.dra-proposal-actions { display: flex; align-items: center; gap: 7px; margin-top: 10px; }
.dra-proposal-actions .dra-spacer { flex: 1 1 auto; }

.dra-index-banner {
  position: absolute;
  z-index: 6;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(560px, calc(100% - 24px));
  padding: 8px 9px 8px 12px;
  border: 1px solid var(--dra-border-strong);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dra-layer) 96%, var(--dra-bg));
  box-shadow: 0 6px 20px rgba(0,0,0,.14);
  color: var(--dra-text-2);
  font-size: 12.5px;
  line-height: 1.45;
}

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
  max-height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dra-border-strong);
  border-radius: 14px;
  background: var(--dra-layer);
  box-shadow: var(--dra-shadow);
}
.dra-modal-untracked {
  /* Many older sessions must not grow the dialog to the full panel height. */
  max-height: min(560px, calc(100% - 40px));
}
.dra-modal-head {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
  padding: 13px 14px;
  border-bottom: 1px solid var(--dra-border);
  font-size: 14px;
  font-weight: 650;
}
.dra-modal-head .dra-spacer { flex: 1 1 auto; }
.dra-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 13px 14px;
}
.dra-modal-foot {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
  padding: 11px 14px;
  border-top: 1px solid var(--dra-border);
}
.dra-modal-foot .dra-spacer { flex: 1 1 auto; }
.dra-modal-count { color: var(--dra-text-3); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dra-field { margin-bottom: 13px; }
.dra-field:last-child { margin-bottom: 0; }
.dra-field label { display: block; margin-bottom: 6px; color: var(--dra-text-2); font-size: 12px; font-weight: 600; }
.dra-field .dra-select { width: 100%; display: flex; }
.dra-field-help { margin-top: 5px; color: var(--dra-text-3); font-size: 12px; line-height: 1.5; }

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
.dra-list-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 550; }
.dra-list-sub { margin-top: 2px; color: var(--dra-text-3); font-size: 11.5px; }

.dra-check-row {
  cursor: pointer;
  user-select: none;
  transition: border-color .15s, background .15s;
}
.dra-check-row:hover { border-color: var(--dra-border-strong); }
.dra-check-row[data-checked="true"] {
  border-color: color-mix(in srgb, var(--dra-accent) 52%, var(--dra-border));
  background: color-mix(in srgb, var(--dra-accent) 7%, var(--dra-layer-3));
}
.dra-check {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 0;
  border: 1px solid var(--dra-border-strong);
  border-radius: 5px;
  outline: 0;
  background: var(--dra-layer);
  appearance: none;
  display: inline-grid;
  place-content: center;
  cursor: pointer;
  transition: background .15s, border-color .15s, box-shadow .15s;
}
.dra-check::after {
  content: "";
  width: 8px;
  height: 4.5px;
  margin-top: -2px;
  border-left: 2px solid var(--dsw-alias-label-primary-foreground, #fff);
  border-bottom: 2px solid var(--dsw-alias-label-primary-foreground, #fff);
  transform: rotate(-45deg) scale(0);
  transition: transform .12s;
}
.dra-check:checked {
  border-color: var(--dra-accent);
  background: var(--dra-accent);
}
.dra-check:checked::after { transform: rotate(-45deg) scale(1); }
.dra-check:focus-visible { box-shadow: 0 0 0 3px var(--dra-accent-soft); }
.dra-check:disabled { cursor: not-allowed; opacity: .5; }

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
.dra-zoom-label { min-width: 38px; text-align: center; color: var(--dra-text-3); font-size: 11px; font-variant-numeric: tabular-nums; }

.dra-error {
  display: flex; align-items: center; gap: 9px;
  margin: 10px; padding: 9px 11px;
  border: 1px solid color-mix(in srgb, var(--dra-error) 42%, var(--dra-border));
  border-radius: 9px;
  background: color-mix(in srgb, var(--dra-error) 9%, transparent);
  color: var(--dra-error);
  font-size: 12.5px;
}
.dra-spin {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--dra-accent) 30%, transparent);
  border-top-color: var(--dra-accent);
  animation: dra-spin .8s linear infinite;
}
@keyframes dra-spin { to { transform: rotate(360deg); } }

@container (max-width: 1100px) {
  /* The composer spans nearly the whole panel here and would cover the
     bottom-right zoom controls; lift them above the measured composer stack. */
  .dra-zoom { bottom: calc(var(--dra-composer-top, 0px) + 12px); }
}
@container (max-width: 720px) {
  .dra-header { flex-wrap: wrap; gap: 6px; padding: 7px 10px; }
  .dra-search { order: 3; flex-basis: 100%; max-width: none; }
  .dra-header .dra-project { max-width: 200px; }
  .dra-project .dra-select-value { max-width: 154px; }
  .dra-detail { top: 8px; right: 8px; left: 8px; width: auto; max-height: 46%; }
  .dra-composer-wrap { width: calc(100% - 16px); bottom: 8px; }
  .dra-zoom { bottom: calc(var(--dra-composer-top, 0px) + 10px); right: 8px; }
}
@container (max-width: 480px) {
  .dra-brand span { display: none; }
  .dra-composer-bar { flex-wrap: wrap; }
  .dra-manual-actions { flex-wrap: wrap; }
  .dra-manual-hint { display: none; }
  .dra-operation-select .dra-select-trigger { min-width: 0; }
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
  return /* @__PURE__ */ import_react11.default.createElement(RouterIcon, { size });
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
  const Panel = (props) => /* @__PURE__ */ import_react11.default.createElement(RouterPanel, { ...props, openSession });
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
