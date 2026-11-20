import React, { useEffect, useState } from 'react';
import { CloseIcon, CompressIcon, StopIcon } from './icons.jsx';
import { Select } from './Select.jsx';

function tokens(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function level(percent) {
  if (percent === null || percent === undefined) return 'ok';
  if (percent >= 85) return 'high';
  if (percent >= 60) return 'warn';
  return 'ok';
}

export function Detail({
  session,
  pendingFork,
  onOpen,
  onCompress,
  onStop,
  onRename,
  onSelectAtSeq,
  onClose,
  canCompress = true,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  useEffect(() => {
    setTitle(session.title);
    setEditing(false);
  }, [session.sessionId, session.title]);
  const percent = session.context?.percent;
  const boundary = pendingFork?.atSeq ?? session.boundaries?.[0]?.atSeq ?? '';
  const commit = () => {
    const clean = title.trim();
    setEditing(false);
    if (clean && clean !== session.title) onRename?.(session.sessionId, clean);
  };
  return (
    <aside className="dra-detail" data-detail aria-label="会话详情">
      <div className="dra-detail-head">
        {editing ? (
          <input
            className="dra-input dra-grow"
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') {
                setTitle(session.title);
                setEditing(false);
              }
            }}
            aria-label="会话名称"
          />
        ) : (
          <div className="dra-detail-title" onDoubleClick={() => setEditing(true)} title="双击重命名">
            {session.title}
          </div>
        )}
        <button className="dra-icon-btn" type="button" title="关闭详情" onClick={onClose}>
          <CloseIcon width={14} height={14} />
        </button>
      </div>
      <div className="dra-detail-meta">
        {session.running ? '正在运行' : '空闲'} · {session.turns} 轮 · 最后活跃 {session.lastActiveLabel}
      </div>

      <div className="dra-detail-row">
        <button className="dra-btn dra-btn-primary dra-grow" type="button" onClick={() => onOpen?.(session.sessionId)}>
          打开会话
        </button>
        {!editing ? (
          <button className="dra-btn" type="button" onClick={() => setEditing(true)}>
            重命名
          </button>
        ) : null}
      </div>

      <div className="dra-detail-section">
        <div className="dra-detail-label">分叉点</div>
        {session.boundaries?.length ? (
          <>
            <div className="dra-detail-row">
              <Select
                className="dra-grow"
                value={String(boundary)}
                onChange={(next) => onSelectAtSeq?.(session.sessionId, Number(next))}
                options={session.boundaries.map((item) => ({
                  value: String(item.atSeq),
                  label: `T${item.turn} · ${item.label}`,
                }))}
                disabled={!pendingFork}
                title={pendingFork ? '更换 RA 提议的分叉点' : '等 RA 提出分叉后再选择'}
                ariaLabel="分叉点"
                menuMinWidth={240}
              />
            </div>
            <div className="dra-field-help">
              {session.boundaryCount > (session.boundaries?.length ?? 0)
                ? `只显示最近 ${session.boundaries.length} 轮（共 ${session.boundaryCount} 轮）。`
                : null}
              {pendingFork
                ? '这是 RA 提议的分叉点，可以在这里更换；确认后从该轮之后分叉。'
                : '分叉点由 RA 在提议中给出；这里只展示可用边界。'}
            </div>
          </>
        ) : (
          <div className="dra-field-help">还没有已完成的轮次，不能分叉。</div>
        )}
      </div>

      <div className="dra-detail-section">
        <div className="dra-detail-label">上下文</div>
        <div className="dra-detail-row">
          <div className="dra-grow">
            <div className="dra-ctx-text">
              {tokens(session.context?.usedTokens)} / {tokens(session.context?.limitTokens)}
              {percent === null || percent === undefined ? ' · 未知' : ` · ${percent}%`}
            </div>
            <div className="dra-ctx-bar" style={{ width: '100%', marginTop: 6 }} data-level={level(percent)}>
              <i style={{ width: `${Math.min(100, Math.max(0, percent ?? 0))}%` }} />
            </div>
          </div>
          <button
            className="dra-btn dra-btn-sm"
            type="button"
            disabled={!canCompress || percent === null || percent === undefined}
            onClick={() => onCompress?.(session)}
            title="压缩上下文"
          >
            <CompressIcon width={12} height={12} />
            压缩
          </button>
        </div>
      </div>

      <div className="dra-detail-section">
        <button
          className="dra-btn dra-btn-danger"
          type="button"
          onClick={() => onStop?.(session)}
          title="停止跟踪这个会话；跟踪中的子会话会移到顶层"
        >
          <StopIcon width={13} height={13} />
          不再跟踪会话
        </button>
      </div>
    </aside>
  );
}
