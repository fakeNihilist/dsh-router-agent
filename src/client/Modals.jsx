import React, { useState } from 'react';
import { CloseIcon } from './icons.jsx';
import { Select } from './Select.jsx';

function tokens(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function Mask({ children, onClose, label, className = '' }) {
  return (
    <div className="dra-modal-mask" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className={`dra-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={label}>
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
  const savedRa = modelValue(settings?.raModel);
  const savedIndex = modelValue(settings?.indexModel);
  const savedFresh = modelValue(settings?.defaultSessionModel);
  const fallbackModel = defaultModelValue(models);
  const [ra, setRa] = useState(() => savedRa || fallbackModel);
  const [index, setIndex] = useState(() => savedIndex || fallbackModel);
  const [fresh, setFresh] = useState(() => savedFresh || fallbackModel);
  const [autoAsk, setAutoAsk] = useState(settings?.autoAsk ?? 'keep');
  const [trackingDays, setTrackingDays] = useState(String(settings?.trackingDays ?? 7));
  const [busy, setBusy] = useState(false);
  const groups = models?.groups ?? [];
  // The dropdown no longer offers a "deployment default" row. When the user
  // leaves the preselected default untouched, saving null keeps following the
  // deployment default instead of pinning today's catalog entry.
  const modelForSave = (value, saved) =>
    !saved && value === fallbackModel ? null : parseModel(value);
  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        layout,
        raModel: modelForSave(ra, savedRa),
        indexModel: modelForSave(index, savedIndex),
        defaultSessionModel: modelForSave(fresh, savedFresh),
        autoAsk,
        trackingDays: Number(trackingDays),
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
          <Select
            id="dra-layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'vertical', label: '纵向 · 根从左到右，分叉向下' },
              { value: 'horizontal', label: '横向 · 根从上到下，分叉向右' },
            ]}
            ariaLabel="节点排列方式"
          />
        </div>
        <div className="dra-field">
          <label htmlFor="dra-ra-model">Router 模型（对话）</label>
          <Select
            id="dra-ra-model"
            value={ra}
            onChange={setRa}
            groups={modelGroups(groups)}
            disabled={groups.length === 0}
            placeholder="选择模型"
            ariaLabel="Router 模型"
            menuMinWidth={260}
          />
          <div className="dra-field-help">只用于 Router 的对话与路由判断，不改变目标会话的模型。</div>
        </div>
        <div className="dra-field">
          <label htmlFor="dra-index-model">索引模型</label>
          <Select
            id="dra-index-model"
            value={index}
            onChange={setIndex}
            groups={modelGroups(groups)}
            disabled={groups.length === 0}
            placeholder="选择模型"
            ariaLabel="索引模型"
            menuMinWidth={260}
          />
          <div className="dra-field-help">
            用于首次建立索引和后台摘要刷新；默认跟随部署默认模型。选择更强的模型会更准，也更贵。
          </div>
        </div>
        <div className="dra-field">
          <label htmlFor="dra-new-model">新会话默认模型</label>
          <Select
            id="dra-new-model"
            value={fresh}
            onChange={setFresh}
            groups={modelGroups(groups)}
            disabled={groups.length === 0}
            placeholder="选择模型"
            ariaLabel="新会话默认模型"
            menuMinWidth={260}
          />
          <div className="dra-field-help">用于 Router 新建和分叉的会话；已有会话保持原模型。</div>
        </div>
        <div className="dra-field">
          <label htmlFor="dra-auto-ask">自动执行遇到追问时</label>
          <Select
            id="dra-auto-ask"
            value={autoAsk}
            onChange={setAutoAsk}
            options={[
              { value: 'keep', label: '保留追问 · 等用户回答' },
              { value: 'suggest', label: '自动采用第一个建议项' },
              { value: 'decide', label: '交给 RA 判断 · 不允许追问' },
            ]}
            ariaLabel="自动执行遇到追问时"
            menuMinWidth={240}
          />
          <div className="dra-field-help">
            仅在输入区开启“自动执行”时生效；关闭自动执行时始终保留追问。
          </div>
        </div>
        <div className="dra-field">
          <label htmlFor="dra-tracking-days">跟踪范围</label>
          <Select
            id="dra-tracking-days"
            value={trackingDays}
            onChange={setTrackingDays}
            options={[
              { value: '3', label: '最近 3 天' },
              { value: '7', label: '最近 7 天' },
              { value: '14', label: '最近 14 天' },
              { value: '30', label: '最近 30 天' },
              { value: '90', label: '最近 90 天' },
            ]}
            ariaLabel="跟踪范围"
          />
          <div className="dra-field-help">
            只跟踪这个范围内有活动的会话；手动勾选或固定的会话始终保留。修改范围不会删除已有索引。
          </div>
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

export function HistoryModal({ ra, history, onOpenRA, onClose }) {
  const rows = history ?? [];
  return (
    <Mask onClose={onClose} label="Router 历史">
      <Head title="派发记录" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-detail-row" style={{ marginTop: 0 }}>
          <button
            className="dra-btn dra-btn-sm"
            type="button"
            disabled={!ra?.sessionId}
            onClick={() => onOpenRA?.(ra.sessionId)}
            title={ra?.sessionId ? '在 DSH 中打开 Router 会话' : '还没有 Router 会话'}
          >
            打开 RA 会话
          </button>
          <span className="dra-spacer" />
          <span className="dra-field-help">只记录 Router 确认或自动执行的派发。</span>
        </div>
        {rows.length === 0 ? (
          <div className="dra-field-help" style={{ marginTop: 10 }}>还没有派发记录。</div>
        ) : (
          <div className="dra-list" style={{ marginTop: 10 }}>
            {rows.map((row) => (
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

export function AllSessionsModal({ items, onApply, onClose }) {
  const list = items ?? [];
  const [initial] = useState(
    () => new Set(list.filter((item) => item.tracked).map((item) => item.sessionId)),
  );
  const [selected, setSelected] = useState(() => new Set(initial));
  const [busy, setBusy] = useState(false);
  // Checking a Session means "index it"; unchecking means "stop indexing".
  // Only the difference from the state the dialog opened with is submitted.
  const track = list
    .filter((item) => selected.has(item.sessionId) && !initial.has(item.sessionId))
    .map((item) => item.sessionId);
  const untrack = list
    .filter((item) => !selected.has(item.sessionId) && initial.has(item.sessionId))
    .map((item) => item.sessionId);
  const changed = track.length + untrack.length;
  const allChecked = list.length > 0 && selected.size === list.length;
  const toggle = (sessionId, checked) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(sessionId);
      else next.delete(sessionId);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(list.map((item) => item.sessionId)));
  };
  const apply = async () => {
    if (!changed) return;
    setBusy(true);
    try {
      await onApply?.({ track, untrack });
      onClose?.();
    } catch {
      // Parent surfaces the error; keep the ticks so the user can retry.
    } finally {
      setBusy(false);
    }
  };
  return (
    <Mask onClose={onClose} label="全部会话" className="dra-modal-sessions">
      <Head title="全部会话" onClose={onClose} />
      <div className="dra-modal-body">
        <div className="dra-field-help" style={{ marginBottom: 10 }}>
          勾选表示纳入 Router 索引；取消勾选会从画布和 RA 上下文移除，不会删除会话本身。
        </div>
        {list.length === 0 ? (
          <div className="dra-field-help">这个项目还没有会话。</div>
        ) : (
          <div className="dra-list">
            {list.map((item) => {
              const checked = selected.has(item.sessionId);
              return (
                <label className="dra-list-row dra-check-row" data-checked={checked ? 'true' : 'false'} key={item.sessionId}>
                  <input
                    type="checkbox"
                    className="dra-check"
                    checked={checked}
                    disabled={busy}
                    onChange={(event) => toggle(item.sessionId, event.target.checked)}
                    aria-label={`索引 ${item.title}`}
                  />
                  <div className="dra-grow">
                    <div className="dra-list-title">{item.title}</div>
                    <div className="dra-list-sub">
                      {checked
                        ? '已纳入索引'
                        : item.reason === 'stopped'
                          ? '已手动取消索引'
                          : '超出跟踪范围'}
                      {Number.isFinite(item.turns) ? ` · ${item.turns} 轮` : ''}
                      {' · '}最后活跃 {item.lastActiveLabel}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
      <div className="dra-modal-foot">
        <button
          className="dra-btn dra-btn-ghost dra-btn-sm"
          type="button"
          disabled={busy || list.length === 0}
          onClick={toggleAll}
        >
          {allChecked ? '取消全选' : '全选'}
        </button>
        <span className="dra-modal-count">
          已索引 {selected.size} / {list.length}
        </span>
        <span className="dra-spacer" />
        <button className="dra-btn" type="button" onClick={onClose} disabled={busy}>
          取消
        </button>
        <button
          className="dra-btn dra-btn-primary"
          type="button"
          disabled={!changed || busy}
          title={changed ? `将索引 ${track.length} 个、取消索引 ${untrack.length} 个` : '没有改动'}
          onClick={apply}
        >
          {busy ? '应用中…' : '应用更改'}
        </button>
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
          如果它是父会话，跟踪中的子会话会移到顶层继续跟踪；重新勾选父会话后会自动回挂。
          之后可以在“全部会话”里重新勾选索引。
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

export function OnboardingOverlay({
  onboarding,
  currentTitle,
  trackingDays = 7,
  onStart,
  onSkip,
}) {
  const [busy, setBusy] = useState(false);
  if (!onboarding || onboarding.total === 0) return null;
  const start = async () => {
    setBusy(true);
    try {
      await onStart?.();
    } finally {
      setBusy(false);
    }
  };
  if (onboarding.status === 'awaiting') {
    return (
      <div className="dra-modal-mask" style={{ background: 'color-mix(in srgb, #000 26%, transparent)' }}>
        <div className="dra-modal" style={{ width: 'min(460px, 100%)' }}>
          <div className="dra-modal-head">
            <span>首次接入：建立会话索引</span>
          </div>
          <div className="dra-modal-body">
            <div className="dra-field-help">
              将索引最近 {trackingDays} 天有活动的 {onboarding.total} 个会话
              {onboarding.done > 0 ? `（其中 ${onboarding.done} 个已有可用索引）` : ''}。
              索引会按“索引模型”调用模型，之后新增或更新的会话会自动刷新。
            </div>
            <div className="dra-field-help" style={{ marginTop: 8 }}>
              现在先路由也可以，但 Router 只能先看标题；建立索引后判断会更准。
            </div>
          </div>
          <div className="dra-modal-foot">
            <button className="dra-btn" type="button" disabled={busy} onClick={() => onSkip?.()}>
              稍后
            </button>
            <span className="dra-spacer" />
            <button className="dra-btn dra-btn-primary" type="button" disabled={busy} onClick={start}>
              {busy ? '启动中…' : '开始索引'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (onboarding.status !== 'running') return null;
  const percent = onboarding.total ? Math.round((onboarding.done / onboarding.total) * 100) : 0;
  return (
    <div className="dra-modal-mask" style={{ background: 'color-mix(in srgb, #000 26%, transparent)' }}>
      <div className="dra-modal" style={{ width: 'min(420px, 100%)' }}>
        <div className="dra-modal-head">
          <span>正在建立会话索引</span>
          <span className="dra-spacer" />
          <span className="dra-spin" />
        </div>
        <div className="dra-modal-body">
          <div className="dra-field-help">
            索引完成后才能继续发送任务；中断后可以从提示条继续。
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
              <span className="dra-field-help" style={{ color: 'var(--dra-error)' }}>
                {onboarding.failed.length} 个失败
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Non-blocking reminder after “later”, a failed index, or partial failures. */
export function IndexBanner({ onboarding, onStart }) {
  if (!onboarding || onboarding.total === 0) return null;
  const failed = onboarding.failed?.length ?? 0;
  const skipped = onboarding.status === 'skipped';
  const failedRun = onboarding.status === 'failed';
  const partial = onboarding.status === 'complete' && failed > 0;
  if (!skipped && !failedRun && !partial) return null;
  return (
    <div className="dra-index-banner" role="status">
      <span>
        {skipped
          ? '会话索引还没建立，Router 目前只能先看标题。'
          : failedRun
            ? '索引中断，尚未完成。'
            : `${failed} 个会话索引失败，失败项会退回抽取式索引。`}
      </span>
      <button className="dra-btn dra-btn-sm" type="button" onClick={() => onStart?.(failedRun || partial ? 'retry' : 'start')}>
        {skipped ? '开始索引' : '重试'}
      </button>
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

function modelGroups(groups) {
  return (groups ?? []).map((group) => ({
    label: group.name ?? group.id,
    options: (group.models ?? []).map((model) => ({
      value: `${group.id}|${model.id}`,
      label: model.name ?? model.id,
    })),
  }));
}

/** Select value for the deployment's default model, used when no override is saved. */
function defaultModelValue(models) {
  const fallback = models?.default;
  const groups = models?.groups ?? [];
  if (!fallback?.provider || !fallback?.model) return '';
  const exact = groups.find((group) => group.id === fallback.provider);
  if (exact && (exact.models ?? []).some((model) => model.id === fallback.model)) {
    return `${exact.id}|${fallback.model}`;
  }
  const group = groups.find((item) => (item.models ?? []).some((model) => model.id === fallback.model));
  return group ? `${group.id}|${fallback.model}` : '';
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
    revised: '重新判断',
    failed: '失败',
    asked: '已追问',
  }[result] ?? result;
}
