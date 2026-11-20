import React from 'react';
import { Select } from './Select.jsx';

const MODE_OPTIONS = [
  { value: 'standard', label: '标准' },
  { value: 'plan', label: '计划模式' },
];

const PERMISSION_OPTIONS = [
  { value: 'read-only', label: '只读' },
  { value: 'workspace-write', label: '工作区内修改' },
  { value: 'danger-full-access', label: '完全访问' },
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
  planAvailable = true,
  permissionAvailable = true,
}) {
  const submit = () => {
    if (!task.trim() || busy || disabled) return;
    onSend();
  };
  return (
    <div className="dra-composer">
      <textarea
        value={task}
        onChange={(event) => setTask(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={disabled ? disabledReason : '描述要做的任务，Router 会判断继续、分叉还是新建…'}
        disabled={disabled}
        rows={2}
        aria-label="任务"
        data-composer-input
      />
      <div className="dra-composer-bar">
        <Select
          className="dra-mode-select"
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
          disabled={disabled || !planAvailable}
          ariaLabel="模式"
          menuMinWidth={150}
        />
        <Select
          className="dra-permission-select"
          value={permissions}
          onChange={setPermissions}
          options={PERMISSION_OPTIONS}
          disabled={disabled || !permissionAvailable}
          ariaLabel="工作区权限"
          menuMinWidth={180}
        />
        <label className="dra-auto" data-on={auto ? 'true' : 'false'} title="开启后 RA 判断完直接执行，不再确认">
          <input
            type="checkbox"
            checked={auto}
            onChange={(event) => setAuto(event.target.checked)}
            disabled={disabled}
            aria-label="自动执行"
          />
          <span className="dra-switch" />
        </label>
        <span className="dra-spacer" />
        <button
          className="dra-btn dra-btn-primary"
          type="button"
          disabled={!task.trim() || busy || disabled}
          onClick={submit}
          data-send
        >
          {busy ? '发送中…' : '发送'}
        </button>
      </div>
    </div>
  );
}
