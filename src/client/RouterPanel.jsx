import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiOp, apiState } from './api.js';
import { Canvas } from './Canvas.jsx';
import { Composer } from './Composer.jsx';
import { Detail } from './Detail.jsx';
import { ProposalCard } from './ProposalCard.jsx';
import { HistoryIcon, MoreIcon, RouterIcon, SearchIcon, SettingsIcon } from './icons.jsx';
import {
  CompressModal,
  HistoryModal,
  OnboardingOverlay,
  SettingsModal,
  StopModal,
  Toast,
  UntrackedModal,
} from './Modals.jsx';
import { boundsOf, buildLayout, centerOn, clamp, fitSelection } from './layout.js';

const POLL_MS = 2200;

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
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const dataRef = useRef(data);
  dataRef.current = data;
  const historySeen = useRef(new Set());
  const composerProject = useRef(null);
  const fitKey = useRef('');
  const lastFit = useRef(null);
  const timerRef = useRef(0);

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
    setPermissions(composer.permissions);
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

  // Fit on the first paint of a project/layout, and again when the container
  // size settles (the first ResizeObserver reading arrives after the panel is
  // mounted). Later polls and newly added sessions do not move the viewport.
  useEffect(() => {
    if (!data?.selectedProject || layout.nodes.length === 0) return;
    const key = `${data.selectedProject.project}|${layoutMode}`;
    if (fitKey.current === key) return;
    fitKey.current = key;
    const fitted = fitSelection(layout, viewportRef.current, layoutMode, { bottomReserve: pending ? 390 : 230 });
    lastFit.current = fitted;
    setView(fitted);
  }, [data?.selectedProject, layoutMode, layout.nodes.length, pending]);

  const handleViewport = useCallback(
    (next) => {
      setViewport(next);
      setView((current) => {
        const fitted = lastFit.current;
        if (
          fitted &&
          Math.abs(current.x - fitted.x) < 1 &&
          Math.abs(current.y - fitted.y) < 1 &&
          Math.abs(current.z - fitted.z) < 0.001
        ) {
          const replacement = fitSelection(layoutRef.current, next, layoutMode, {
            bottomReserve: pendingRef.current ? 390 : 230,
          });
          lastFit.current = replacement;
          return replacement;
        }
        return current;
      });
    },
    [layoutMode],
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

  const confirm = async (proposal) => {
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
    }, '已确认并发送。').catch(() => {});
  };

  const choose = async (proposal, atSeq) => {
    await run(
      () => apiOp('choose', { project: data.selectedProject.project, token: proposal.token, atSeq }),
      '分叉点已更新。',
    ).catch(() => {});
  };

  const abandon = async (proposal) => {
    await run(
      () => apiOp('abandon', { project: data.selectedProject.project, token: proposal.token }),
      '提议已取消。',
    ).catch(() => {});
  };

  const answer = async (proposal, value) => {
    await run(
      () => apiOp('answer', { project: data.selectedProject.project, token: proposal.token, answer: value }),
      '已回答 Router。',
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

  const restore = async (sessionId) => {
    await run(
      () => apiOp('restore', { project: data.selectedProject.project, sessionId }),
      '已恢复跟踪。',
    ).catch(() => {});
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
    const z = clamp(
      Math.min((width - 60) / Math.max(1, bounds.width), (height - (pending ? 390 : 230)) / Math.max(1, bounds.height)),
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
    <div className="dra">
      <header className="dra-header">
        <div className="dra-brand">
          <RouterIcon />
          <span>Router</span>
        </div>
        <label className="dra-project" title={data?.selectedProject?.project ?? '选择一个项目'}>
          <select
            value={data?.selectedProject?.project ?? ''}
            onChange={(event) => {
              setProject(event.target.value);
              setSelectedId(null);
              fitKey.current = '';
            }}
            aria-label="项目"
          >
            {(data?.projects ?? []).length === 0 ? <option value="">无项目</option> : null}
            {(data?.projects ?? []).map((row) => (
              <option key={row.project} value={row.project}>
                {row.name} · {row.sessions}
              </option>
            ))}
          </select>
          <span className="dra-caret">▾</span>
        </label>
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
          <button className="dra-icon-btn" type="button" title="与 RA 的对话历史" onClick={() => setModal('history')}>
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
            onCompress={(session) => setModal({ type: 'compress', session })}
            canCompress={data?.probe?.compact !== false}
            onViewportChange={handleViewport}
            onFit={fitAll}
            onLatest={latest}
          />
        ) : (
          <div className="dra-empty">
            <h3>{loading ? '正在读取项目…' : data?.selectedProject ? '这个项目还没有可跟踪的会话' : '还没有项目'}</h3>
            <p>
              {data?.selectedProject
                ? '默认只跟踪最近 7 天有活动的会话。可以去“未跟踪会话”恢复更早的会话，或先在 DSH 中继续一个会话。'
                : '先在 DSH 中打开一个项目并创建会话。'}
            </p>
          </div>
        )}

        {selected ? (
          <Detail
            session={selected}
            pendingFork={
              pendingList.find(
                (item) => item.action === 'fork' && item.targetSessionId === selected.sessionId,
              ) ?? null
            }
            onOpen={(id) => openSession?.(id)}
            onCompress={(session) => setModal({ type: 'compress', session })}
            onStop={(session) => setModal({ type: 'stop', session })}
            onRename={rename}
            onSelectAtSeq={(sessionId, atSeq) => {
              const proposal = pendingList.find(
                (item) => item.action === 'fork' && item.targetSessionId === sessionId,
              );
              if (proposal) choose(proposal, atSeq);
            }}
            onClose={() => setSelectedId(null)}
            canCompress={data?.probe?.compact !== false}
          />
        ) : null}

        <div className="dra-composer-wrap">
          {pendingList.length > 0 ? (
            <div className="dra-proposals">
              {pendingList.map((proposal) => {
                const target = proposal.targetSessionId
                  ? tree.sessions.find((row) => row.sessionId === proposal.targetSessionId) ?? null
                  : null;
                return (
                  <ProposalCard
                    key={proposal.token}
                    proposal={proposal}
                    target={target}
                    busy={busy}
                    onConfirm={confirm}
                    onChoose={choose}
                    onAbandon={abandon}
                    onAnswer={answer}
                  />
                );
              })}
            </div>
          ) : data?.ra?.running ? (
            <div className="dra-proposal">
              <div className="dra-proposal-head">
                <span className="dra-spin" />
                <span>Router 正在查看会话并判断…</span>
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
            planAvailable={data?.probe?.planMode !== false}
            permissionAvailable={data?.probe?.permissionPresets !== false}
          />
        </div>

        <OnboardingOverlay
          onboarding={onboarding}
          currentTitle={currentTitle}
          onRetry={() => run(() => apiOp('onboarding', { project: data.selectedProject.project }), '正在重试索引…').catch(() => {})}
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
          onRefresh={() => refresh(false)}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'untracked' ? (
        <UntrackedModal
          items={data?.untracked ?? []}
          onRestore={async (id) => {
            await restore(id);
            setModal(null);
          }}
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
