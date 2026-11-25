import React from 'react';

function level(percent) {
  if (percent === null || percent === undefined) return 'ok';
  if (percent >= 85) return 'high';
  if (percent >= 60) return 'warn';
  return 'ok';
}

/** Compact ring gauge for context usage; compression lives in the detail panel. */
function ContextRing({ percent }) {
  const known = percent !== null && percent !== undefined;
  const value = Math.min(100, Math.max(0, known ? percent : 0));
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  return (
    <span
      className="dra-ring"
      data-level={level(percent)}
      data-known={known ? 'true' : 'false'}
      title={known ? `上下文 ${percent}%` : '上下文未知'}
    >
      <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
        <circle className="dra-ring-track" cx="9" cy="9" r={radius} />
        {known ? (
          <circle
            className="dra-ring-fill"
            cx="9"
            cy="9"
            r={radius}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - value / 100)}
            transform="rotate(-90 9 9)"
          />
        ) : null}
      </svg>
    </span>
  );
}

export function NodeCard({
  node,
  x,
  y,
  selected,
  pending,
  isNew,
  dim,
  onSelect,
  onOpen,
}) {
  const percent = node.context?.percent;
  return (
    <div
      className="dra-node"
      data-session-id={node.sessionId}
      data-selected={selected ? 'true' : 'false'}
      data-pending={pending ? 'true' : 'false'}
      data-running={node.running ? 'true' : 'false'}
      data-new={isNew ? 'true' : 'false'}
      data-dim={dim ? 'true' : 'false'}
      style={{ left: `${x}px`, top: `${y}px` }}
      role="button"
      tabIndex={0}
      aria-label={node.title}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(node.sessionId);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onOpen?.(node.sessionId);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(node.sessionId);
        }
      }}
    >
      <div className="dra-node-top">
        <div className="dra-node-title">{node.title}</div>
        <span className="dra-node-dot" title={node.running ? '正在运行' : '空闲'} />
      </div>
      <div className="dra-node-meta">
        <span>{node.lastActiveLabel}</span>
        <span className="dra-spacer" />
        <span className="dra-ctx">
          <ContextRing percent={percent} />
          <span className="dra-ctx-text">
            {percent === null || percent === undefined ? '—' : `${percent}%`}
          </span>
        </span>
      </div>
    </div>
  );
}
