import React, { useState } from 'react';
import { Select } from './Select.jsx';

const ACTION_LABEL = {
  route: '继续已有会话',
  fork: '从历史轮次分叉',
  new: '新建干净会话',
  ask: '需要你确认',
};

const PLAN_LABEL = (value) => (value ? '计划' : '标准');
const PERMISSION_LABEL = (value) =>
  value === 'read-only'
    ? '只读'
    : value === 'danger-full-access'
      ? '完全访问'
      : value === 'workspace-write'
        ? '工作区'
        : '未知';

/** The dispatch change a route proposal will make, or null when it changes nothing. */
function routeSettingNote(proposal) {
  const planKnown = proposal.targetPlan !== null && proposal.targetPlan !== undefined;
  const permissionKnown =
    proposal.targetPermissions !== null && proposal.targetPermissions !== undefined;
  const planAfter = proposal.composer?.mode === 'plan';
  const permissionAfter = proposal.composer?.permissions ?? 'workspace-write';
  if (!planKnown || !permissionKnown) {
    return `目标当前设置未知；确认后将应用 ${PLAN_LABEL(planAfter)} · ${PERMISSION_LABEL(permissionAfter)}`;
  }
  if (planAfter === proposal.targetPlan && permissionAfter === proposal.targetPermissions) return null;
  return `目标设置将改变：${PLAN_LABEL(proposal.targetPlan)} · ${PERMISSION_LABEL(proposal.targetPermissions)} → ${PLAN_LABEL(planAfter)} · ${PERMISSION_LABEL(permissionAfter)}`;
}

export function ProposalCard({
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
  onRetarget,
}) {
  const [answer, setAnswer] = useState('');
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState('');
  const [retargeting, setRetargeting] = useState(false);
  if (!proposal) return null;
  const fork = proposal.action === 'fork';
  const ask = proposal.action === 'ask';
  const route = proposal.action === 'route';
  const delta = route ? routeSettingNote(proposal) : null;
  const sessionOptions = sessions.map((row) => ({
    value: row.sessionId,
    label: row.title,
  }));
  return (
    <div className="dra-proposal" data-proposal data-auto={proposal.auto ? 'true' : 'false'}>
      <div className="dra-proposal-head">
        <span className="dra-badge" data-tone={ask ? 'warn' : undefined}>
          {ACTION_LABEL[proposal.action] ?? proposal.action}
        </span>
        <span>{proposal.summary}</span>
        <span className="dra-spacer" />
        {total > 1 ? <span className="dra-badge dra-queue-badge">{index + 1}/{total}</span> : null}
        {proposal.manual ? <span className="dra-badge dra-queue-badge">手动</span> : null}
        {proposal.auto ? <span className="dra-badge" data-tone="warn">自动执行</span> : null}
      </div>
      {proposal.task ? (
        <p className="dra-proposal-task" title={proposal.task}>
          {proposal.task}
        </p>
      ) : null}
      {proposal.reason ? <p className="dra-proposal-reason">{proposal.reason}</p> : null}
      <div className="dra-proposal-target">
        {proposal.action === 'new'
          ? '新会话从任务原文开始，不带交接包。'
          : ask
            ? proposal.question
            : `目标：${proposal.targetTitle ?? proposal.targetSessionId}`}
        {route && target?.running ? ' · 正在运行，确认后任务会排队' : null}
      </div>
      {fork ? (
        <div className="dra-proposal-target">
          分叉会话将使用：{PLAN_LABEL(proposal.composer?.mode === 'plan')} ·{' '}
          {PERMISSION_LABEL(proposal.composer?.permissions)}
        </div>
      ) : null}
      {proposal.action === 'new' ? (
        <div className="dra-proposal-target">
          新会话将使用：{PLAN_LABEL(proposal.composer?.mode === 'plan')} ·{' '}
          {PERMISSION_LABEL(proposal.composer?.permissions)}
        </div>
      ) : null}
      {delta ? <div className="dra-proposal-target">{delta}</div> : null}
      {fork && target?.boundaries?.length ? (
        <div className="dra-detail-row">
          <Select
            className="dra-grow"
            value={String(proposal.atSeq ?? '')}
            onChange={(next) => onChoose?.(proposal, Number(next))}
            options={target.boundaries.map((item) => ({
              value: String(item.atSeq),
              label: `T${item.turn} · ${item.label}`,
            }))}
            ariaLabel="分叉点"
            menuMinWidth={260}
          />
        </div>
      ) : null}
      {fork && target && target.boundaryCount > (target.boundaries?.length ?? 0) ? (
        <div className="dra-field-help">
          只显示最近 {target.boundaries.length} 轮（共 {target.boundaryCount} 轮）。
        </div>
      ) : null}
      {retargeting && !ask ? (
        <div className="dra-proposal-row">
          <Select
            className="dra-grow"
            value={proposal.targetSessionId ?? ''}
            onChange={(next) => {
              setRetargeting(false);
              onRetarget?.(proposal, next);
            }}
            options={sessionOptions}
            placeholder="选择新的目标会话"
            ariaLabel="新的目标会话"
            menuMinWidth={260}
          />
        </div>
      ) : null}
      {revising ? (
        <div className="dra-proposal-row">
          <input
            className="dra-input dra-grow"
            value={note}
            placeholder="可选：告诉 RA 哪里判断错了"
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !busy) onRetry?.(proposal, note.trim());
            }}
            aria-label="纠正说明"
          />
          <button
            className="dra-btn dra-btn-primary dra-btn-sm"
            type="button"
            disabled={busy}
            onClick={() => onRetry?.(proposal, note.trim())}
          >
            重新判断
          </button>
          <button className="dra-btn dra-btn-ghost dra-btn-sm" type="button" onClick={() => setRevising(false)}>
            取消
          </button>
        </div>
      ) : null}
      <div className="dra-proposal-actions">
        {ask ? (
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
                  className="dra-input"
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
            {onRetry && !revising && !proposal.manual ? (
              <button
                className="dra-btn dra-btn-ghost dra-btn-sm"
                type="button"
                disabled={busy}
                onClick={() => setRevising(true)}
              >
                重新判断
              </button>
            ) : null}
          </>
        ) : (
          <>
            <button
              className="dra-btn dra-btn-ghost dra-btn-sm"
              type="button"
              disabled={busy}
              onClick={() => onAbandon?.(proposal)}
            >
              取消
            </button>
            {onRetarget && !retargeting ? (
              <button
                className="dra-btn dra-btn-ghost dra-btn-sm"
                type="button"
                disabled={busy}
                onClick={() => setRetargeting(true)}
              >
                换目标
              </button>
            ) : null}
            {onRetry && !revising && !proposal.manual ? (
              <button
                className="dra-btn dra-btn-ghost dra-btn-sm"
                type="button"
                disabled={busy}
                onClick={() => setRevising(true)}
              >
                重新判断
              </button>
            ) : null}
            <span className="dra-spacer" />
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
