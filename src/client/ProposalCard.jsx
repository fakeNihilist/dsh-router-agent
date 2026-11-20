import React, { useState } from 'react';

const ACTION_LABEL = {
  route: '继续已有会话',
  fork: '从历史轮次分叉',
  new: '新建干净会话',
  ask: '需要你确认',
};

export function ProposalCard({ proposal, target, busy, onConfirm, onChoose, onAbandon, onAnswer }) {
  const [answer, setAnswer] = useState('');
  if (!proposal) return null;
  const fork = proposal.action === 'fork';
  return (
    <div className="dra-proposal" data-proposal data-auto={proposal.auto ? 'true' : 'false'}>
      <div className="dra-proposal-head">
        <span className="dra-badge" data-tone={proposal.action === 'ask' ? 'warn' : undefined}>
          {ACTION_LABEL[proposal.action] ?? proposal.action}
        </span>
        <span>{proposal.summary}</span>
        <span className="dra-spacer" />
        {proposal.auto ? <span className="dra-badge" data-tone="warn">自动执行</span> : null}
      </div>
      {proposal.reason ? <p className="dra-proposal-reason">{proposal.reason}</p> : null}
      <div className="dra-proposal-target">
        {proposal.action === 'new'
          ? '新会话从任务原文开始，不带交接包。'
          : proposal.action === 'ask'
            ? proposal.question
            : `目标：${proposal.targetTitle ?? proposal.targetSessionId}`}
      </div>
      {proposal.targetSessionId && target ? (
        <div className="dra-proposal-target">
          目标当前：{proposal.targetPlan ? '计划' : '标准'} ·{' '}
          {proposal.targetPermissions === 'read-only'
            ? '只读'
            : proposal.targetPermissions === 'danger-full-access'
              ? '完全访问'
              : '工作区'}
          {proposal.targetPlan !== null && proposal.targetPlan !== undefined &&
          (proposal.targetPlan !== (proposal.composer?.mode === 'plan') ||
            proposal.targetPermissions !== proposal.composer?.permissions) ? (
            <span style={{ color: 'var(--dra-warn)' }}>
              {' '}→ {proposal.composer?.mode === 'plan' ? '计划' : '标准'} ·{' '}
              {proposal.composer?.permissions === 'read-only'
                ? '只读'
                : proposal.composer?.permissions === 'danger-full-access'
                  ? '完全访问'
                  : '工作区'}
            </span>
          ) : null}
        </div>
      ) : null}
      {fork && target?.boundaries?.length ? (
        <div className="dra-detail-row">
          <select
            className="dra-select dra-grow"
            value={String(proposal.atSeq ?? '')}
            onChange={(event) => onChoose?.(proposal, Number(event.target.value))}
            aria-label="分叉点"
          >
            {target.boundaries.map((item) => (
              <option key={item.atSeq} value={String(item.atSeq)}>
                T{item.turn} · {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {fork && target && target.boundaryCount > (target.boundaries?.length ?? 0) ? (
        <div className="dra-field-help">
          只显示最近 {target.boundaries.length} 轮（共 {target.boundaryCount} 轮）。
        </div>
      ) : null}
      <div className="dra-proposal-actions">
        <span className="dra-tag">{proposal.composer?.mode === 'plan' ? '计划' : '标准'}</span>
        <span className="dra-tag">
          {proposal.composer?.permissions === 'read-only'
            ? '只读'
            : proposal.composer?.permissions === 'danger-full-access'
              ? '完全访问'
              : '工作区'}
        </span>
        <span className="dra-spacer" />
        {proposal.action === 'ask' ? (
          <>
            {proposal.options?.length ? (
              proposal.options.map((option) => (
                <button
                  className="dra-btn dra-btn-sm"
                  type="button"
                  key={option}
                  disabled={busy}
                  onClick={() => onAnswer?.(proposal, option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <>
                <input
                  className="dra-select"
                  value={answer}
                  placeholder="回答 RA…"
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && answer.trim()) onAnswer?.(proposal, answer.trim());
                  }}
                  aria-label="回答 Router"
                />
                <button
                  className="dra-btn dra-btn-primary dra-btn-sm"
                  type="button"
                  disabled={!answer.trim() || busy}
                  onClick={() => onAnswer?.(proposal, answer.trim())}
                >
                  回答
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <button className="dra-btn dra-btn-ghost dra-btn-sm" type="button" disabled={busy} onClick={() => onAbandon?.(proposal)}>
              取消
            </button>
            <button
              className="dra-btn dra-btn-primary dra-btn-sm"
              type="button"
              disabled={busy}
              onClick={() => onConfirm?.(proposal)}
            >
              {busy ? '执行中…' : '确认发送'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
