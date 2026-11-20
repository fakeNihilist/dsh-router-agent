import React from 'react';

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
        <select
          className="dra-select"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          aria-label="模式"
          disabled={disabled || !planAvailable}
        >
          <option value="standard">标准</option>
          <option value="plan">计划模式</option>
        </select>
        <select
          className="dra-select"
          value={permissions}
          onChange={(event) => setPermissions(event.target.value)}
          aria-label="工作区权限"
          disabled={disabled || !permissionAvailable}
        >
          <option value="read-only">只读</option>
          <option value="workspace-write">工作区内修改</option>
          <option value="danger-full-access">完全访问</option>
        </select>
        <label className="dra-auto" data-on={auto ? 'true' : 'false'} title="开启后 RA 判断完直接执行，不再确认">
          <input
            type="checkbox"
            checked={auto}
            onChange={(event) => setAuto(event.target.checked)}
            disabled={disabled}
          />
          <span className="dra-switch" />
          自动执行
        </label>
        <span className="dra-spacer" />
        <span className="dra-tag">
          {mode === 'plan' ? '计划' : '标准'} ·{' '}
          {permissions === 'read-only' ? '只读' : permissions === 'danger-full-access' ? '完全访问' : '工作区'}
        </span>
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
      <div className="dra-hint" data-warn={auto ? 'true' : 'false'}>
        {disabled
          ? disabledReason
          : auto
            ? '自动执行已开启：RA 判断后由 Host 校验并直接发送。'
            : '默认需要确认；模式与权限按会话级生效，确认卡会显示目标变化。'}
      </div>
    </div>
  );
}
