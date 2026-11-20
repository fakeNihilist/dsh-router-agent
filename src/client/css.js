/** Theme-aware styles. The panel uses the app's --dsw-* aliases with safe fallbacks. */
export const CSS = `
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
