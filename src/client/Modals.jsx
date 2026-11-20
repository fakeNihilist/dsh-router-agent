import React, { useEffect, useMemo, useState } from 'react';
import { CloseIcon, HistoryIcon, SettingsIcon } from './icons.jsx';

function tokens(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function Mask({ children, onClose, label }) {
  return (
    <div className="dra-modal-mask" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className="dra-modal" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function Head({ title, onClose }) {
  return (
    <div className="dra-modal-head">
      <span>{title}</span>
      <span className="dra-spacer" />
      <button className="dra-icon-btn" type="button" title="关闭" onClick={onClose}>
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  );
}

export function SettingsModal({ settings, models, onSave, onClose }) {
  const [layout, setLayout] = useState(settings?.layout ?? 'vertical');
  const [ra, setRa] = useState(modelValue(settings?.raModel));
  const [fresh, setFresh] = useState(modelValue(settings?.defaultSessionModel));
  const [busy, setBusy] = useState(false);
  const groups = models?.groups ?? [];
  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        layout,
        raModel: parseModel(ra),
        defaultSessionModel: parseModel(fresh),
      });
      onClose?.();
    } catch {
      // The panel surfaces the error; keep the dialog open so the user can
      // correct the selection or retry.
    } finally {
      setBusy(false);
    }
  };
  return (
    <Mask onClose={onClose} label="Router 设置">
      <Head title="Router 设置" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-field">
          <label htmlFor="dra-layout">节点排列方式</label>
          <select id="dra-layout" className="dra-select" value={layout} onChange={(event) => setLayout(event.target.value)}>
            <option value="vertical">纵向 · 根从左到右，分叉向下</option>
            <option value="horizontal">横向 · 根从上到下，分叉向右</option>
          </select>
        </div>
        <div className="dra-field">
          <label htmlFor="dra-ra-model">RA 模型</label>
          <select id="dra-ra-model" className="dra-select" value={ra} onChange={(event) => setRa(event.target.value)}>
            <option value="">跟随部署默认</option>
            {groups.map((group) => (
              <optgroup key={group.id} label={group.name ?? group.id}>
                {group.models.map((model) => (
                  <option key={`${group.id}|${model.id}`} value={`${group.id}|${model.id}`}>
                    {model.name ?? model.id}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="dra-field-help">只影响 Router 会话，不改变整个部署的默认模型。</div>
        </div>
        <div className="dra-field">
          <label htmlFor="dra-new-model">新会话默认模型</label>
          <select id="dra-new-model" className="dra-select" value={fresh} onChange={(event) => setFresh(event.target.value)}>
            <option value="">跟随部署默认</option>
            {groups.map((group) => (
              <optgroup key={group.id} label={group.name ?? group.id}>
                {group.models.map((model) => (
                  <option key={`${group.id}|${model.id}`} value={`${group.id}|${model.id}`}>
                    {model.name ?? model.id}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="dra-field-help">只用于 Router 新建的会话；已有会话保持原模型。</div>
        </div>
        {groups.length === 0 ? <div className="dra-error">没有可用的模型目录，模型设置暂时不可用。</div> : null}
      </div>
      <div className="dra-modal-foot">
        <span className="dra-spacer" />
        <button className="dra-btn" type="button" onClick={onClose}>取消</button>
        <button className="dra-btn dra-btn-primary" type="button" disabled={busy} onClick={save}>
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
    </Mask>
  );
}

export function HistoryModal({ ra, history, onClose, onRefresh }) {
  const [tab, setTab] = useState('dispatch');
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    setBusy(true);
    try {
      await onRefresh?.();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Mask onClose={onClose} label="Router 历史">
      <Head title="Router 历史" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-detail-row" style={{ marginTop: 0 }}>
          <button
            className={`dra-btn dra-btn-sm ${tab === 'dispatch' ? 'dra-btn-primary' : ''}`}
            type="button"
            onClick={() => setTab('dispatch')}
          >
            <HistoryIcon width={12} height={12} />
            派发记录
          </button>
          <button
            className={`dra-btn dra-btn-sm ${tab === 'ra' ? 'dra-btn-primary' : ''}`}
            type="button"
            onClick={() => setTab('ra')}
          >
            与 RA 的对话
          </button>
          <span className="dra-spacer" />
          <button className="dra-btn dra-btn-sm" type="button" disabled={busy} onClick={refresh}>刷新</button>
        </div>
        {tab === 'ra' ? (
          <div style={{ marginTop: 10 }}>
            {(ra?.messages ?? []).length === 0 ? (
              <div className="dra-field-help">还没有与 RA 的对话。发送一个任务后会显示在这里。</div>
            ) : (
              (ra.messages ?? []).map((message, index) => (
                <div className="dra-msg" data-role={message.role} key={`${message.at}-${index}`}>
                  {message.text}
                </div>
              ))
            )}
          </div>
        ) : (history ?? []).length === 0 ? (
          <div className="dra-field-help" style={{ marginTop: 10 }}>还没有派发记录。</div>
        ) : (
          <div className="dra-list" style={{ marginTop: 10 }}>
            {history.map((row) => (
              <div className="dra-list-row" key={row.id}>
                <div className="dra-grow">
                  <div className="dra-list-title">{row.task}</div>
                  <div className="dra-list-sub">
                    {actionLabel(row.action)} · {row.targetTitle ?? row.targetSessionId ?? '新会话'} ·{' '}
                    {resultLabel(row.result)} · {new Date(row.at).toLocaleString('zh-CN', { hour12: false })}
                  </div>
                  {row.reason ? <div className="dra-list-sub">理由：{row.reason}</div> : null}
                </div>
                {row.mode === 'auto' ? <span className="dra-badge" data-tone="warn">自动</span> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </Mask>
  );
}

export function UntrackedModal({ items, onRestore, onClose }) {
  const [busyId, setBusyId] = useState(null);
  const restore = async (id) => {
    setBusyId(id);
    try {
      await onRestore?.(id);
    } finally {
      setBusyId(null);
    }
  };
  return (
    <Mask onClose={onClose} label="未跟踪会话">
      <Head title="未跟踪会话" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-field-help" style={{ marginBottom: 10 }}>
          默认只跟踪最近一周的会话。停止跟踪的会话也会出现在这里；恢复后重新进入 RA 的上下文。
        </div>
        {items.length === 0 ? (
          <div className="dra-field-help">没有未跟踪的会话。</div>
        ) : (
          <div className="dra-list">
            {items.map((item) => (
              <div className="dra-list-row" key={item.sessionId}>
                <div className="dra-grow">
                  <div className="dra-list-title">{item.title}</div>
                  <div className="dra-list-sub">
                    {item.reason === 'stopped' ? '手动停止跟踪' : '一周前'} · 最后活跃 {item.lastActiveLabel}
                  </div>
                </div>
                <button
                  className="dra-btn dra-btn-sm"
                  type="button"
                  disabled={busyId === item.sessionId}
                  onClick={() => restore(item.sessionId)}
                >
                  {busyId === item.sessionId ? '恢复中…' : '恢复'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Mask>
  );
}

export function CompressModal({ session, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const percent = session.context?.percent;
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(session);
      onClose?.();
    } catch {
      // Parent surfaces the error; keep the dialog open so the user can retry.
    } finally {
      setBusy(false);
    }
  };
  return (
    <Mask onClose={onClose} label="压缩上下文">
      <Head title="压缩上下文" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-field">
          <div className="dra-list-title">{session.title}</div>
          <div className="dra-field-help" style={{ marginTop: 6 }}>
            当前 {tokens(session.context?.usedTokens)} / {tokens(session.context?.limitTokens)}
            {percent === null || percent === undefined ? '' : `（${percent}%）`}。压缩会调用 DSH 的原生 /compact，
            只影响该会话的上下文，不改写历史事件。
          </div>
        </div>
        {session.running ? (
          <div className="dra-error">会话正在运行；压缩需要空闲的 Agent。等本轮结束后再试。</div>
        ) : null}
      </div>
      <div className="dra-modal-foot">
        <span className="dra-spacer" />
        <button className="dra-btn" type="button" onClick={onClose}>取消</button>
        <button className="dra-btn dra-btn-primary" type="button" disabled={busy || session.running} onClick={confirm}>
          {busy ? '压缩中…' : '确认压缩'}
        </button>
      </div>
    </Mask>
  );
}

export function StopModal({ session, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(session);
      onClose?.();
    } catch {
      // Parent surfaces the error.
    } finally {
      setBusy(false);
    }
  };
  return (
    <Mask onClose={onClose} label="停止跟踪会话">
      <Head title="停止跟踪会话" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-list-title">{session.title}</div>
        <div className="dra-field-help" style={{ marginTop: 8 }}>
          停止跟踪后，它会从 RA 的上下文和画布中移除，但会话本身不会被删除。
          如果它是父会话，跟踪中的子会话会移到顶层继续跟踪；恢复父会话后会自动回挂。
          之后可以在“未跟踪会话”里恢复。
        </div>
      </div>
      <div className="dra-modal-foot">
        <span className="dra-spacer" />
        <button className="dra-btn" type="button" onClick={onClose}>取消</button>
        <button className="dra-btn dra-btn-danger" type="button" disabled={busy} onClick={confirm}>
          {busy ? '处理中…' : '停止跟踪'}
        </button>
      </div>
    </Mask>
  );
}

export function OnboardingOverlay({ onboarding, currentTitle, onRetry }) {
  if (!onboarding || onboarding.total === 0 || onboarding.status === 'complete') return null;
  const percent = onboarding.total ? Math.round((onboarding.done / onboarding.total) * 100) : 0;
  return (
    <div className="dra-modal-mask" style={{ background: 'color-mix(in srgb, #000 26%, transparent)' }}>
      <div className="dra-modal" style={{ width: 'min(420px, 100%)' }}>
        <div className="dra-modal-head">
          <span>首次接入：建立会话索引</span>
          <span className="dra-spacer" />
          {onboarding.status === 'running' ? <span className="dra-spin" /> : null}
        </div>
        <div className="dra-modal-body">
          <div className="dra-field-help">
            只索引最近 7 天有活动的会话。完成后才能开始路由；中断后可以继续。
          </div>
          <div className="dra-progress" style={{ marginTop: 12 }}>
            <i style={{ width: `${percent}%` }} />
          </div>
          <div className="dra-detail-row">
            <span className="dra-detail-meta">
              {onboarding.done} / {onboarding.total}
              {currentTitle ? ` · ${currentTitle}` : ''}
            </span>
            <span className="dra-spacer" />
            {onboarding.failed?.length ? (
              <button className="dra-btn dra-btn-sm" type="button" onClick={onRetry}>
                重试失败项
              </button>
            ) : null}
          </div>
          {onboarding.failed?.length ? (
            <div className="dra-field-help" style={{ color: 'var(--dra-error)', marginTop: 8 }}>
              {onboarding.failed.length} 个会话索引失败；路由仍可用，详情会退回抽取式索引。
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="dra-proposal"
      style={{
        position: 'absolute',
        zIndex: 30,
        left: '50%',
        top: 62,
        transform: 'translateX(-50%)',
        width: 'min(520px, calc(100% - 24px))',
      }}
      role="status"
    >
      <div className="dra-proposal-head">{message}</div>
    </div>
  );
}

function modelValue(value) {
  return value?.provider && value?.model ? `${value.provider}|${value.model}` : '';
}

function parseModel(value) {
  if (!value) return null;
  const [provider, model] = value.split('|');
  return provider && model ? { provider, model } : null;
}

function actionLabel(action) {
  return { route: '继续', fork: '分叉', new: '新建', ask: '追问' }[action] ?? action;
}

function resultLabel(result) {
  return {
    sent: '已发送',
    created: '已新建',
    forked: '已分叉',
    auto: '自动执行',
    abandoned: '未执行',
    failed: '失败',
    asked: '已追问',
  }[result] ?? result;
}
