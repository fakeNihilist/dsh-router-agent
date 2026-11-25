/**
 * Real-browser UI acceptance for the Router panel.
 *
 * Boots an isolated DSH Web profile, seeds synthetic V4 sessions, opens Edge
 * headless over CDP, and drives the actual plugin panel. No real project session
 * is read or written. Screenshots land in test/ui/shots.
 */
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const HOME = process.env.DSH_RA_UI_HOME ?? 'D:/tmp/dsh-ra-ui-home';
const PROJECT = 'D:/tmp/dsh-ra-ui-test';
const OTHER = 'D:/tmp/dsh-ra-ui-other';
const projectDirName = (project) => `--${project.replace(':', '').replaceAll('/', '-')}--`;
const CLI = process.env.DSH_CLI ?? 'D:/deepseek harness/resources/runtime/cli/bin/dsh.cmd';
const CLI_WIN = CLI.replaceAll('/', '\\');
const EDGE = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SHOTS = join(HERE, 'shots');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function runCli(args) {
  execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `""${CLI_WIN}" ${args.join(' ')}"`], {
    env: { ...process.env, DSH_HOME: HOME },
    stdio: 'pipe',
    windowsHide: true,
    windowsVerbatimArguments: true,
  });
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function ensureProfile() {
  await mkdir(join(HOME, 'profiles', 'ui'), { recursive: true });
  let initialized = true;
  try {
    await readFile(join(HOME, 'profiles', 'ui', 'package.json'));
  } catch {
    initialized = false;
  }
  if (!initialized) runCli(['--profile', 'ui', '--from-default-profile', 'web', '--dump-config']);
  let installed = true;
  try {
    await readFile(join(HOME, 'profiles', 'ui', 'node_modules', 'dsh-router-agent', 'package.json'));
  } catch {
    installed = false;
  }
  if (!installed) runCli(['plugin', '--profile', 'ui', 'add', `link:${REPO}`]);
  // The model catalog and account chrome need the same credentials the real
  // profile uses. This copies only local credential/model metadata into the
  // isolated test home; sessions are never copied from the real project.
  // Set DSH_RA_UI_NO_CREDENTIALS=1 to keep the test fully credential-free.
  if (process.env.DSH_RA_UI_NO_CREDENTIALS !== '1') try {
    const userHome = process.env.USERPROFILE ?? process.env.HOME ?? '';
    await copyFile(join(userHome, '.dsh', '.credentials.yaml'), join(HOME, '.credentials.yaml'));
    await cp(join(userHome, '.dsh', 'llm-deepseek'), join(HOME, 'llm-deepseek'), { recursive: true, force: true });
    try {
      await copyFile(join(userHome, '.dsh', 'settings.yaml.imported'), join(HOME, 'settings.yaml'));
    } catch {}
    try {
      await copyFile(join(userHome, '.dsh', 'settings.yaml'), join(HOME, 'settings.yaml'));
    } catch {}
    try {
      // Deterministic light screenshots by default; DSH_RA_UI_THEME=dark keeps
      // the source preference so the same suite can refresh the dark set.
      if (process.env.DSH_RA_UI_THEME !== 'dark') {
        const settingsPath = join(HOME, 'settings.yaml');
        const text = await readFile(settingsPath, 'utf8');
        await writeFile(settingsPath, text.replace(/preference:\s*dark/g, 'preference: light'));
      }
    } catch {}
  } catch {
    // A credential-free profile still exercises extractive briefs and all UI.
  }
  await writeFile(
    join(HOME, 'profiles', 'ui', 'cordis.patch.yml'),
    ['# UI test overrides: deterministic extractive briefs.', '- id: dsh-router-agent', '  config:', '    dev: true', '    summaryUseLlm: false', '    summaryDelayMs: 800', ''].join('\n'),
  );
}

