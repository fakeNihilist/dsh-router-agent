/**
 * Build a deterministic, synthetic V4 session corpus for local UI/integration
 * tests. It writes to an isolated DSH_HOME and never touches real sessions.
 *
 *   node tools/make-fixtures.mjs [sessionsRoot]
 *
 * The log layout mirrors what 0.2.2 writes: one zstd frame holding the session
 * header, then one frame holding the event batch. Event payloads use the public
 * V4 shapes (turn/start, user/message, assistant/message, turn/end,
 * session/title, request/context).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { zstdCompressSync } from 'node:zlib';

const root = process.argv[2] ?? 'D:/tmp/dsh-ra-home/sessions';
const cwd = process.env.DSH_RA_PROJECT ?? 'D:/tmp/dsh-ra-test';
const projectDir = `--${cwd.replace(':', '').replaceAll('/', '-').replaceAll(String.fromCharCode(92), '-')}--`;
const now = Date.now();
const HOUR = 3600_000;
const DAY = 24 * HOUR;

const fixtures = [
  {
    key: 'login',
    title: '登录页表单校验',
    age: 0.6 * HOUR,
    context: 31,
    turns: [
      ['登录页表单校验总是误报，帮我定位。', '已定位到校验规则重复触发：输入事件和提交事件都调用了同一个 validator。'],
      ['把重复触发的那条路径收敛掉。', '已改为只在提交时执行一次同步校验，并保留输入时的轻量提示。'],
    ],
    children: [
      {
        key: 'login-code',
        title: '登录页：验证码刷新',
        age: 0.3 * HOUR,
        context: 62,
        turns: [
          ['验证码刷新后，旧的校验状态没有清空。', '已把验证码组件的 reset 接到表单 reset，刷新后清空错误态。'],
          ['再补一个刷新后的校验用例。', '已补充“刷新后提交空验证码”的用例，并覆盖旧状态清理。'],
          ['顺便检查一下焦点顺序。', '焦点顺序已调整为手机号 → 验证码 → 登录按钮。'],
        ],
      },
    ],
  },
  {
    key: 'dashboard',
    title: '仪表盘图表性能',
    age: 2.2 * HOUR,
    context: 88,
    turns: [
      ['仪表盘图表在 10 万点数据下很卡，看看渲染层。', '已确认主要开销在每次 resize 都重建 SVG path，而不是数据本身。'],
      ['不要改交互，只做性能优化。', '已加入 path 缓存和 rAF 合并，resize 时的重建次数下降了约 80%。'],
      ['把阈值和降级策略记一下。', '已记录：超过 2 万点启用降采样，低于该阈值保持原始精度。'],
    ],
    children: [
      {
        key: 'dashboard-sample',
        title: '图表：大数据量降采样',
        age: 1.4 * HOUR,
        context: 44,
        turns: [
          ['给折线图加一个 LTTB 降采样选项。', '已加入 LTTB 采样器，按目标点数保留极值特征。'],
          ['和现有缓存冲突吗？', '不冲突：采样在数据进入 path 缓存之前完成，缓存键包含采样配置。'],
        ],
      },
    ],
  },
  {
    key: 'export',
    title: '导出功能权限检查',
    age: 5.4 * HOUR,
    context: 12,
    turns: [
      ['导出按钮对只读用户也显示，帮我把权限检查补上。', '已在导出入口增加 canExport 判定，只读用户隐藏按钮并阻止快捷导出。'],
      ['后端接口也要挡住，不能只在前端藏按钮。', '已在导出接口增加同一权限检查，前端隐藏只是第一层。'],
    ],
    children: [
      {
        key: 'export-csv',
        title: '导出：CSV 编码',
        age: 3.1 * HOUR,
        context: 27,
        turns: [
          ['CSV 导出在 Excel 里中文乱码。', '已加 UTF-8 BOM，并统一使用 CRLF 行尾。'],
          ['把编码选项做成显式配置。', '已增加 encoding 选项，默认 UTF-8-BOM，保留 UTF-8 原始模式。'],
        ],
      },
    ],
  },
  {
    key: 'router',
    title: '路由插件设计',
    age: 6.5 * HOUR,
    context: 96,
    turns: [
      ['把 Router 的会话路由、分叉和新建三种动作写清楚。', '已整理三种动作的边界：继续复用上下文，分叉保留到某一轮，新建完全干净。'],
      ['确认分叉点的表示方式。', '分叉点落在 turn/end 的 atSeq，界面显示 Tn，内部不存消息 id。'],
      ['检查停止父会话的语义。', '停止父会话只停父本身，跟踪中的子会话移到顶层，恢复后自动回挂。'],
      ['把默认跟踪范围补上。', '默认只跟踪最近 7 天有活动的会话，更早的进入未跟踪列表。'],
    ],
    children: [
      {
        key: 'router-fork',
        title: '路由：分叉边界',
        age: 4.2 * HOUR,
        context: 73,
        turns: [
          ['分叉边界怎么保证不会切在半个 turn 里？', '只接受 turn/end 的 seq，fork 时原样传 atSeq。'],
          ['如果目标会话在提议后又有新消息呢？', '确认时校验 lastSeq，目标已变化就返回 409，让用户重新判断。'],
        ],
      },
    ],
  },
  {
    key: 'notify',
    title: '消息通知插件',
    age: 1.1 * DAY,
    context: 58,
    turns: [
      ['通知插件在会话结束后还会重复弹。', '已把通知去重键改成 turn/end 的 event seq，重放不会再次弹出。'],
      ['加一个免打扰时段。', '已增加 quietHours 配置，命中时段只记账不弹窗。'],
    ],
    children: [
      {
        key: 'notify-badge',
        title: '通知：桌面角标',
        age: 0.8 * DAY,
        context: 35,
        turns: [
          ['桌面端角标数不准确。', '角标改为读取未读会话数，而不是未读消息数。'],
          ['切换会话后应该清零。', '已在会话切换时标记已读并重算角标。'],
        ],
      },
    ],
  },
  {
    key: 'usage',
    title: '用量统计口径',
    age: 2.6 * DAY,
    context: 21,
    turns: [
      ['用量统计里缓存命中算不算输入？', '缓存命中单列，不与未缓存输入重复计入总输入。'],
      ['按天聚合时跨时区怎么办？', '按客户端时区切日，服务端只保存时间戳。'],
    ],
  },
  {
    key: 'theme',
    title: '主题切换与缓存',
    age: 4.9 * DAY,
    context: 67,
    turns: [
      ['主题切换后刷新会闪一下深色。', '已在首屏前写入 color-scheme，避免默认深色先绘制。'],
      ['把用户选择持久化。', '已持久化到 profile 设置，并在启动时同步读取。'],
    ],
  },
  {
    key: 'search',
    title: '会话搜索定位',
    age: 6.4 * DAY,
    context: 42,
    turns: [
      ['搜索结果点进去后没有定位到消息。', '已把命中的 messageSeq 传给会话打开参数，并滚动到对应节点。'],
      ['高亮不要改 DOM。', '使用 CSS Custom Highlight API，搜索不会改动 React 拥有的节点。'],
    ],
  },
  {
    key: 'stale-export',
    title: '旧版：导出修复',
    age: 11 * DAY,
    context: 18,
    turns: [
      ['旧版导出的空行问题还在。', '已过滤末尾空行，并在写文件前统一换行。'],
    ],
    children: [
      {
        key: 'stale-csv',
        title: '旧版：CSV 转义',
        age: 12 * DAY,
        context: 24,
        turns: [
          ['字段里带引号时 CSV 会错列。', '已按 RFC 4180 双写引号并包裹字段。'],
        ],
      },
    ],
  },
  {
    key: 'stale-auth',
    title: '旧版：登录态过期',
    age: 18 * DAY,
    context: 55,
    turns: [
      ['登录态过期后没有跳回登录页。', '已统一处理 401，清理本地 token 并触发登录跳转。'],
    ],
  },
];

let seq = 0;
let timeCursor = 0;

function event(type, data, time) {
  return { type, seq: seq++, time, data };
}

function buildSession(fixture) {
  const started = now - fixture.age;
  const id = `session-${randomUUID()}`;
  seq = 0;
  timeCursor = started;
  const events = [];
  const tick = () => (timeCursor += 7);
  events.push(event('permission/preset', { preset: 'workspace-write' }, tick()));
  events.push(event('sandbox/mode', { mode: 'workspace-write' }, tick()));
  events.push(event('approval/policy', { policy: 'ask' }, tick()));
  const firstUserSeq = [];
  fixture.turns.forEach(([prompt, answer], index) => {
    const turn = index + 1;
    events.push(event('turn/start', { turn }, tick()));
    events.push(event('step/start', { turn, step: 1 }, tick()));
    const userSeq = seq;
    firstUserSeq.push(userSeq);
    events.push(
      event(
        'user/message',
        {
          content: [{ type: 'text', text: prompt }],
          source: { kind: 'user', rpcId: randomUUID(), clientTimeZone: 'Asia/Shanghai' },
          role: 'user',
          id: randomUUID(),
        },
        tick(),
      ),
    );
    // V4 marks every current-surface event explicitly; omission is interpreted
    // as a replacement range and fails validation.
    events.at(-1).surfaceOp = 'append';
    events.push(
      event(
        'request/context',
        { provider: 'deepseek-official', model: 'deepseek-flash', contextWindow: 200000, systemPromptUpdate: 'in-history' },
        tick(),
      ),
    );
    const pressure = fixture.context * 2000;
    events.push(
      event(
        'assistant/message',
        {
          turn,
          step: 1,
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: answer }],
            id: randomUUID(),
            // V4 requires a producer-owned source kind and an identified
            // message on assistant messages.
            source: {
              kind: 'model',
              provider: 'deepseek-official',
              model: 'deepseek-flash',
              replayState: {
                response: { kind: 'deepseek-messages', version: 1, model: 'deepseek-flash' },
                blocks: [{ type: 'text' }],
              },
            },
          },
          stream: [],
          usage: {
            inputTokens: Math.floor(pressure * 0.7),
            outputTokens: 400 + turn * 120,
            cacheReadTokens: Math.floor(pressure * 0.3),
            cacheWriteTokens: 0,
            totalTokens: pressure + 400 + turn * 120,
          },
        },
        tick(),
      ),
    );
    events.at(-1).surfaceOp = 'append';
    events.push(event('step/end', { turn, step: 1 }, tick()));
    events.push(event('turn/end', { turn, reason: 'success' }, tick()));
  });
  events.push(
    event(
      'session/title',
      { title: fixture.title, messageSeqs: [firstUserSeq[0]], source: { kind: 'fallback' } },
      tick(),
    ),
  );
  return {
    id,
    header: {
      type: 'session',
      version: 4,
      id,
      createdAt: started,
      cwd,
      ...(fixture.parent ? { parentSession: fixture.parent } : {}),
      isSeeded: false,
      delegationDepth: 0,
      agentPreset: 'standard',
    },
    events,
  };
}

function flatten(list, parent) {
  const rows = [];
  for (const fixture of list) {
    const row = { ...fixture, parent };
    rows.push(row);
    if (fixture.children) rows.push(...flatten(fixture.children, null));
  }
  return rows;
}

// Children are built after their parent so the parent's id can be recorded,
// while the public fixture list stays declarative.
const built = [];
async function emit(fixture, parent) {
  const row = { ...fixture, parent: parent?.id };
  const session = buildSession(row);
  const dir = join(root, projectDir, session.id);
  await mkdir(dir, { recursive: true });
  const headerLine = `${JSON.stringify(session.header)}\n`;
  const body = `${session.events.map((value) => JSON.stringify(value)).join('\n')}\n`;
  await writeFile(
    join(dir, 'session.v4.jsonl.zstd'),
    Buffer.concat([zstdCompressSync(Buffer.from(headerLine)), zstdCompressSync(Buffer.from(body))]),
  );
  built.push({
    id: session.id,
    title: fixture.title,
    parent: row.parent,
    age: fixture.age,
    context: fixture.context,
    lastSeq: session.events.at(-1)?.seq ?? -1,
    boundaries: session.events
      .filter((value) => value.type === 'turn/end')
      .map((value) => ({ turn: value.data.turn, atSeq: value.seq })),
  });
  for (const child of fixture.children ?? []) await emit(child, session);
}

await rm(join(root, projectDir), { recursive: true, force: true });
await mkdir(join(root, projectDir), { recursive: true });
for (const fixture of fixtures) await emit(fixture, null);
await writeFile(join(root, projectDir, 'fixtures.json'), `${JSON.stringify(built, null, 2)}\n`);
console.log(`wrote ${built.length} synthetic sessions to ${join(root, projectDir)}`);
for (const row of built) {
  console.log(`  ${row.id}  ${row.parent ? 'child of ' + row.parent : 'root'}  ${row.title}`);
}
