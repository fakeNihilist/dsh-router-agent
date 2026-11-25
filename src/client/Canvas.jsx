import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NodeCard } from './NodeCard.jsx';
import { clamp, edgePath } from './layout.js';

export function Canvas({
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
  onLatest,
}) {
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState({ width: 900, height: 700 });
  const [panning, setPanning] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const panRef = useRef(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
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

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
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
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [setView]);

  const onPointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (target.closest?.('.dra-node, .dra-detail, .dra-zoom, .dra-proposal, .dra-modal, button, select, input, textarea')) {
        return;
      }
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        viewX: viewRef.current.x,
        viewY: viewRef.current.y,
      };
      setPanning(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback((event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    setView({
      x: pan.viewX + event.clientX - pan.startX,
      y: pan.viewY + event.clientY - pan.startY,
      z: viewRef.current.z,
    });
  }, [setView]);

  const endPan = useCallback(() => {
    panRef.current = null;
    setPanning(false);
  }, []);

  const query = String(search ?? '').trim().toLowerCase();
  const dimmed = (node) => (query ? !String(node.title ?? '').toLowerCase().includes(query) : false);

  return (
    <div
      className="dra-canvas"
      data-canvas
      ref={canvasRef}
      data-panning={panning ? 'true' : 'false'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onDoubleClick={(event) => {
        if (!event.target.closest?.('.dra-node')) onFit?.();
      }}
    >
      <div
        className="dra-world"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}
      >
        <svg
          className="dra-edges"
          width={Math.max(1, layout.width)}
          height={Math.max(1, layout.height)}
          aria-hidden
        >
          {layout.edges.map((edge) => (
            <path
              key={`${edge.from}-${edge.to}`}
              className="dra-edge"
              d={edgePath(edge, layout.mode)}
              data-dim={dimmed(edgeNode(edge.from)) || dimmed(edgeNode(edge.to)) ? 'true' : 'false'}
            />
          ))}
        </svg>
        {layout.nodes.map((node) => (
          <NodeCard
            key={node.sessionId}
            node={node}
            x={node.x}
            y={node.y}
            selected={selectedId === node.sessionId}
            pending={pendingIds.has(node.sessionId)}
            isNew={newIds.has(node.sessionId)}
            dim={dimmed(node)}
            onSelect={onSelect}
            onOpen={onOpen}
          />
        ))}
      </div>
      <div className="dra-zoom">
        <button
          className="dra-icon-btn"
          type="button"
          title="缩小"
          onClick={() => setView({ ...view, z: clamp(view.z / 1.15, 0.25, 2.5) })}
        >
          −
        </button>
        <span className="dra-zoom-label">{Math.round(view.z * 100)}%</span>
        <button
          className="dra-icon-btn"
          type="button"
          title="放大"
          onClick={() => setView({ ...view, z: clamp(view.z * 1.15, 0.25, 2.5) })}
        >
          +
        </button>
        <button className="dra-icon-btn" type="button" title="适应画布" onClick={onFit}>
          ⛶
        </button>
        <button className="dra-icon-btn" type="button" title="回到最近" onClick={onLatest}>
          ◎
        </button>
      </div>
    </div>
  );

  function edgeNode(id) {
    return layout.nodes.find((node) => node.sessionId === id);
  }
}
