import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiOp, apiState } from './api.js';
import { Canvas } from './Canvas.jsx';
import { Composer } from './Composer.jsx';
import { Detail } from './Detail.jsx';
import { ProposalCard } from './ProposalCard.jsx';
import { Select } from './Select.jsx';
import { HistoryIcon, MoreIcon, RouterIcon, SearchIcon, SettingsIcon } from './icons.jsx';
import {
  CompressModal,
  HistoryModal,
  IndexBanner,
  OnboardingOverlay,
  SettingsModal,
  StopModal,
  Toast,
  UntrackedModal,
} from './Modals.jsx';
import { boundsOf, buildLayout, centerOn, clamp, fitSelection } from './layout.js';

const POLL_MS = 2200;

/** Space kept free at the bottom of the canvas for the composer stack. */
function fitReserve(composerTop, pending) {
  if (composerTop > 0) return composerTop + 12;
  return pending ? 390 : 230;
}

export function RouterPanel({ openSession }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [search, setSearch] = useState('');
  const [task, setTask] = useState('');
  const [mode, setMode] = useState('standard');
  const [permissions, setPermissions] = useState('workspace-write');
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [viewport, setViewport] = useState({ width: 900, height: 700 });
  const [newIds, setNewIds] = useState(() => new Set());
  const [composerTop, setComposerTop] = useState(0);
  const [raIssue, setRaIssue] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const panelRef = useRef(null);
  const composerRef = useRef(null);
  const composerTopRef = useRef(0);
  composerTopRef.current = composerTop;
  const dataRef = useRef(data);
  dataRef.current = data;
  const historySeen = useRef(new Set());
  const composerProject = useRef(null);
  const fitKey = useRef('');
  const lastFit = useRef(null);
  const timerRef = useRef(0);
  const pendingTokens = useRef(new Map());
  const pendingProject = useRef(null);
  const settledTokens = useRef(new Set());

  const refresh = useCallback(
    async (silent = false) => {
      try {
        const next = await apiState(project);
        setData(next);
        setError(null);
        if (next.selectedProject && next.selectedProject.project !== project) {
          setProject(next.selectedProject.project);
        }
        return next;
      } catch (reason) {
        if (!silent) setError(reason);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [project],
  );

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  useEffect(() => {
    timerRef.current = window.setInterval(() => refresh(true), POLL_MS);
    return () => window.clearInterval(timerRef.current);
  }, [refresh]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Sync composer defaults once per project. Later polls must not overwrite
  // what the user is typing or selecting.
  useEffect(() => {
    const composer = data?.settings?.composer;
    const key = data?.selectedProject?.project;
    if (!composer || !key || composerProject.current === key) return;
    composerProject.current = key;
    setMode(composer.mode);
    setPermissions(
      composer.permissions === 'danger-full-access' ? 'danger-full-access' : 'workspace-write',
    );
    setAuto(!!composer.auto);
  }, [data?.settings?.composer, data?.selectedProject?.project]);

  const tree = data?.tree ?? { sessions: [], edges: [], roots: [], trackedCount: 0 };
  const layoutMode = data?.settings?.layout === 'horizontal' ? 'horizontal' : 'vertical';
  const layout = useMemo(() => buildLayout(tree.sessions, layoutMode), [tree.sessions, layoutMode]);
  const selected = useMemo(
    () => tree.sessions.find((row) => row.sessionId === selectedId) ?? null,
    [tree.sessions, selectedId],
  );
  const pendingList = data?.pending ?? [];
  const pending = pendingList[0] ?? null;
  const pendingIds = useMemo(
    () => new Set(pendingList.map((item) => item.targetSessionId).filter(Boolean)),
    [pendingList],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const onboarding = data?.onboarding;
  const onboardingRunning = onboarding?.status === 'running';
  const raRunning = !!data?.ra?.running;
  const disabled = onboardingRunning || raRunning || !data?.selectedProject;
  const disabledReason = onboardingRunning
    ? `首次接入索引进行中（${onboarding.done}/${onboarding.total}），完成后才能路由。`
    : raRunning
      ? 'Router 正在判断上一个任务；完成后可以继续发送。'
      : !data?.selectedProject
        ? '还没有可路由的项目会话。'
        : '';

  // The composer floats over the canvas. Measuring the whole stack (proposal
  // card + input) lets the zoom controls and the fit logic stay clear of it at
  // any panel size, including the narrow side-panel layout.
  const measureComposer = useCallback(() => {
    const panel = panelRef.current;
    const composer = composerRef.current;
    if (!panel || !composer) return;
    const next = Math.max(0, Math.round(panel.getBoundingClientRect().bottom - composer.getBoundingClientRect().top));
    setComposerTop((current) => (Math.abs(current - next) > 1 ? next : current));
  }, []);

  useEffect(() => {
    const element = composerRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(measureComposer);
    observer.observe(element);
    measureComposer();
    return () => observer.disconnect();
  }, [measureComposer]);

  // Fit on the first paint of a project/layout, and again when the container
  // size settles (the first ResizeObserver reading arrives after the panel is
  // mounted). Later polls and newly added sessions do not move the viewport.
  useEffect(() => {
    if (!data?.selectedProject || layout.nodes.length === 0) return;
    const key = `${data.selectedProject.project}|${layoutMode}`;
    if (fitKey.current === key) return;
    fitKey.current = key;
    const fitted = fitSelection(layout, viewportRef.current, layoutMode, {
      bottomReserve: fitReserve(composerTopRef.current, pending),
    });
    lastFit.current = fitted;
    setView(fitted);
  }, [data?.selectedProject, layoutMode, layout.nodes.length, pending]);

  const handleViewport = useCallback(
    (next) => {
      setViewport(next);
      measureComposer();
      setView((current) => {
        const fitted = lastFit.current;
        if (
          fitted &&
          Math.abs(current.x - fitted.x) < 1 &&
          Math.abs(current.y - fitted.y) < 1 &&
          Math.abs(current.z - fitted.z) < 0.001
        ) {
          const replacement = fitSelection(layoutRef.current, next, layoutMode, {
            bottomReserve: fitReserve(composerTopRef.current, pendingRef.current),
          });
          lastFit.current = replacement;
          return replacement;
        }
        return current;
      });
    },
    [layoutMode, measureComposer],
  );

  // Detect a new auto-executed dispatch row and surface it once.
  useEffect(() => {
    const rows = data?.history ?? [];
    if (historySeen.current.size === 0) {
      for (const row of rows) historySeen.current.add(row.id);
      return;
    }
    for (const row of rows) {
      if (historySeen.current.has(row.id)) continue;
      historySeen.current.add(row.id);
      if (row.mode === 'auto') setToast(`自动执行：${row.targetTitle ?? row.targetSessionId ?? '新会话'} · 已发送`);
    }
  }, [data?.history]);

  // A proposal that disappears without a local confirm/abandon (expired token,
  // another tab, lastSeq 409) must not take the user's task with it.
  useEffect(() => {
    const list = data?.pending ?? [];
    const projectKey = data?.selectedProject?.project ?? null;
    const current = new Map(list.map((proposal) => [proposal.token, proposal]));
    if (pendingProject.current !== projectKey) {
      pendingProject.current = projectKey;
      pendingTokens.current = current;
      return;
    }
    for (const [token, proposal] of pendingTokens.current) {
      if (current.has(token) || settledTokens.current.has(token)) continue;
      if (proposal.project && projectKey && proposal.project !== projectKey) continue;
      if (proposal.task) {
        setTask((value) => (value.trim() ? value : proposal.task));
        setToast('提议已失效，任务已回到输入框。');
      }
    }
    pendingTokens.current = current;
  }, [data?.pending, data?.selectedProject?.project, setTask]);

  // The Host records the active task before the Agent starts. If the Agent
  // goes idle without producing a proposal, surface an actionable failure
  // instead of a spinner that silently disappeared.
  useEffect(() => {
    const task = data?.ra?.task ?? null;
    const running = !!data?.ra?.running;
    const hasPending = (data?.pending ?? []).length > 0;
    if (!task || hasPending) {
      setRaIssue((current) => (current ? null : current));
      return;
    }
    if (running) {
      setRaIssue((current) => (current ? null : current));
      return;
    }
    if (Date.now() - Number(task.at || 0) < 8000) {
      setRaIssue((current) => (current ? null : current));
      return;
    }
    setRaIssue((current) =>
      current?.kind === 'no-proposal' && current.task?.at === task.at
        ? current
        : { kind: 'no-proposal', task },
    );
  }, [data?.ra?.task, data?.ra?.running, data?.pending]);

  useEffect(() => {
    if (!raRunning) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [raRunning]);

  const run = async (work, successMessage) => {
    setBusy(true);
    setError(null);
    try {
      const result = await work();
      if (successMessage) setToast(successMessage);
      await refresh(true);
      return result;
    } catch (reason) {
      setError(reason);
      setToast(reason.message);
      await refresh(true);
      throw reason;
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = task.trim();
    if (!text || disabled) return;
    try {
      await run(
        () => apiOp('ask', { project: data.selectedProject.project, task: text, composer: { mode, permissions, auto } }),
        auto ? '已交给 Router；自动执行开启，判断后直接发送。' : '已交给 Router，正在分析。',
      );
      // Only drop the draft once the Host accepted it; a failed send keeps
      // the user's text for a retry.
      setTask('');
    } catch {
      // run() already surfaced the error.
    }
  };

  const manualSend = async (action, atSeq) => {
    const text = task.trim();
    if (!text || !selected || disabled) return;
    try {
      await run(
        () =>
          apiOp('manual', {
            project: data.selectedProject.project,
            task: text,
            action,
            targetSessionId: action === 'new' ? null : selected.sessionId,
            atSeq: action === 'fork' ? atSeq : null,
            composer: { mode, permissions, auto: false },
          }),
        '已生成待确认提议。',
      );
      setTask('');
    } catch {
      // run() already surfaced the error.
    }
  };

  const confirm = async (proposal) => {
    try {
      await run(async () => {
        const response = await apiOp('confirm', {
          project: data.selectedProject.project,
          token: proposal.token,
        });
        const result = response.result;
        const id = result?.sessionId ?? result?.targetSessionId;
        if (id) {
          setNewIds((current) => new Set(current).add(id));
          window.setTimeout(() => {
            setNewIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          }, 2400);
          if (result.result === 'forked' || result.result === 'created') setSelectedId(id);
        }
        return response;
      }, '已确认并发送。');
      settledTokens.current.add(proposal.token);
    } catch {
      // target-changed / expired / 409: keep the task in the input so it is
      // not lost while the user re-judges or picks another target.
      if (proposal.task) setTask((value) => (value.trim() ? value : proposal.task));
    }
  };

  const choose = async (proposal, atSeq) => {
    await run(
      () => apiOp('choose', { project: data.selectedProject.project, token: proposal.token, atSeq }),
      '分叉点已更新。',
    ).catch(() => {});
  };

  const abandon = async (proposal) => {
    try {
      await run(
        () => apiOp('abandon', { project: data.selectedProject.project, token: proposal.token }),
        '提议已取消，任务已回到输入框。',
      );
      settledTokens.current.add(proposal.token);
      if (proposal.task) setTask((value) => (value.trim() ? value : proposal.task));
    } catch {
      // run() already surfaced the error.
    }
  };

  const answer = async (proposal, value) => {
    try {
      await run(
        () => apiOp('answer', { project: data.selectedProject.project, token: proposal.token, answer: value }),
        '已回答 Router。',
      );
      settledTokens.current.add(proposal.token);
    } catch {
      // run() already surfaced the error.
    }
  };

  const retry = async (proposal, note) => {
    try {
      await run(
        () => apiOp('retry', { project: data.selectedProject.project, token: proposal.token, note }),
        note ? '已带着纠正交给 Router 重新判断。' : '已请 Router 重新判断。',
      );
      settledTokens.current.add(proposal.token);
    } catch {
      // run() already surfaced the error.
    }
  };

  const retarget = async (proposal, sessionId) => {
    await run(
      () => apiOp('retarget', { project: data.selectedProject.project, token: proposal.token, sessionId }),
      '目标已更新。',
    ).catch(() => {});
  };

  const cancelTask = async () => {
    await run(
      () => apiOp('cancelTask', { project: data.selectedProject.project }),
      '已取消 Router 的判断。',
    ).catch(() => {});
    setRaIssue(null);
  };

  const retryTask = async () => {
    const failed = raIssue?.task;
    if (!failed?.task) return;
    setRaIssue(null);
    await run(
      () =>
        apiOp('ask', {
          project: data.selectedProject.project,
          task: failed.task,
          composer: failed.composer ?? { mode, permissions, auto },
        }),
      '已重新交给 Router。',
    ).catch(() => {});
  };

  const startIndex = async (action = 'start') => {
    await run(
      () => apiOp('onboarding', { project: data.selectedProject.project, action }),
      action === 'retry' ? '正在重试索引…' : '正在建立会话索引…',
    ).catch(() => {});
  };

  const skipIndex = async () => {
    await run(
      () => apiOp('onboarding', { project: data.selectedProject.project, action: 'skip' }),
      '稍后可从画布上方的提示条开始索引。',
    ).catch(() => {});
  };

  const compress = async (session) => {
    await run(
      () => apiOp('compress', { project: data.selectedProject.project, sessionId: session.sessionId }),
      '上下文压缩完成。',
    );
  };

  const stop = async (session) => {
    await run(
      () => apiOp('stop', { project: data.selectedProject.project, sessionId: session.sessionId }),
      '已停止跟踪；可在“未跟踪会话”中恢复。',
    ).catch(() => {});
    if (selectedId === session.sessionId) setSelectedId(null);
  };

  const restoreMany = async (ids) => {
    const list = Array.isArray(ids) ? ids : [];
    if (!list.length) return;
    await run(async () => {
      for (const sessionId of list) {
        await apiOp('restore', { project: data.selectedProject.project, sessionId });
      }
    }, list.length === 1 ? '已恢复跟踪。' : `已恢复 ${list.length} 个会话。`);
  };

  const rename = async (sessionId, title) => {
    await run(
      () => apiOp('rename', { project: data.selectedProject.project, sessionId, title }),
      '名称已更新。',
    ).catch(() => {});
  };

  const saveSettings = async (settings) => {
    // Let the error propagate: SettingsModal keeps itself open and the panel's
    // run() shows the message. Swallowing it here made a failed save look
    // successful.
    const result = await run(
      () => apiOp('settings', { project: data.selectedProject.project, settings }),
      '设置已保存。',
    );
    fitKey.current = '';
    return result;
  };

  const fitAll = () => {
    if (!layout.nodes.length) return;
    const bounds = boundsOf(layout.nodes, layout.nodeW, layout.nodeH);
    const width = viewport.width;
    const height = viewport.height;
    const reserve = fitReserve(composerTopRef.current, pending);
    const z = clamp(
      Math.min((width - 60) / Math.max(1, bounds.width), (height - reserve) / Math.max(1, bounds.height)),
      0.25,
      1.4,
    );
    const fitted = {
      x: (width - bounds.width * z) / 2 - bounds.minX * z,
      y: (height - bounds.height * z) / 2 - bounds.minY * z - 30,
      z,
    };
    lastFit.current = fitted;
    setView(fitted);
  };

  const latest = () => {
    if (!layout.nodes.length) return;
    const node = [...layout.nodes].sort((a, b) => Number(b.lastActiveAt || 0) - Number(a.lastActiveAt || 0))[0];
    lastFit.current = null;
    setView(centerOn(node, viewportRef.current, Math.max(0.75, view.z), layout.nodeW, layout.nodeH));
  };

  const onSearchKey = (event) => {
    if (event.key !== 'Enter') return;
    const query = search.trim().toLowerCase();
    if (!query) return;
    const hit = tree.sessions.find((row) => String(row.title).toLowerCase().includes(query));
    if (!hit) return;
    setSelectedId(hit.sessionId);
    const node = layout.nodes.find((row) => row.sessionId === hit.sessionId);
    if (node) setView(centerOn(node, viewportRef.current, Math.max(0.8, view.z), layout.nodeW, layout.nodeH));
  };

  const currentTitle = onboarding?.current
    ? tree.sessions.find((row) => row.sessionId === onboarding.current)?.title
    : null;

  return (
    <div className="dra" ref={panelRef} style={{ '--dra-composer-top': `${composerTop}px` }}>
      <header className="dra-header">
        <div className="dra-brand">
          <RouterIcon />
          <span>Router</span>
        </div>
        <Select
          className="dra-project"
          value={data?.selectedProject?.project ?? ''}
          onChange={(next) => {
            setProject(next);
            setSelectedId(null);
            fitKey.current = '';
          }}
          options={(data?.projects ?? []).map((row) => ({
            value: row.project,
            label: `${row.name} · ${row.sessions} 会话 · ${row.tracked ?? 0} 跟踪`,
          }))}
          placeholder={(data?.projects ?? []).length === 0 ? '无项目' : '选择项目'}
          disabled={(data?.projects ?? []).length === 0}
          ariaLabel="项目"
          title={data?.selectedProject?.project ?? '选择一个项目'}
          menuMinWidth={260}
        />
        <div className="dra-search">
          <SearchIcon width={14} height={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={onSearchKey}
            placeholder="搜索会话"
            aria-label="搜索会话"
          />
        </div>
        <div className="dra-head-actions">
          <button className="dra-icon-btn" type="button" title="派发记录" onClick={() => setModal('history')}>
            <HistoryIcon />
          </button>
          <button className="dra-icon-btn" type="button" title="Router 设置" onClick={() => setModal('settings')}>
            <SettingsIcon />
          </button>
          <button className="dra-icon-btn" type="button" title="未跟踪会话" onClick={() => setModal('untracked')}>
            <MoreIcon />
          </button>
        </div>
      </header>

      <div className="dra-body">
        {error ? (
          <div className="dra-error" role="alert">
            <span>{error.message}</span>
            <button className="dra-btn dra-btn-sm" type="button" onClick={() => refresh(false)}>重试</button>
          </div>
        ) : null}

        <IndexBanner onboarding={onboarding} onStart={startIndex} />

        {layout.nodes.length > 0 ? (
          <Canvas
            layout={layout}
            view={view}
            setView={setView}
            selectedId={selectedId}
            pendingIds={pendingIds}
            newIds={newIds}
            search={search}
            onSelect={setSelectedId}
            onOpen={(id) => openSession?.(id)}
            onViewportChange={handleViewport}
            onFit={fitAll}
            onLatest={latest}
          />
        ) : (
          <div className="dra-empty">
            <h3>
              {loading
                ? '正在读取项目…'
                : data?.selectedProject
                  ? '这个项目还没有可跟踪的会话'
                  : '还没有项目'}
            </h3>
            <p>
              {data?.selectedProject
                ? `只跟踪最近 ${data?.settings?.trackingDays ?? 7} 天有活动的会话。可以去“未跟踪会话”恢复更早的会话，或先在 DSH 中继续一个会话。`
                : '先在 DSH 中打开一个项目并创建会话。'}
            </p>
          </div>
        )}

        {selected ? (
          <Detail
            session={selected}
            onOpen={(id) => openSession?.(id)}
            onCompress={(session) => setModal({ type: 'compress', session })}
            onStop={(session) => setModal({ type: 'stop', session })}
            onRename={rename}
            onClose={() => setSelectedId(null)}
            canCompress={data?.probe?.compact !== false}
          />
        ) : null}

        <div className="dra-composer-wrap" ref={composerRef}>
          {pendingList.length > 0 ? (
            <div className="dra-proposals">
              {pendingList.map((proposal, index) => {
                const target = proposal.targetSessionId
                  ? tree.sessions.find((row) => row.sessionId === proposal.targetSessionId) ?? null
                  : null;
                return (
                  <ProposalCard
                    key={proposal.token}
                    proposal={proposal}
                    target={target}
                    sessions={tree.sessions}
                    index={index}
                    total={pendingList.length}
                    busy={busy}
                    onConfirm={confirm}
                    onChoose={choose}
                    onAbandon={abandon}
                    onAnswer={answer}
                    onRetry={retry}
                    onRetarget={retarget}
                  />
                );
              })}
            </div>
          ) : data?.ra?.running ? (
            <div className="dra-proposal">
              <div className="dra-proposal-head">
                <span className="dra-spin" />
                <span>
                  Router 正在查看会话并判断…
                  {data?.ra?.task?.at ? ` ${Math.max(0, Math.floor((clock - Number(data.ra.task.at)) / 1000))}s` : ''}
                </span>
                <span className="dra-spacer" />
                <button className="dra-btn dra-btn-sm" type="button" disabled={busy} onClick={cancelTask}>
                  取消
                </button>
              </div>
              {data?.ra?.task?.at && clock - Number(data.ra.task.at) > 60000 ? (
                <p className="dra-proposal-reason">
                  已经超过 60 秒。可以继续等，或取消后手动指定目标。
                </p>
              ) : null}
            </div>
          ) : raIssue ? (
            <div className="dra-proposal" data-issue="true">
              <div className="dra-proposal-head">
                <span className="dra-badge" data-tone="warn">Router 未完成</span>
                <span>没有生成待确认提议</span>
              </div>
              <p className="dra-proposal-reason">
                这一轮已经结束，但没有提交提议。可能是模型不支持工具调用、超时或判断失败。
                可以重试、换一个 Router 模型，或选中画布节点后手动派发。
              </p>
              <div className="dra-proposal-actions">
                <button className="dra-btn dra-btn-primary dra-btn-sm" type="button" disabled={busy} onClick={retryTask}>
                  重新判断
                </button>
                <button className="dra-btn dra-btn-sm" type="button" onClick={() => setModal('settings')}>
                  换 Router 模型
                </button>
                <span className="dra-spacer" />
                <button className="dra-btn dra-btn-ghost dra-btn-sm" type="button" disabled={busy} onClick={cancelTask}>
                  取消任务
                </button>
              </div>
            </div>
          ) : null}
          <Composer
            task={task}
            setTask={setTask}
            mode={mode}
            setMode={setMode}
            permissions={permissions}
            setPermissions={setPermissions}
            auto={auto}
            setAuto={setAuto}
            busy={busy}
            disabled={disabled}
            disabledReason={disabledReason}
            onSend={send}
            onManualSend={manualSend}
            manualTarget={selected}
            onClearTarget={() => setSelectedId(null)}
            planAvailable={data?.probe?.planMode !== false}
            permissionAvailable={data?.probe?.permissionPresets !== false}
          />
        </div>

        <OnboardingOverlay
          onboarding={onboarding}
          currentTitle={currentTitle}
          trackingDays={data?.settings?.trackingDays ?? 7}
          onStart={() => startIndex('start')}
          onSkip={skipIndex}
        />
        <Toast message={toast} />
      </div>

      {modal === 'settings' ? (
        <SettingsModal
          settings={data?.settings}
          models={data?.models}
          onSave={saveSettings}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'history' ? (
        <HistoryModal
          ra={data?.ra}
          history={data?.history}
          onOpenRA={(id) => {
            setModal(null);
            openSession?.(id);
          }}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'untracked' ? (
        <UntrackedModal
          items={data?.untracked ?? []}
          onRestore={restoreMany}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.type === 'compress' ? (
        <CompressModal
          session={modal.session}
          onConfirm={compress}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.type === 'stop' ? (
        <StopModal
          session={modal.session}
          onConfirm={stop}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