async function seed() {
  // A failed acceptance run can leave its DSH Web child alive; it would race
  // this seed's sidecar cleanup with the next run's server.
  killStrayUiServers();
  await rm(join(HOME, 'sessions'), { recursive: true, force: true });
  await rm(join(OTHER, '.dsh_RA'), { recursive: true, force: true });
  // Build a one-session second project first, then the main corpus. The main
  // corpus is therefore the most recent project and the default selection;
  // switching to this one must rebuild the canvas and the untracked list.
  const otherRoot = join(HOME, '.seed-other');
  await rm(otherRoot, { recursive: true, force: true });
  execFileSync(process.execPath, [join(REPO, 'tools', 'make-fixtures.mjs'), otherRoot], {
    stdio: 'pipe',
    env: { ...process.env, DSH_RA_PROJECT: OTHER },
  });
  const otherFixtures = JSON.parse(
    await readFile(join(otherRoot, projectDirName(OTHER), 'fixtures.json'), 'utf8'),
  );
  const otherSession = otherFixtures.find((row) => row.title === '路由插件设计');
  assert.ok(otherSession, 'second-project fixture missing');
  const otherTarget = join(HOME, 'sessions', projectDirName(OTHER), otherSession.id);
  await mkdir(dirname(otherTarget), { recursive: true });
  await cp(join(otherRoot, projectDirName(OTHER), otherSession.id), otherTarget, { recursive: true });
  await rm(otherRoot, { recursive: true, force: true });
  execFileSync(process.execPath, [join(REPO, 'tools', 'make-fixtures.mjs'), join(HOME, 'sessions')], {
    stdio: 'pipe',
    env: { ...process.env, DSH_RA_PROJECT: PROJECT },
  });
  const fixtures = JSON.parse(await readFile(join(HOME, 'sessions', projectDirName(PROJECT), 'fixtures.json'), 'utf8'));
  const child = fixtures.find((row) => row.title === '登录页：验证码刷新');
  assert.ok(child, 'fixture child missing');
  const boundary = child.boundaries[1] ?? child.boundaries.at(-1);
  await rm(join(PROJECT, '.dsh_RA'), { recursive: true, force: true });
  await mkdir(join(PROJECT, '.dsh_RA', 'proposals'), { recursive: true });
  const now = Date.now();
  // Register the fixture directory as a real Workspace so the DSH sidebar and
  // startup Session are deterministic. The Router panel itself lists every
  // project and scopes the tree to the selected one.
  await mkdir(join(HOME, 'storages'), { recursive: true });
  await writeFile(
    join(HOME, 'storages', 'workspace.json'),
    `${JSON.stringify(
      {
        unit: { name: 'workspace', version: 2 },
        global: {
          initialized: true,
          workspaceIds: ['ui-fixture-workspace'],
          archivedSessionIds: [],
          pinnedSessionIds: [],
        },
        tables: {
          workspaces: {
            'ui-fixture-workspace': {
              path: PROJECT,
              title: 'dsh-ra-test',
              sessionIds: fixtures.map((row) => row.id),
              createdAt: new Date(now - 30 * 24 * 3600_000).toISOString(),
              updatedAt: new Date(now).toISOString(),
            },
          },
        },
      },
      null,
      2,
    )}\n`,
  );
  const proposal = {
    token: 'ui-pending',
    project: PROJECT,
    action: 'fork',
    task: '给验证码刷新补一个端到端用例。',
    targetSessionId: child.id,
    targetTitle: child.title,
    targetLastSeq: child.lastSeq,
    atSeq: boundary.atSeq,
    turn: boundary.turn,
    title: null,
    question: null,
    options: [],
    reason: '「验证码刷新」已经包含 reset 接线；第 3 轮转向焦点顺序，所以从第 2 轮之后分叉，保留刷新上下文。',
    composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
    auto: false,
    status: 'pending',
    createdAt: now,
    expiresAt: now + 3600_000,
    raSessionId: null,
    summary: `从「${child.title}」T${boundary.turn} 分叉（atSeq ${boundary.atSeq}）`,
  };
  await writeFile(join(PROJECT, '.dsh_RA', 'proposals', 'ui-pending.json'), `${JSON.stringify(proposal, null, 2)}\n`);
  const parent = fixtures.find((row) => row.title === '登录页表单校验');
  const autoTarget = fixtures.find((row) => row.title === '用量统计口径');
  const history = [
    {
      id: 'ui-history-1',
      at: new Date(now - 3 * 3600_000).toISOString(),
      task: '登录页表单校验总是误报，帮我定位。',
      action: 'route',
      targetSessionId: parent.id,
      targetTitle: parent.title,
      atSeq: null,
      turn: null,
      reason: '同一功能的延续，直接接回原会话。',
      result: 'sent',
      mode: 'confirm',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
      error: null,
    },
    {
      id: 'ui-history-2',
      at: new Date(now - 2 * 3600_000).toISOString(),
      task: '给验证码刷新补一个端到端用例。',
      action: 'fork',
      targetSessionId: child.id,
      targetTitle: child.title,
      atSeq: boundary.atSeq,
      turn: boundary.turn,
      reason: '后续方向不同，从第 2 轮之后分叉。',
      result: 'forked',
      mode: 'confirm',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: false },
      error: null,
    },
    {
      id: 'ui-history-3',
      at: new Date(now - 3600_000).toISOString(),
      task: '统计口径里缓存命中算不算输入？',
      action: 'route',
      targetSessionId: autoTarget.id,
      targetTitle: autoTarget.title,
      atSeq: null,
      turn: null,
      reason: '已有会话正好讨论用量统计。',
      result: 'auto',
      mode: 'auto',
      composer: { mode: 'standard', permissions: 'workspace-write', auto: true },
      error: null,
    },
  ];
  await writeFile(
    join(PROJECT, '.dsh_RA', 'dispatch.jsonl'),
    `${history.map((row) => JSON.stringify(row)).join('\n')}\n`,
  );
  return { fixtures, child, proposal };
}

async function startServer() {
  const port = await freePort();
  const logPath = join(HOME, 'ui-run.log');
  await mkdir(HOME, { recursive: true });
  const proc = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `""${CLI_WIN}" --profile ui --no-open --port ${port} > "${logPath}" 2>&1"`], {
    env: { ...process.env, DSH_HOME: HOME },
    windowsHide: true,
    stdio: 'ignore',
    windowsVerbatimArguments: true,
  });
  let url = null;
  for (let i = 0; i < 100; i += 1) {
    await sleep(300);
    try {
      const log = await readFile(logPath, 'utf8');
      const match = /http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/.exec(log);
      if (match) {
        url = match[0];
        break;
      }
    } catch {
      // server still starting
    }
  }
  if (!url) {
    proc.kill();
    throw new Error(`DSH Web did not start; see ${logPath}`);
  }
  const response = await fetch(url, { redirect: 'manual' });
  const cookies = response.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((value) => value.split(';')[0]).join('; ');
  const base = new URL(url).origin;
  // First indexing is user-confirmed now; the acceptance profile opts in once
  // the project appears in the Host's session list.
  let started = false;
  let last = null;
  for (let i = 0; i < 120; i += 1) {
    await sleep(250);
    try {
      const state = await fetchJson(`${base}/api/router/state`, cookie);
      last = state;
      if (state.ok && state.onboarding?.status === 'awaiting' && !started) {
        await postJson(`${base}/api/router/api`, cookie, { op: 'onboarding', project: PROJECT, action: 'start' });
        started = true;
      }
      if (state.ok && state.onboarding?.status === 'complete') return { proc, port, base, url, cookie };
    } catch (error) {
      last = String(error?.message ?? error);
    }
  }
  console.error('last state:', JSON.stringify(last)?.slice(0, 800));
  killPort(port);
  killTree(proc);
  throw new Error('Router onboarding did not complete');
}

async function fetchJson(url, cookie) {
  const response = await fetch(url, { headers: { accept: 'application/json', ...(cookie ? { cookie } : {}) } });
  return response.json();
}

async function postJson(url, cookie, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  return response.json();
}

/**
 * Create a Router-preset session in the isolated Host, resolve its Agent, and
 * verify the scoped tool surface. This is the only automated check that the
 * preset's native executor + allow-list actually compose in a real DSH.
 */
