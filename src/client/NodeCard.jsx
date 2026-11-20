import React from 'react';
import { CompressIcon } from './icons.jsx';

function level(percent) {
  if (percent === null || percent === undefined) return 'ok';
  if (percent >= 85) return 'high';
  if (percent >= 60) return 'warn';
  return 'ok';
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
  onCompress,
  canCompress = true,
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
        <span className="dra-ctx" data-level={level(percent)} title={percent === null ? '上下文未知' : `上下文 ${percent}%`}>
          <span className="dra-ctx-text">{percent === null || percent === undefined ? '—' : `${percent}%`}</span>
          <span className="dra-ctx-bar">
            <i style={{ width: `${Math.min(100, Math.max(0, percent ?? 0))}%` }} />
          </span>
          <button
            className="dra-compress"
            type="button"
            title={canCompress ? '压缩上下文' : '当前部署不支持压缩'}
            aria-label="压缩上下文"
            disabled={!canCompress}
            onClick={(event) => {
              event.stopPropagation();
              onCompress?.(node);
            }}
          >
            <CompressIcon width={13} height={13} />
          </button>
        </span>
      </div>
    </div>
  );
}
