import React, { useEffect, useState } from 'react';
import { Select } from './Select.jsx';
import { Tip } from './Tooltip.jsx';

const OPERATION_OPTIONS = [
  { value: 'workspace-write', label: '工作区内修改' },
  { value: 'danger-full-access', label: '完全访问' },
  { value: 'plan', label: '计划模式' },
];

const MANUAL_ACTIONS = [
  { value: 'route', label: '指定', title: '把任务发送到这个会话' },
  { value: 'fork', label: '分叉', title: '从该会话的某一轮分叉后发送' },
  { value: 'new', label: '新会话', title: '新建一个干净会话后发送' },
];

export function Composer({
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
  permissionAvailable = true,
}) {
  const [manualAction, setManualAction] = useState('route');
  const [atSeq, setAtSeq] = useState(null);
  const boundaries = manualTarget?.boundaries ?? [];
  const manual = !!manualTarget;

  // Training a new selection starts from “route” and the latest boundary;
  // switching to fork afterwards offers the same session's boundaries.
  useEffect(() => {
    if (!manualTarget) return;
    setManualAction('route');
    setAtSeq(manualTarget.boundaries?.at(-1)?.atSeq ?? null);
  }, [manualTarget?.sessionId]);

  useEffect(() => {
    if (!manualTarget) return;
    if (!boundaries.some((item) => item.atSeq === atSeq)) {
      setAtSeq(boundaries.at(-1)?.atSeq ?? null);
    }
  }, [boundaries, atSeq, manualTarget]);

  const operation =
    mode === 'plan'
      ? 'plan'
      : permissions === 'danger-full-access'
        ? 'danger-full-access'
        : 'workspace-write';
  const changeOperation = (value) => {
    if (value === 'plan') {
      setMode('plan');
      setPermissions('workspace-write');
    } else {
      setMode('standard');
      setPermissions(value);
    }
  };
  const action = MANUAL_ACTIONS.find((item) => item.value === manualAction) ?? MANUAL_ACTIONS[0];
  const canFork = boundaries.length > 0;
  const operationOptions = planAvailable
    ? OPERATION_OPTIONS
    : OPERATION_OPTIONS.filter((item) => item.value !== 'plan');
  const submit = () => {
    if (!task.trim() || busy || disabled) return;
    if (manual) {
      onManualSend?.(manualAction, manualAction === 'fork' ? atSeq : null);
    } else {
      onSend();
    }
  };
  return (
    <div className="dra-composer">
      {manual ? (
        <div className="dra-manual">
          <div className="dra-manual-head">
            <span className="dra-manual-label">手动派发</span>
            <span className="dra-manual-title" title={manualTarget.title}>
              {manualTarget.title}
            </span>
            <span className="dra-spacer" />
            <button
              className="dra-manual-clear"
              type="button"
              title="取消选择，交给 Router 判断"
              aria-label="取消选择，交给 Router 判断"
              onClick={onClearTarget}
            >
              ×
            </button>
          </div>
          <div className="dra-manual-actions">
            <div className="dra-seg" role="group" aria-label="手动派发动作">
              {MANUAL_ACTIONS.map((item) => (
                <button
                  key={item.value}
                  className="dra-seg-btn"
                  type="button"
                  data-active={manualAction === item.value ? 'true' : 'false'}
                  disabled={item.value === 'fork' && !canFork}
                  title={
                    item.value === 'fork' && !canFork
                      ? '该会话还没有已完成轮次，无法分叉'
                      : item.title
                  }
                  onClick={() => setManualAction(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {manualAction === 'fork' ? (
              <Select
                className="dra-fork-select"
                value={String(atSeq ?? '')}
                onChange={(next) => setAtSeq(Number(next))}
                options={boundaries.map((item) => ({
                  value: String(item.atSeq),
                  label: `T${item.turn} · ${item.label}`,
                }))}
                placeholder="选择分叉点"
                ariaLabel="分叉点"
                menuMinWidth={260}
              />
            ) : (
              <span className="dra-manual-hint">
                {manualAction === 'route'
                  ? '发送后仍需确认'
                  : '不继承选中会话的上下文'}
              </span>
            )}
          </div>
        </div>
      ) : null}
      <textarea
        value={task}
        onChange={(event) => setTask(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={
          disabled
            ? disabledReason
            : manual
              ? `描述要${action.value === 'new' ? '新建并发送' : action.value === 'fork' ? '分叉并发送' : '发送到该会话'}的任务…`
              : '描述要做的任务，Router 会判断继续、分叉还是新建…'
        }
        disabled={disabled}
        rows={3}
        aria-label="任务"
        data-composer-input
      />
      <div className="dra-composer-bar">
        <Select
          className="dra-operation-select"
          value={operation}
          onChange={changeOperation}
          options={operationOptions}
          disabled={disabled || !permissionAvailable}
          ariaLabel="操作权限"
          menuMinWidth={170}
        />
        <Tip
          label={
            manual
              ? '手动派发始终需要确认，不使用自动执行'
              : '开启后 RA 判断完直接执行，不再确认'
          }
        >
          <label className="dra-auto" data-on={auto && !manual ? 'true' : 'false'} data-manual={manual ? 'true' : 'false'}>
            <input
              type="checkbox"
              checked={auto}
              onChange={(event) => setAuto(event.target.checked)}
              disabled={disabled || manual}
              aria-label="自动执行"
            />
            <span className="dra-switch" />
            自动执行
          </label>
        </Tip>
        <span className="dra-spacer" />
        <button
          className="dra-btn dra-btn-primary"
          type="button"
          disabled={!task.trim() || busy || disabled || (manual && manualAction === 'fork' && !atSeq)}
          onClick={submit}
          title={manual ? '生成待确认提议，确认后才发送' : undefined}
          data-send
        >
          {busy ? '发送中…' : '发送'}
        </button>
      </div>
    </div>
  );
}