async function assertRouterBoundary(server) {
  const created = await postJson(`${server.base}/api/router/api`, server.cookie, {
    op: 'createTestSession',
    cwd: PROJECT,
    agentPreset: 'router',
  });
  assert.ok(created.sessionId, 'Router test session was not created');
  await postJson(`${server.base}/api/router/api`, server.cookie, {
    op: 'applySettings',
    sessionId: created.sessionId,
    composer: { mode: 'standard', permissions: 'workspace-write' },
  });
  // Plan mode and permission presets are target-session settings; the Router
  // preset itself does not mount plan-mode. Exercise them on a normal session.
  const target = await postJson(`${server.base}/api/router/api`, server.cookie, {
    op: 'createTestSession',
    cwd: PROJECT,
  });
  assert.ok(target.sessionId, 'normal target session was not created');
  const dispatch = await postJson(`${server.base}/api/router/api`, server.cookie, {
    op: 'applySettings',
    sessionId: target.sessionId,
    composer: { mode: 'plan', permissions: 'read-only' },
  });
  assert.equal(dispatch.plan?.after, true, 'plan mode did not apply');
  assert.equal(dispatch.permissions?.after, 'read-only', 'permission preset did not apply');
  const debug = await postJson(`${server.base}/api/router/api`, server.cookie, {
    op: 'debugAgent',
    sessionId: created.sessionId,
  });
  const tools = [...(debug.tools ?? [])].sort();
  assert.deepEqual(tools, ['ra_brief', 'ra_history', 'ra_propose', 'ra_tree']);
  console.log('router boundary', JSON.stringify({ preset: debug.preset, tools, dispatch }));
}

async function launchEdge(url) {
  const port = await freePort();
  const profile = join(HOME, `edge-profile-${Date.now()}`);
  const proc = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1440,1000',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    url,
  ], { stdio: 'ignore', windowsHide: true });
  let target = null;
  for (let i = 0; i < 100; i += 1) {
    await sleep(300);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((item) => item.type === 'page' && item.url.startsWith('http://127.0.0.1:'));
      if (target) break;
    } catch {
      // not up yet
    }
  }
  if (!target) {
    killPort(port);
    killTree(proc);
    throw new Error('Edge CDP target not found');
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    ws.onopen = resolveOpen;
    ws.onerror = rejectOpen;
  });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve: resolveCall, reject: rejectCall } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectCall(new Error(JSON.stringify(message.error)));
      else resolveCall(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      errors.push(`${message.params.exceptionDetails.text} ${message.params.exceptionDetails.exception?.description ?? ''}`);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
    }
  };
  const send = (method, params = {}) => new Promise((resolveCall, rejectCall) => {
    const id = ++nextId;
    pending.set(id, { resolve: resolveCall, reject: rejectCall });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(`evaluate failed: ${expression} :: ${JSON.stringify(result.exceptionDetails)}`);
    }
    return result.result?.value;
  };
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(SHOTS, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  await send('Runtime.enable');
  await send('Page.enable');
  return { proc, ws, send, evaluate, screenshot, errors, debugPort: port };
}

async function main() {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });
  await ensureProfile();
  const { child, fixtures } = await seed();
  const server = await startServer();
  await assertRouterBoundary(server);
  // Prebuild the second project's brief so switching projects in the UI does
  // not pause on the onboarding overlay. The session list scan can lag the
  // server becoming ready, so wait until the project is actually listed
  // before the first user-confirmed index starts.
  const norm = (value) => String(value ?? '').replaceAll('\\', '/').toLowerCase();
  let otherListed = null;
  for (let i = 0; i < 80; i += 1) {
    otherListed = await fetchJson(
      `${server.base}/api/router/state?project=${encodeURIComponent(OTHER)}`,
      server.cookie,
    );
    if (norm(otherListed?.selectedProject?.project) === norm(OTHER)) break;
    await sleep(250);
  }
  assert.equal(
    norm(otherListed?.selectedProject?.project),
    norm(OTHER),
    `second project was not listed: ${JSON.stringify(otherListed)?.slice(0, 500)}`,
  );
  await postJson(`${server.base}/api/router/api`, server.cookie, {
    op: 'onboarding',
    project: OTHER,
    action: 'start',
  });
  let otherState = null;
  for (let i = 0; i < 120; i += 1) {
    otherState = await fetchJson(
      `${server.base}/api/router/state?project=${encodeURIComponent(OTHER)}`,
      server.cookie,
    );
    if (otherState.onboarding?.status === 'complete') break;
    await sleep(250);
  }
  assert.equal(otherState?.onboarding?.status, 'complete', 'second project onboarding did not complete');
  const browser = await launchEdge(server.url);
  let failed = false;
  try {
    const { evaluate, screenshot, errors } = browser;
    for (let i = 0; i < 80; i += 1) {
      if (await evaluate("document.readyState === 'complete' && document.body?.innerText.includes('Router')")) break;
      await sleep(300);
    }
    await sleep(1200);
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === '继续');
      if (button) button.click();
    })()`);
    await sleep(500);
    // The empty-account profile may show a second first-run panel. Escape and
    // any explicit close affordance dismiss it; the test then owns the screen.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const open = await evaluate("document.querySelectorAll('[role=\"dialog\"]').length");
      if (!open) break;
      await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await evaluate(`(() => {
        for (const dialog of document.querySelectorAll('[role="dialog"]')) {
          const close = [...dialog.querySelectorAll('button')].find((item) => /关闭|close|×/i.test(item.getAttribute('aria-label') || item.title || item.textContent));
          if (close) close.click();
        }
      })()`);
      await sleep(300);
    }
    const clicked = await evaluate(`(() => {
      const all = [...document.querySelectorAll('button, [role="button"], [role="tab"], a')];
      const hit = all.find((el) => (el.getAttribute('aria-label') || el.textContent || '').trim() === 'Router')
        || all.find((el) => (el.getAttribute('title') || '') === 'Router');
      if (hit) { hit.click(); return true; }
      return false;
    })()`);
    assert.equal(clicked, true, 'Router sidebar entry not clickable');
    await waitFor(evaluate, "document.querySelectorAll('.dra-node').length >= 13", 15000);
    await waitFor(evaluate, "document.querySelector('.dra-project')?.innerText.includes('16 会话')", 10000);

    const summary = await evaluate(`(() => ({
      nodes: document.querySelectorAll('.dra-node').length,
      edges: document.querySelectorAll('.dra-edge').length,
      proposal: document.querySelector('.dra-proposal[data-proposal]')?.innerText ?? '',
      project: document.querySelector('.dra-project [aria-haspopup="listbox"]')?.dataset.value,
      countText: document.querySelector('.dra-project')?.innerText ?? '',
      composer: !!document.querySelector('.dra-composer'),
      search: !!document.querySelector('.dra-search input'),
      onboarding: document.body.innerText.includes('首次接入：建立会话索引'),
      pill: document.querySelector('.dra-project')?.innerText ?? '',
      projectLabel: document.querySelector('.dra-project .dra-select-value')?.textContent ?? '',
    }))()`);
    console.log('summary', JSON.stringify(summary));
    assert.equal(summary.nodes, 13, 'expected 13 tracked nodes');
    assert.equal(summary.edges, 5, 'expected 5 parent→child edges');
    assert.equal(String(summary.project).split(String.fromCharCode(92)).join('/'), PROJECT);
    assert.ok(summary.countText.includes('16 会话'));
    assert.ok(summary.countText.includes('13 跟踪'), 'project label reports the tracked subset');
    assert.equal(summary.onboarding, false, 'onboarding overlay should be gone');
    assert.match(summary.proposal, /T2/);
    assert.match(summary.proposal, /确认发送/);
    assert.match(summary.proposal, /给验证码刷新补一个端到端用例/, 'proposal card shows the original task');
    const composerBox = await evaluate(`(() => {
      const input = document.querySelector('.dra-composer textarea');
      const rect = input?.getBoundingClientRect();
      return rect ? { height: rect.height, rows: input.rows } : null;
    })()`);
    assert.ok(composerBox?.height >= 84, `composer should be taller, got ${composerBox?.height}`);
    assert.equal(composerBox.rows, 3);
    const nodeGauge = await evaluate(`(() => {
      const ring = document.querySelector('.dra-node .dra-ring');
      const svg = ring?.querySelector('svg');
      return {
        ring: !!ring,
        percent: ring?.closest('.dra-ctx')?.querySelector('.dra-ctx-text')?.textContent ?? '',
        fills: svg?.querySelectorAll('.dra-ring-fill').length ?? 0,
        nodeCompress: !!document.querySelector('.dra-node .dra-compress'),
      };
    })()`);
    assert.ok(nodeGauge.ring, 'node context is a ring gauge');
    assert.match(nodeGauge.percent, /%|—/);
    assert.equal(nodeGauge.nodeCompress, false, 'compression lives in the detail panel only');
    await screenshot('01-default');

    // Selecting a node turns the composer into a manual dispatch control with
    // the session name and exactly three actions. Auto mode is disabled here.
    await evaluate(`(() => {
      const node = [...document.querySelectorAll('.dra-node')].find((item) => item.querySelector('.dra-node-title')?.textContent === '登录页表单校验');
      node?.click();
    })()`);
    await waitFor(evaluate, "!!document.querySelector('.dra-manual')", 4000);
    const manual = await evaluate(`(() => ({
      title: document.querySelector('.dra-manual-title')?.textContent ?? '',
      options: [...document.querySelectorAll('.dra-seg-btn')].map((item) => item.textContent.trim()),
      forkDisabled: [...document.querySelectorAll('.dra-seg-btn')].find((item) => item.textContent.trim() === '分叉')?.disabled ?? null,
      autoDisabled: document.querySelector('.dra-auto input')?.disabled ?? null,
      autoManual: document.querySelector('.dra-auto')?.dataset.manual ?? null,
    }))()`);
    assert.match(manual.title, /登录页表单校验/);
    assert.deepEqual(manual.options, ['指定', '分叉', '新会话']);
    assert.equal(manual.forkDisabled, false, 'the seeded session has fork boundaries');
    assert.equal(manual.autoDisabled, true, 'manual dispatch never auto-executes');
    assert.equal(manual.autoManual, 'true');
    await screenshot('15-manual');
    await evaluate("document.querySelector('.dra-manual-clear')?.click()");
    await waitFor(evaluate, "!document.querySelector('.dra-manual')", 3000);

    const caretBefore = await evaluate(`(() => {
      const caret = document.querySelector('.dra-project .dra-caret');
      const rect = caret?.getBoundingClientRect();
      return rect ? { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, tag: caret.tagName.toLowerCase() } : null;
    })()`);
    assert.equal(caretBefore?.tag, 'svg', 'dropdown caret should be an SVG chevron');

    // The project menu is a themed listbox: same type scale as its trigger and
    // rendered inside the panel, not by the OS (the native popup used a larger
    // system font and a blue highlight).
    await evaluate("document.querySelector('.dra-project .dra-select-trigger')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-select-pop')", 4000);
    await sleep(220);
    const projectMenu = await evaluate(`(() => {
      const pop = document.querySelector('.dra-select-pop');
      const options = [...pop.querySelectorAll('[role="option"]')];
      const trigger = document.querySelector('.dra-project .dra-select-trigger');
      return {
        count: options.length,
        selected: pop.querySelectorAll('[data-selected="true"]').length,
        optionFont: options[0] ? getComputedStyle(options[0]).fontSize : null,
        triggerFont: getComputedStyle(trigger).fontSize,
        width: pop.getBoundingClientRect().width,
        triggerWidth: trigger.getBoundingClientRect().width,
        inPanel: Boolean(pop.closest('.dra')),
      };
    })()`);
    console.log('project menu', JSON.stringify(projectMenu));
    assert.equal(projectMenu.count, 2, 'the menu lists every project');
    assert.equal(projectMenu.selected, 1, 'project menu marks the current project');
    assert.equal(projectMenu.optionFont, projectMenu.triggerFont, 'project menu font must match the trigger');
    assert.ok(projectMenu.width >= projectMenu.triggerWidth, 'project menu is at least as wide as its trigger');
    assert.equal(projectMenu.inPanel, true, 'project menu stays inside the panel');
    const caretAfter = await evaluate(`(() => {
      const caret = document.querySelector('.dra-project .dra-caret');
      const rect = caret?.getBoundingClientRect();
      return rect ? { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 } : null;
    })()`);
    assert.ok(
      caretAfter && Math.abs(caretAfter.cx - caretBefore.cx) < 1 && Math.abs(caretAfter.cy - caretBefore.cy) < 1,
      `caret must rotate around its center: ${JSON.stringify({ caretBefore, caretAfter })}`,
    );
    await screenshot('01-project-menu');

    // Selecting another project rebuilds both the canvas and the untracked
    // list, instead of only changing the header label.
    await evaluate(`(() => {
      const option = [...document.querySelectorAll('.dra-select-pop [role="option"]')]
        .find((item) => item.textContent.includes('dsh-ra-ui-other'));
      option?.click();
    })()`);
    await waitFor(evaluate, "document.querySelectorAll('.dra-node').length === 1", 8000);
    assert.match(
      await evaluate("document.querySelector('.dra-project .dra-select-value')?.textContent ?? ''"),
      /dsh-ra-ui-other/,
    );
    assert.equal(
      await evaluate("document.querySelector('.dra-node-title')?.textContent ?? ''"),
      '路由插件设计',
    );
    await evaluate("document.querySelector('button[title=\\\"未跟踪会话\\\"]')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    assert.match(
      await evaluate("document.querySelector('.dra-modal')?.innerText ?? ''"),
      /没有未跟踪的会话/,
      'the untracked list belongs to the selected project',
    );
    await evaluate("document.querySelector('.dra-modal-head button[title=\\\"关闭\\\"]')?.click()");
    await sleep(200);

    // Back to the fixture project: 13 nodes and its untracked sessions return.
    await evaluate("document.querySelector('.dra-project .dra-select-trigger')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-select-pop')", 4000);
    await evaluate(`(() => {
      const option = [...document.querySelectorAll('.dra-select-pop [role="option"]')]
        .find((item) => item.textContent.includes('dsh-ra-ui-test'));
      option?.click();
    })()`);
    await waitFor(evaluate, "document.querySelectorAll('.dra-node').length >= 13", 8000);
    assert.match(
      await evaluate("document.querySelector('.dra-project .dra-select-value')?.textContent ?? ''"),
      /dsh-ra-ui-test/,
    );
    await sleep(400);

    // Child is below its parent in the default vertical layout.
    const geometry = await evaluate(`(() => {
      const find = (title) => [...document.querySelectorAll('.dra-node')].find((node) => node.querySelector('.dra-node-title')?.textContent === title);
      const parent = find('登录页表单校验').getBoundingClientRect();
      const child = find('登录页：验证码刷新').getBoundingClientRect();
      return { parent: parent.toJSON(), child: child.toJSON() };
    })()`);
    assert.ok(geometry.child.top > geometry.parent.bottom, 'vertical fork must grow downward');
    assert.ok(geometry.child.left < geometry.parent.right && geometry.child.right > geometry.parent.left, 'child stays under the parent column');

    // Detail has no overview/lineage/one-liner.
    await evaluate(`(() => {
      const node = [...document.querySelectorAll('.dra-node')].find((item) => item.querySelector('.dra-node-title')?.textContent === '登录页表单校验');
      node.click();
    })()`);
    await sleep(400);
    const detail = await evaluate("document.querySelector('.dra-detail')?.innerText ?? ''");
    assert.match(detail, /上下文/);
    assert.match(detail, /不再跟踪会话/);
    assert.doesNotMatch(detail, /概览|血缘|一句话|分叉点/);
    await screenshot('02-detail');

    // "Open session" must navigate through uiWorkspace with a SessionId, not
    // an object wrapper (which resolves to an unknown target and does nothing).
    const opened = await evaluate(`(() => {
      const button = [...document.querySelectorAll('.dra-detail button')].find((item) => item.textContent.includes('打开会话'));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    assert.equal(opened, true, 'detail open-session button missing');
    await sleep(1200);
    const navigation = await evaluate(`(() => {
      const panel = document.querySelector('.dra');
      return {
        present: Boolean(panel),
        visible: panel ? Boolean(panel.offsetParent) && panel.getBoundingClientRect().width > 0 : false,
        text: document.body.innerText.slice(0, 160),
      };
    })()`);
    console.log('navigation', JSON.stringify(navigation));
    await waitFor(
      evaluate,
      "(() => { const panel = document.querySelector('.dra'); return !panel || !panel.offsetParent || panel.getBoundingClientRect().width === 0; })()",
      10000,
    );
    await sleep(600);
    const reopened = await evaluate(`(() => {
      const all = [...document.querySelectorAll('button, [role="button"], [role="tab"], a')];
      const hit = all.find((el) => (el.getAttribute('aria-label') || el.textContent || '').trim() === 'Router')
        || all.find((el) => (el.getAttribute('title') || '') === 'Router');
      if (hit) { hit.click(); return true; }
      return false;
    })()`);
    assert.equal(reopened, true, 'Router sidebar entry missing after navigation');
    await waitFor(evaluate, "document.querySelectorAll('.dra-node').length >= 13", 15000);
    await sleep(500);

    await evaluate("document.querySelector('.dra-detail button[title=\"关闭详情\"]')?.click()");
    await sleep(300);

    // Search dims non-matches and Enter selects a hit.
    await evaluate(`(() => {
      const input = document.querySelector('.dra-search input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '验证码');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(350);
    const dimmed = await evaluate("document.querySelectorAll('.dra-node[data-dim=\\\"true\\\"]').length");
    assert.ok(dimmed > 0, 'search should dim non-matching nodes');
    await evaluate(`(() => {
      const input = document.querySelector('.dra-search input');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    })()`);
    await sleep(250);
    assert.match(await evaluate("document.querySelector('.dra-detail-title')?.textContent ?? ''"), /验证码/);
    await evaluate(`(() => { const input=document.querySelector('.dra-search input'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,''); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
    await evaluate("document.querySelector('.dra-detail button[title=\"关闭详情\"]')?.click()");
    await sleep(250);

    // Settings: the layout menu is themed and escapes the dialog scroll box;
    // switch to horizontal and verify the fork grows right.
    await evaluate("document.querySelector('button[title=\\\"Router 设置\\\"]')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    const settingsModels = await evaluate(`(() => {
      const trigger = document.querySelector('#dra-ra-model');
      return {
        text: document.querySelector('.dra-modal')?.innerText ?? '',
        raLabel: trigger?.querySelector('.dra-select-value')?.textContent ?? '',
        raDisabled: Boolean(trigger?.disabled),
        hasIndexModel: !!document.querySelector('#dra-index-model'),
        hasAutoAsk: !!document.querySelector('#dra-auto-ask'),
        hasTracking: !!document.querySelector('#dra-tracking-days'),
      };
    })()`);
    assert.equal(settingsModels.hasIndexModel, true, 'settings expose a separate index model');
    assert.equal(settingsModels.hasAutoAsk, true, 'settings expose the auto-ask policy');
    assert.equal(settingsModels.hasTracking, true, 'settings expose the tracking window');
    assert.match(settingsModels.text, /新建和分叉/);
    assert.match(settingsModels.text, /索引模型/);
    if (!settingsModels.raDisabled) {
      assert.ok(
        settingsModels.raLabel && settingsModels.raLabel !== '选择模型',
        `RA model should fall back to a catalog model, got "${settingsModels.raLabel}"`,
      );
    }
    await screenshot('03-settings');
    await evaluate("document.querySelector('#dra-layout')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-select-pop')", 4000);
    await sleep(220);
    const layoutMenu = await evaluate(`(() => {
      const trigger = document.querySelector('#dra-layout');
      const options = [...document.querySelectorAll('.dra-select-pop [role="option"]')];
      return {
        count: options.length,
        optionFont: options[0] ? getComputedStyle(options[0]).fontSize : null,
        triggerFont: getComputedStyle(trigger).fontSize,
        escapedDialog: !options[0]?.closest('.dra-modal'),
      };
    })()`);
    console.log('layout menu', JSON.stringify(layoutMenu));
    assert.equal(layoutMenu.count, 2, 'layout menu should list both orientations');
    assert.equal(layoutMenu.optionFont, layoutMenu.triggerFont, 'layout menu font must match the trigger');
    assert.equal(layoutMenu.escapedDialog, true, 'dropdown must escape the dialog scroll container');
    await screenshot('03-settings-menu');
    await evaluate(`(() => {
      const option = [...document.querySelectorAll('.dra-select-pop [role="option"]')].find((item) => item.dataset.value === 'horizontal');
      option?.click();
    })()`);
    await waitFor(evaluate, "!document.querySelector('.dra-select-pop')", 3000);
    await evaluate(`(() => { const button = [...document.querySelectorAll('.dra-modal button')].find((item) => item.textContent.trim() === '保存'); button.click(); })()`);
    await waitFor(evaluate, "!document.querySelector('.dra-modal')", 5000);
    await sleep(3400);
    const horizontal = await evaluate(`(() => {
      const find = (title) => [...document.querySelectorAll('.dra-node')].find((node) => node.querySelector('.dra-node-title')?.textContent === title);
      const parent = find('登录页表单校验').getBoundingClientRect();
      const child = find('登录页：验证码刷新').getBoundingClientRect();
      return { parent: parent.toJSON(), child: child.toJSON() };
    })()`);
    assert.ok(horizontal.child.left > horizontal.parent.right, 'horizontal fork must grow right');
    await screenshot('04-horizontal');

    // Untracked modal lists the three older fixtures and asks for an explicit
    // checkbox consent before anything can be restored.
    await evaluate("document.querySelector('button[title=\\\"未跟踪会话\\\"]')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    const untracked = await evaluate(`(() => {
      const modal = document.querySelector('.dra-modal');
      const body = modal?.querySelector('.dra-modal-body');
      const foot = modal?.querySelector('.dra-modal-foot');
      const restore = [...(foot?.querySelectorAll('button') ?? [])].find((item) => item.textContent.includes('恢复所选'));
      return {
        text: modal?.innerText ?? '',
        checks: modal?.querySelectorAll('.dra-check').length,
        restoreDisabled: restore?.disabled,
        restoreLabel: restore?.textContent.trim() ?? '',
        bodyOverflow: body ? getComputedStyle(body).overflowY : '',
        modalOverflow: modal ? getComputedStyle(modal).overflow : '',
        footOutside: Boolean(body && foot && !body.contains(foot)),
      };
    })()`);
    assert.match(untracked.text, /旧版：导出修复/);
    assert.match(untracked.text, /旧版：CSV 转义/);
    assert.match(untracked.text, /旧版：登录态过期/);
    assert.doesNotMatch(untracked.text, /勾选同意恢复的会话/, 'the hint line is gone');
    assert.equal(untracked.checks, 3, 'each untracked session gets a checkbox');
    assert.equal(untracked.restoreDisabled, true, 'restore stays disabled until a session is checked');
    assert.equal(untracked.restoreLabel, '恢复所选', 'restore label carries no count');
    assert.equal(untracked.bodyOverflow, 'auto', 'only the dialog body scrolls');
    assert.equal(untracked.modalOverflow, 'hidden', 'the dialog itself does not scroll');
    assert.equal(untracked.footOutside, true, 'the action row sits outside the scrolling body');
    await screenshot('05-untracked');
    // A long list must stay capped and scroll inside the body; the action row
    // must remain pinned at the dialog bottom.
    const capped = await evaluate(`(() => {
      const modal = document.querySelector('.dra-modal-untracked');
      const body = modal?.querySelector('.dra-modal-body');
      const list = body?.querySelector('.dra-list');
      const row = list?.firstElementChild;
      if (!modal || !body || !row) return null;
      for (let i = 0; i < 24; i += 1) list.appendChild(row.cloneNode(true));
      const modalRect = modal.getBoundingClientRect();
      const footRect = modal.querySelector('.dra-modal-foot')?.getBoundingClientRect();
      return {
        modalHeight: modalRect.height,
        viewportHeight: innerHeight,
        bodyScrolls: body.scrollHeight > body.clientHeight,
        footerInside: Boolean(footRect) && Math.abs(footRect.bottom - modalRect.bottom) < 2,
        maxHeight: getComputedStyle(modal).maxHeight,
      };
    })()`);
    assert.ok(capped, 'untracked dialog missing');
    assert.ok(capped.modalHeight <= 561, `dialog height must stay capped, got ${capped.modalHeight}`);
    assert.ok(capped.modalHeight < capped.viewportHeight - 80, 'dialog keeps breathing room around the panel');
    assert.equal(capped.bodyScrolls, true, 'long lists scroll inside the body');
    assert.equal(capped.footerInside, true, 'footer stays at the dialog bottom');
    assert.match(capped.maxHeight, /560px/);
    await screenshot('05-untracked-long');
    await evaluate("document.querySelector('.dra-modal-head button[title=\\\"关闭\\\"]')?.click()");

    // History is the dispatch audit view plus a direct RA-session entry; the
    // duplicate conversation tab and manual refresh are gone.
    await evaluate("document.querySelector('button[title=\\\"派发记录\\\"]')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    const history = await evaluate("document.querySelector('.dra-modal')?.innerText ?? ''");
    assert.match(history, /派发记录/);
    assert.match(history, /打开 RA 会话/);
    assert.doesNotMatch(history, /与 RA 的对话/);
    assert.equal(
      await evaluate(`[...document.querySelectorAll('.dra-modal button')].some((item) => item.textContent.trim() === '刷新')`),
      false,
      'history has no manual refresh button',
    );
    await screenshot('06-history');
    await evaluate("document.querySelector('.dra-modal-head button[title=\\\"关闭\\\"]')?.click()");

    // Stop parent: the child becomes a root; restore reattaches.
    await evaluate(`(() => {
      const node = [...document.querySelectorAll('.dra-node')].find((item) => item.querySelector('.dra-node-title')?.textContent === '登录页表单校验');
      node.click();
    })()`);
    await sleep(300);
    await evaluate(`(() => { const button = [...document.querySelectorAll('.dra-detail button')].find((item) => item.textContent.includes('不再跟踪会话')); button.click(); })()`);
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    await evaluate(`(() => { const button = [...document.querySelectorAll('.dra-modal button')].find((item) => item.textContent.trim() === '停止跟踪'); button.click(); })()`);
    await waitFor(evaluate, "document.querySelectorAll('.dra-node').length === 12", 8000);
    const childAfterStop = await evaluate(`(() => {
      const node = [...document.querySelectorAll('.dra-node')].find((item) => item.querySelector('.dra-node-title')?.textContent === '登录页：验证码刷新');
      return node?.getBoundingClientRect().toJSON();
    })()`);
    assert.ok(childAfterStop, 'child remains tracked after the parent stops');
    await screenshot('07-stop-parent');

    await evaluate("document.querySelector('button[title=\\\"未跟踪会话\\\"]')?.click()");
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    await evaluate(`(() => {
      const row = [...document.querySelectorAll('.dra-modal .dra-check-row')].find((item) => item.innerText.includes('登录页表单校验'));
      row?.querySelector('input[type="checkbox"]')?.click();
    })()`);
    await sleep(200);
    const consent = await evaluate(`(() => {
      const button = [...document.querySelectorAll('.dra-modal-foot button')].find((item) => item.textContent.includes('恢复所选'));
      return {
        disabled: button?.disabled,
        counted: document.querySelector('.dra-modal-count')?.textContent ?? '',
        checks: document.querySelectorAll('.dra-modal .dra-check').length,
      };
    })()`);
    console.log('untracked consent', JSON.stringify(consent));
    assert.equal(consent.checks, 4, 'the stopped parent joins the untracked list');
    assert.equal(consent.disabled, false, 'checking a session enables restore');
    assert.match(consent.counted, /1 \/ 4/);
    await evaluate(`(() => { const button = [...document.querySelectorAll('.dra-modal-foot button')].find((item) => item.textContent.includes('恢复所选')); button?.click(); })()`);
    await waitFor(evaluate, "document.querySelectorAll('.dra-node').length === 13", 8000);
    assert.equal(await evaluate("document.querySelectorAll('.dra-edge').length"), 5);
    await sleep(3400);

    // Compress lives in the detail panel; the button still uses the supplied
    // 1024×1024 glyph and the dialog shows exact usage.
    const compressed = await evaluate(`(() => {
      const node = [...document.querySelectorAll('.dra-node')].find((item) => item.querySelector('.dra-node-title')?.textContent === '登录页表单校验');
      node.click();
      return true;
    })()`);
    assert.equal(compressed, true);
    await sleep(300);
    const detailCompressGlyph = await evaluate(`(() => {
      const button = [...document.querySelectorAll('.dra-detail button')].find((item) => item.textContent.includes('压缩'));
      const svg = button?.querySelector('svg');
      return button ? { viewBox: svg?.getAttribute('viewBox'), paths: svg?.querySelectorAll('path').length } : null;
    })()`);
    assert.deepEqual(
      detailCompressGlyph,
      { viewBox: '0 0 1024 1024', paths: 2 },
      'detail compress icon comes from the supplied SVG',
    );
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('.dra-detail button')].find((item) => item.textContent.includes('压缩'));
      button?.click();
    })()`);
    await waitFor(evaluate, "!!document.querySelector('.dra-modal')", 4000);
    const compressText = await evaluate("document.querySelector('.dra-modal')?.innerText ?? ''");
    assert.match(compressText, /200k/);
    assert.match(compressText, /确认压缩/);
    await screenshot('08-compress');
    await evaluate("document.querySelector('.dra-modal-head button[title=\\\"关闭\\\"]')?.click()");
    // Compressing selected the node; clear the manual target so auto mode is
    // enabled again for the next check.
    await evaluate("document.querySelector('.dra-manual-clear')?.click()");
    await waitFor(evaluate, "!document.querySelector('.dra-manual')", 3000);

    // Auto toggle keeps its label and uses the panel's custom tooltip.
    await evaluate(`(() => {
      const input = document.querySelector('.dra-auto input');
      input.click();
    })()`);
    await sleep(250);
    const autoSwitch = await evaluate(`(() => {
      const label = document.querySelector('.dra-auto');
      return {
        on: label?.dataset.on,
        checked: label?.querySelector('input')?.checked,
        title: label?.getAttribute('title'),
        text: label?.innerText ?? '',
      };
    })()`);
    assert.equal(autoSwitch.on, 'true');
    assert.equal(autoSwitch.checked, true);
    assert.equal(autoSwitch.title, null, 'the native title tooltip is gone');
    assert.equal(autoSwitch.text.trim(), '自动执行');
    await screenshot('09-auto');
    const tipPoint = await evaluate(`(() => {
      const rect = document.querySelector('.dra-auto')?.getBoundingClientRect();
      return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    })()`);
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tipPoint.x, y: tipPoint.y });
    await sleep(280);
    const tip = await evaluate(`(() => {
      const node = document.querySelector('.dra-tip');
      return {
        text: node?.textContent ?? '',
        role: node?.getAttribute('role'),
        background: node ? getComputedStyle(node).backgroundColor : null,
      };
    })()`);
    assert.match(tip.text, /直接执行/);
    assert.equal(tip.role, 'tooltip');
    await screenshot('09-auto-tooltip');
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
    await sleep(150);
    assert.equal(await evaluate("!!document.querySelector('.dra-tip')"), false, 'tooltip hides on leave');
    await evaluate(`(() => { const input=document.querySelector('.dra-auto input'); input.click(); })()`);

    // Zoom controls change the world transform.
    const beforeZoom = await evaluate("document.querySelector('.dra-world')?.style.transform ?? ''");
    await evaluate("document.querySelector('button[title=\\\"放大\\\"]')?.click()");
    await sleep(250);
    const afterZoom = await evaluate("document.querySelector('.dra-world')?.style.transform ?? ''");
    assert.notEqual(beforeZoom, afterZoom);

    // First edit is user-confirmed: reset to the pre-confirmation state, assert
    // the explanation card, then start the real Host queue.
    await rm(join(PROJECT, '.dsh_RA', 'sessions'), { recursive: true, force: true });
    await fetch(`${server.base}/api/router/api`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: server.cookie },
      body: JSON.stringify({ op: 'onboarding', project: PROJECT, action: 'reset' }),
    });
    await waitFor(evaluate, "document.body.innerText.includes('首次接入：建立会话索引')", 8000);
    const onboardingPrompt = await evaluate("document.querySelector('.dra-modal')?.innerText ?? ''");
    assert.match(onboardingPrompt, /开始索引/);
    assert.match(onboardingPrompt, /稍后/);
    await screenshot('10-onboarding');
    await fetch(`${server.base}/api/router/api`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: server.cookie },
      body: JSON.stringify({ op: 'onboarding', project: PROJECT, action: 'start' }),
    });
    await waitFor(evaluate, "!document.body.innerText.includes('首次接入：建立会话索引')", 15000);

    // Narrow viewport: detail overlays the canvas and nothing overflows.
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 780, height: 860, deviceScaleFactor: 1, mobile: false });
    await sleep(700);
    const narrow = await evaluate(`(() => ({
      width: document.querySelector('.dra')?.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      composer: document.querySelector('.dra-composer')?.getBoundingClientRect().toJSON(),
    }))()`);
    assert.ok(narrow.width <= 780);
    assert.ok(narrow.overflow <= 1, 'panel must not overflow horizontally');
    assert.ok(narrow.composer.width > 0);
    // In a narrow panel the composer spans the width; the zoom controls must
    // sit above the measured composer stack instead of underneath it.
    const zoomClear = await evaluate(`(() => {
      const composer = document.querySelector('.dra-composer-wrap').getBoundingClientRect();
      const zoom = document.querySelector('.dra-zoom').getBoundingClientRect();
      return {
        composer: composer.toJSON(),
        zoom: zoom.toJSON(),
        overlap: !(zoom.bottom <= composer.top || zoom.top >= composer.bottom || zoom.right <= composer.left || zoom.left >= composer.right),
      };
    })()`);
    assert.equal(zoomClear.overlap, false, `composer must not cover the zoom controls: ${JSON.stringify(zoomClear)}`);
    assert.ok(zoomClear.zoom.right <= 780, 'zoom controls stay inside the narrow viewport');
    await evaluate(`(() => { const node = document.querySelector('.dra-node'); node?.click(); })()`);
    await sleep(400);
    const narrowDetail = await evaluate(`(() => { const d=document.querySelector('.dra-detail'); if(!d) return null; const r=d.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, width:r.width, viewport:innerWidth }; })()`);
    assert.ok(narrowDetail, 'narrow detail should open');
    assert.ok(narrowDetail.left >= 0 && narrowDetail.right <= narrowDetail.viewport, 'narrow detail must stay inside the viewport');
    await screenshot('11-narrow');

    assert.deepEqual(errors, [], `console errors: ${JSON.stringify(errors)}`);
    console.log('UI acceptance passed');
    console.log(`screenshots: ${SHOTS}`);
  } catch (error) {
    failed = true;
    console.error(error);
    process.exitCode = 1;
  } finally {
    try {
      browser.ws.close();
    } catch {}
    killPort(browser.debugPort);
    killPort(server.port);
    killTree(browser.proc);
    killTree(server.proc);
    if (!failed) await sleep(200);
  }
}

function killPort(port) {
  try {
    const out = execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
    ], { encoding: 'utf8', windowsHide: true });
    for (const pid of out.split(/\s+/).filter(Boolean)) {
      try {
        execFileSync('taskkill.exe', ['/PID', pid, '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      } catch {}
    }
  } catch {}
}

function killStrayUiServers() {
  try {
    execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*--profile ui --no-open*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
    ], { stdio: 'ignore', windowsHide: true });
  } catch {}
}

function killTree(proc) {
  if (!proc?.pid) return;
  try {
    execFileSync('taskkill.exe', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } catch {
    try {
      proc.kill();
    } catch {}
  }
}

async function waitFor(evaluate, expression, timeout) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await sleep(200);
  }
  throw new Error(`timed out waiting for: ${expression}`);
}

await main();
