# dsh-router-agent 可执行实现计划

> 配套 `DESIGN.md`。`DESIGN.md` 定义产品形态；本文件是可交给实现者 / DSH 创造模式执行的工程规格。
> 目标版本：DSH Desktop `0.2.2-rc.x`（已安装 `0.2.2-rc.5`，session format V4），并尽量兼容 `0.2.1` / `0.1.5` 的已读 API。
> **M0 必须先做能力探测。** 本计划中所有未在 0.2.2 上实测的接口都有 probe 与降级方案，禁止静默假装成功。

---

## 0. 这份计划怎么用

1. 先做 **M0：能力探测 + 插件空壳**。确认 DSH 实际暴露的 session/fork/compact/plan/permission/projection/slot 能力。
2. 按 M1 → M8 顺序实现；每个里程碑都有独立验收，做完再进入下一个。
3. 每个里程碑结束：更新 `README`、截图、`CHANGELOG`；不要跨里程碑堆功能。
4. 任何 API 不存在时，按本计划的 fallback 实现，并在 UI/诊断中明示；不允许“看起来成功”。
5. 最后用本文件的第 16 节测试矩阵和第 15 节功能矩阵逐项验收。

### 0.1 实现者启动提示词

```text
你在 D:/code/dsh-router-agent 实现 dsh-router-agent。
先完整阅读 PLAN.md 和 DESIGN.md；API 细节以 PLAN.md 第 2/3 节为准。
从 M0 开始：建立 profile bundle 空壳、router preset、主面板、能力探测，并输出 probe 结果；
不要跳过 probe，不要假设 fork/compact/plan/permission/context projection 一定存在。
每完成一个里程碑，运行该里程碑测试并更新 STATUS.md；不要提前实现后续里程碑。
不要修改真实项目的会话（路径与名称已脱敏）；集成测试使用 D:/tmp 下的隔离 profile 和测试工作区。
```

---

## 1. 目标与不可协商约束

### 1.1 产品一句话

一个项目一个 Router Agent（RA）。RA 不读代码、不写代码，只判断：
**继续已有会话 / 从某轮分叉 / 新建干净会话。**
主界面是横向铺开的无限画布：根节点按最后活跃排序，分叉向下（默认纵向）或向右（横向设置），
每个节点显示上下文占用并可压缩；详情不展示概览、一句话、血缘。

### 1.2 必须实现的功能（全量）

1. 项目级 RA；每项目一个真实 DSH 会话，RA 不出现在画布节点里。
2. RA 只有 4 个只读/提议工具：`ra_tree` / `ra_brief` / `ra_history` / `ra_propose`；没有 fs/bash/web/subagent/workflow。
3. 三种动作：继续 / 分叉 / 新建；外加追问 `ask`。
4. 分叉：RA 从任务边界中提议，用户可改；落到具体 `atSeq`；子节点在父节点下方（纵向）或右侧（横向）。
5. 新建：干净启动，首条消息就是任务原文；无交接包；可指定新会话默认模型。
6. 自动执行模式：默认关闭；开启后 RA 判断完由 Host 校验后直接执行，不再要用户确认；`ask` 在自动模式禁用/转为明确选择。
7. 画布：无限平移/缩放、适应画布、回到最近；纵向/横向两种排列；搜索变淡 + Enter 定位。
8. 节点：名称、最后活跃、上下文百分比 + 2px 条 + 压缩图标；运行中呼吸动效；待确认虚线；选中实线；刚创建闪烁。
9. 详情：名称、状态/轮数/最后活跃、打开、分叉点、上下文精确用量 + 压缩、停止跟踪；无概览、无一句话、无血缘。
10. 上下文占用：读取 session projection / 事件汇总；百分比和条；颜色阈值 60/85。
11. 压缩上下文：确认弹层；调用 Host 压缩；运行中排队；不可用则隐藏/置灰。
12. 停止跟踪：确认后从 RA 上下文与画布移除；可撤销；`⋯ → 未跟踪会话` 恢复。
13. 停止父会话：只停父；跟踪中的子会话移到顶层继续跟踪；恢复父会话后自动回挂。
14. 默认只跟踪最近 7 天有活动的会话；更早的进入未跟踪列表；首次接入只索引跟踪范围。
15. 首次接入全量预生成：进度、可恢复队列、失败降级；完成前不开放路由。
16. 增量更新：`turn/end` 防抖更新内部索引/上下文；直接对话也更新。
17. 设置：节点排列（纵向/横向）、RA 模型、新会话默认模型；写入 `.dsh_RA`。
18. 输入区：标准/计划模式、工作区权限（只读/工作区内修改/完全访问）、自动执行；提议卡显示；按会话级生效并明示。
19. 与 RA 的对话历史：头部时钟打开；任务、动作、目标、理由、结果（已发送/已创建/已新建/自动执行/未执行/失败）。
20. 数据：项目根 `.dsh_RA/`；原子写；默认 `.gitignore`。
21. 顶部无“较早–最近活跃”、无跟踪数；搜索占位“搜索会话”；无右侧“最近活跃 →”；底部无“拖动平移 · 滚轮缩放”。
22. 主题：`--dsw-*` token；深/浅色；容器查询；窄面板。
23. 安装：profile bundle + `dsh plugin add`；客户端 bundle 无构建或 esbuild 构建；桌面端缓存处理。
24. 测试：单元、Host 集成、真实 Headless 浏览器 UI、能力探测；验收矩阵。

### 1.3 不可协商

- **RA 不读代码、不写代码**：由 preset 的插件列表 + `ctx.tools.restrict` 保证，不靠提示词。
- **默认必须确认才发送**；自动执行只能由用户显式开启，默认关闭，保留 token/lastSeq 校验。
- **不改写会话历史**；brief/tracking/settings 全在 sidecar。
- **不覆盖有意义的原生标题**；自动命名只补空白/无意义标题，用户改名才调原生 rename。
- **不做交接包**；新建首条消息是任务原文。
- **界面不展示概览/一句话/血缘/T9/分支数**；树形连线是唯一的父子表达。
- **停止父会话 ≠ 停整棵子树**；子会话移到顶层继续跟踪。
- **默认只跟踪最近 7 天**；更早会话未跟踪、可恢复。
- **压缩/停止跟踪/恢复**都是用户直接动作，不经过 RA；压缩/停止有确认。
- **数据 `.dsh_RA`** 是产品要求；它不是 DSH 官方 storageDomain，需自管原子性/锁/gitignore。

---

## 2. 版本事实与 API 修正

### 2.1 目标环境

| 项 | 事实 |
|---|---|
| 已安装桌面端 | `D:/deepseek harness`，`app.asar` 内为 `0.2.2-rc.5` |
| 主文档 | `C:/Users/user/AppData/Local/Temp/dshdocs`，版本 `0.2.2-rc.1` |
| 可读 npm 包 | `C:/Users/user/.dsh/profiles/node_modules/@deepseek-ai/*`，`0.1.5-rc.2` |
| 解包笔记 | `D:/code/_notes/asar-extract/dsh/node_modules/@deepseek-ai/*`，`0.2.1-rc.2` |
| Session format | V4（0.2.2；0.1.5 为 V3） |
| 桌面 profile | `C:/Users/user/.dsh/profiles/desktop`，`patchReload: live` |

**结论**：代码必须做能力探测；不要按 0.1.5 的类型定义硬编码 0.2.2 行为。

### 2.2 DESIGN.md 与真实 API 的修正表

| DESIGN 里的写法 | 真实 API | 实现修正 |
|---|---|---|
| 注册 `main` 面板带 `options.id` | `main` 是 **keyed** 槽；`sidebar.panellist` 是 list 槽 | `main`: `{ name:'main', key: PANEL_ID }`；`sidebar.panellist`: `{ name:'sidebar.panellist', id: PANEL_ID, order, label }` |
| HTTP `/router/...` | 插件浏览器 API 应走认证的 `/api` exact Fetch 路由 | 全部改为 `/api/router/...`，用 `ctx.connection.fetch.register({ path, methods, requestBody:'buffered', fetch })` |
| 分叉传 `messageId` | `sessionController.fork({ sessionId, atSeq })`；`atSeq` 是事件 seq，不是消息 id | brief 的边界存 `turn + atSeq + messageId`；派发用 `atSeq`；UI 显示 Tn |
| 上下文占用来自事件 | 没有 `context/usage` 事件；读 `sessionProjections` / `sessionController.projections`；持久兜底是 `assistant/message.usage` + `request/context.contextWindow` | 写 `ContextUsage` helper，按 projection → fold 顺序降级 |
| 压缩调用一个 `compact()` | 没有 `session.compact` Remote；Host `ctx.compaction.compactNow` / `/compact` 命令 | 用 `ctx.commands.execute(sessionId,'/compact',[])` 为主；`ctx.compaction` 为降级；需 live idle agent |
| 模式/权限按 prompt 传 | `sessionController.prompt` 只有 `{requestId, sessionId, mode:'queue'|'steer', content, clientTimeZone?}` | 计划/权限是 **会话级**；派发时显式改变目标会话并告知，或只对新会话生效 |
| 新会话指定模型 | `session.create` 没有 `model`；模型是会话级 `selectModel` / agent create `agentOptions` | 用 `ctx.agents.create({ agentOptions })` 或 create 后 `selectModel`；避免改部署默认 |
| 0.2.2 普通 fork 带 `parentSession` | **0.2.2 普通 fork 不写 `parentSession`**；只带 `isSeeded`/seed | 插件自己写 `.dsh_RA` lineage；已有 fork 用 `parentSession` → `Fork of` 标题 → unknown |
| 预设可以由动态 Cordis 注册 | 不能；preset 必须是 profile bundle 的 `@deepseek-ai/dsh-agent-preset` 行 | 发布 bundle；`plugins` 列表就是工具白名单；`ctx.tools.restrict` 过滤继承工具 |
| 数据用全局 storages | 产品要求项目 `.dsh_RA` | 保留项目 sidecar；自己实现 atomicWrite + lock，并在文档说明这是官方 storageDomain 的例外 |
| RA 模型在 preset 里 | preset 不定义模型；模型是 session/deployment 级 | RA 创建/恢复时用 `agentOptions` 或 `agent.model.select`；设置变化时更新 RA 会话 |

### 2.3 关键 API 事实（写代码时对照）

- **Session list（Host）**：`ctx.sessionController.list({})` 返回 `SessionSummary[]`（`sessionId/updatedAt/running/cwd/parentSessionId/origin/blank/agentAvailable/formatStatus/projections`）；没有 cwd 过滤，需按 `cwd` 过滤。兜底：`ctx.sessionQuery.listSessions()` / `filterSessions([{kind:'cwd',values:[cwd]}])`。
- **Session record（Host）**：`ctx.sessionQuery.readSession(id)` → `{session, inheritedEventCount, events}`；live 用 `ctx.sessions.get(id)` + `snapshotEvents()`。照抄 tree-view 的 `readSessionRecord` 归一化模式。
- **Fork（0.2.2）**：`ctx.sessionController.fork({ sessionId, atSeq, allowMigration:true })`；`atSeq` 是 inclusive event seq；省略取最后一个完成轮次；open turn 会补 synthetic closers。0.1.5 的 `atSeq` 是 anchor，落到第一个 `>= atSeq` 的 `turn/end`；因此边界要存 `turn/end` 的 seq。
- **Compaction**：Host `ctx.compaction.compactNow(agent, signal, sourceCommandId?)` 或 `/compact`；需要 idle agent；错误码 `busy/cancelled/changed/summary/commit/persistence`；没有 Remote compact。
- **Context**：`ctx.sessionProjections.snapshot(session,['contextPressure','tokenUsage'])`，或 `ctx.sessionController.projections({sessionId})`；`pressureTokens/contextWindow` → percent；兜底 fold `assistant/message.data.usage.inputTokens` + `request/context.data.contextWindow`。
- **Plan mode**：`ctx.planMode.get(agent)` / `.set(agent, active)`；`plan` projection；`plan/mode` 事件；`/plan` 命令。
- **Permissions**：`ctx.permissionPresets.catalog()` / `.current(session)` / `.set(session,name)`；默认 `workspace-write` / `danger-full-access`；只读可用 `ctx.sandboxPolicy.setSandboxMode(session,'read-only')` + `ctx.approval.setPolicy(agent,'ask')`（若 catalog 没有 read-only preset）。
- **Model catalog**：`ctx.sessionController.modelCatalog()` → `{default, groups, failures}`；`selectModel({sessionId, provider, model, reasoningEffort?})`；`session.create` 不接受 model。
- **Preset**：`@deepseek-ai/dsh-agent-preset` Loader 行 `{id, name?, description?, order?, plugins:[...]}`；`plugins` 是唯一组合；`ctx.tools.restrict({allow,deny})` 过滤继承工具（不影响本 scope 自己的注册）。
- **LLM**：`ctx.llm.stream({ provider, model, messages, system?, temperature?, maxTokens?, signal? })` → `AsyncIterable<StreamChunk>`；文本 delta `type:'text-delta'`；`finish/usage`。用于摘要。
- **Client panel**：`ctx.slots.register({ name:'main', key: PANEL_ID }, Panel)` + `{name:'sidebar.panellist', id:PANEL_ID}`；客户端 `ctx.sessions.list` 提供 running/current snapshot；`ctx.sessions.open(id)` 或 `uiWorkspace.openSession(id)` 打开会话。
- **HTTP**：`ctx.connection.fetch.register({ path:'/api/router/...', methods, requestBody:'buffered', fetch })`；客户端 fetch 用文档相对 `api/router/...`。
- **自定义服务**：`ctx.provide('routerAgent', service)`；preset 工具插件 `inject:['routerAgent']`。`ctx.provide` 返回 disposer（Cordis `ReflectService`）。
- **RA 会话**：`ctx.agents.create({ sessionId, meta:{ cwd, agentPreset:'router' }, agentOptions:{provider,model,reasoningEffort?}, setup })`；`ctx.sessions.flush(agent.session)`；cold resume 用 `ctx.agents.resume({ resumeSessionId, agentOptions })`。
- **Prompt**：Host `ctx.sessionController.prompt({ requestId, sessionId, mode:'queue', content:[{type:'text',text}], clientTimeZone? }, signal)`；`signal` 必传；`requestId` 唯一；忙则排队。
- **Title**：`session/title` 事件是原生标题的持久来源；`ctx.get('sessionTitle')?.rename(session,title)` 是尽力路径；sidecar 标题优先展示。

---

## 3. 能力探测（M0）

### 3.1 探测清单

在真实 DSH 0.2.2 profile 上探测并记录到 `.dsh_RA/diagnostics/probe.json`：

| 能力 | 探测方式 | 缺失时 |
|---|---|---|
| `sessionController.list` | typeof `ctx.sessionController?.list === 'function'` | 用 `sessionQuery.listSessions()` |
| `sessionQuery.readSession` / `observeSession` | typeof | 只支持 live？标记 cold 读取不可用 |
| `sessionController.fork` | typeof，且试一次 fork 到临时测试会话 | 用 `ctx.sessions.fork`（live only）；再不行降级新建 |
| `ctx.sessionProjections` | typeof `.snapshot` | 用 `sessionController.projections`；再不行 fold |
| `sessionController.projections` | typeof | fold |
| `ctx.compaction.compactNow` / commands `/compact` | typeof + 一次测试 | 隐藏压缩按钮 |
| `ctx.planMode.set` / `/plan` | typeof | 计划模式控件显示“不支持” |
| `ctx.permissionPresets.catalog/set` | typeof | 用 sandbox/approval；再不行禁权控件 |
| `ctx.sandboxPolicy.setSandboxMode` / `ctx.approval.setPolicy` | typeof | 权限只对新会话/不生效 |
| `sessionController.modelCatalog` | typeof | 用 `ctx.llm.listProviders/listModels` |
| `ctx.llm.stream` | typeof | 摘要降级为抽取式 |
| `ctx.agentPresets` / preset row | 启动 preset 是否能创建 RA agent | 整体功能不可用，明确报错 |
| `ctx.connection.fetch.register` | typeof | 不可用则 panel 无法取数据，阻塞 |
| `ctx.slots` / main keyed / sidebar list | 启动后注册一个占位面板 | 按 slot 错误定位 |
| `ctx.tools.restrict` | typeof | preset 只靠 plugins 列表；仍无 fs/bash |
| `ctx.sessionTitle.rename` | typeof | 只写 sidecar 标题 |

### 3.2 Probe 代码骨架

`src/host/probe.js`：

```js
export function probeHost(ctx) {
  const has = (o, m) => !!(o && typeof o[m] === 'function');
  const result = {
    version: ctx.app?.version ?? null,
    sessionController: {
      list: has(ctx.sessionController, 'list'),
      fork: has(ctx.sessionController, 'fork'),
      prompt: has(ctx.sessionController, 'prompt'),
      projections: has(ctx.sessionController, 'projections'),
      modelCatalog: has(ctx.sessionController, 'modelCatalog'),
    },
    sessionQuery: {
      listSessions: has(ctx.sessionQuery, 'listSessions'),
      filterSessions: has(ctx.sessionQuery, 'filterSessions'),
      readSession: has(ctx.sessionQuery, 'readSession'),
      observeSession: has(ctx.sessionQuery, 'observeSession'),
    },
    projections: has(ctx.sessionProjections, 'snapshot'),
    compaction: has(ctx.compaction, 'compactNow'),
    commands: has(ctx.commands, 'execute'),
    planMode: has(ctx.planMode, 'set'),
    permissionPresets: has(ctx.permissionPresets, 'set'),
    sandboxPolicy: has(ctx.sandboxPolicy, 'setSandboxMode'),
    approval: has(ctx.approval, 'setPolicy'),
    llmStream: has(ctx.llm, 'stream'),
    fetch: !!(ctx.get('connection')?.fetch?.register),
    tools: has(ctx.tools, 'register') && has(ctx.tools, 'restrict'),
  };
  return result;
}
```

探测结果写 `.dsh_RA/diagnostics/probe.json`；每次启动版本变化时重跑。UI 的 disabled 状态由 probe 驱动。

---

## 4. 总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│ DSH Host 进程                                                 │
│                                                              │
│  dsh-router-agent (host plugin)                              │
│   ├─ RouterService (ctx.provide('routerAgent'))              │
│   │   ├─ ProjectStore  ── .dsh_RA/                           │
│   │   ├─ SessionReader ── sessionQuery/sessionController     │
│   │   ├─ LineageResolver                                     │
│   │   ├─ BriefPipeline (LLM summarizer + queue)              │
│   │   ├─ ContextUsage                                        │
│   │   ├─ DispatchService (route/fork/new/confirm/auto)       │
│   │   ├─ RaSessionManager                                    │
│   │   └─ HistoryLog                                          │
│   ├─ HTTP exact routes under /api/router/*                    │
│   └─ session/event subscription                              │
│                                                              │
│  router preset (@deepseek-ai/dsh-agent-preset)               │
│   └─ router-tools plugin (inject routerAgent)                │
│       ├─ ra_tree / ra_brief / ra_history / ra_propose        │
│       ├─ systemPrompt.section(router policy)                 │
│       └─ tools.restrict({ allow: [...4] })                   │
│                                                              │
│  RA session (real DSH session, agentPreset:'router')         │
└──────────────────────────────────────────────────────────────┘
             ▲ /api/router/* (authenticated exact fetch)
             │
┌────────────┴─────────────────────────────────────────────────┐
│ DSH Web Client                                                │
│  client plugin: main panel (keyed) + sidebar.panellist       │
│   ├─ RouterPanel (React)                                     │
│   ├─ Canvas (vertical/horizontal, pan/zoom)                  │
│   ├─ Node cards / Detail / Modals / Composer                 │
│   ├─ Settings / History / Onboarding                         │
│   └─ poll pending proposals + refresh tree                   │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 职责边界

- Host：所有 session 读写、fork/compact/plan/permission 调用、LLM 摘要、sidecar、HTTP。
- RA：只读工具 + 提议；绝不执行。
- Client：只读 Host API、渲染、用户确认/设置/输入；不直接改会话。
- Auto：Host 在用户开启后自动执行；RA 仍然只提议。

---

## 5. 仓库、构建与安装

### 5.1 目录

```text
dsh-router-agent/
  package.json
  cordis.patch.yml
  esbuild.mjs
  README.md
  DESIGN.md
  PLAN.md
  src/
    host/
      index.js            # host plugin apply/inject/provide/routes/events
      router-service.js
      project-store.js
      session-reader.js
      lineage.js
      brief/
        extract.js
        prompt.js
        summarize.js
        queue.js
        merge.js
      context-usage.js
      dispatch.js
      ra-session.js
      history.js
      settings.js
      probe.js
      http.js
      util/
        atomic.js
        lock.js
        json.js
        log.js
    router-tools.js       # preset-scoped tool plugin
    prompts/
      ra-system.md
      summarize.md
      summarize-repair.md
      title.md
    client/
      index.jsx           # __ModuleLoader__ wrapper entry
      RouterPanel.jsx
      Canvas.jsx
      NodeCard.jsx
      Detail.jsx
      Composer.jsx
      ProposalThread.jsx
      SettingsModal.jsx
      HistoryModal.jsx
      UntrackedModal.jsx
      Onboarding.jsx
      layout.js           # pure vertical/horizontal layout
      api.js              # fetch api/router/*
      css.js
      store.js
  test/
    unit/
    host/
    ui/
  tools/
    probe.mjs
  docs/
    API.md
    ACCEPTANCE.md
    TROUBLESHOOTING.md
```

### 5.2 package.json

```json
{
  "name": "dsh-router-agent",
  "version": "0.1.0",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./router-tools": "./lib/router-tools.js",
    "./client": "./lib/client.js",
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./package.json": "./package.json"
  },
  "files": [
    "lib/",
    "cordis.patch.yml",
    "README.md"
  ],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": [
        "@deepseek-ai/dsh-api-session-controller",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-renderer",
        "@deepseek-ai/dsh-client-ui-session",
        "@deepseek-ai/dsh-client-modules"
      ]
    }
  },
  "engines": { "dsh": ">=0.2.0 <0.3.0" },
  "scripts": {
    "build": "node esbuild.mjs",
    "probe": "node tools/probe.mjs",
    "test": "node --test test/unit test/host",
    "test:ui": "node test/ui/run.mjs",
    "check": "npm run build && npm test"
  }
}
```

- 客户端 bundle 由 esbuild 生成；`lib/client.js` 外面套 `window.__ModuleLoader__.load({ id:'dsh-router-agent', factory })`。
- Host bundle 可保留 ESM；`router-tools.js` 单独输出，供 preset 子行 `name:'dsh-router-agent/router-tools'` 引用。
- 不把 `@deepseek-ai/dsh-*` 打进 client bundle；它们从平台模块表 `require()`。
- Host 不 import DSH 包（只 import `node:*` 和本地代码），避免 profile 解析问题。

### 5.3 cordis.patch.yml

```yaml
- insert:
    - id: dsh-router-agent
      name: dsh-router-agent
      config:
        firstRunDays: 7
        summaryProvider: deepseek-official
        summaryModel: deepseek-flash
        summaryConcurrency: 2
        summaryDebounceMs: 1200
        summaryTimeoutMs: 45000
        maxHistory: 100
        autoSummaryMaxInputTokens: 8000
    - id: preset-router
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: router
        name: Router
        description: Session routing agent. Read-only index + propose only.
        order: 5
        plugins:
          - id: router-tools
            name: dsh-router-agent/router-tools
```

- `@deepseek-ai/dsh-agent-preset` 的 `plugins` 列表就是 RA 的能力边界。
- 如果目标 DSH 的 preset 机制是 0.1.5 的目录式（`dsh-agent-presets`），改走 `~/.dsh/.agent-presets/router/` + `agent.cordis.yml`；M0 probe 决定。
- 不要试图用动态 Cordis 注册 preset。

### 5.4 构建（esbuild）

```js
// esbuild.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['src/host/index.js'],
  outfile: 'lib/index.js',
  bundle: true, platform: 'node', format: 'esm',
  external: ['node:*', '@deepseek-ai/*'],
});

await build({
  entryPoints: ['src/router-tools.js'],
  outfile: 'lib/router-tools.js',
  bundle: true, platform: 'node', format: 'esm',
  external: ['node:*', '@deepseek-ai/*'],
});

await build({
  entryPoints: ['src/client/index.jsx'],
  outfile: 'lib/client.body.js',
  bundle: true, platform: 'browser', format: 'cjs',
  external: ['react', 'react-dom', '@deepseek-ai/*'],
  jsx: 'automatic',
});

// wrap-client.mjs
import { readFile, writeFile } from 'node:fs/promises';
const body = await readFile('lib/client.body.js', 'utf8');
await writeFile('lib/client.js',
  `window.__ModuleLoader__.load({ id:'dsh-router-agent', factory:(require)=>{` +
  `const module={exports:{}}; const exports=module.exports;` +
  `(function(require,module,exports){${body}
})(require,module,exports);` +
  `return module.exports;}});`);
```

- 所有 Host Remote 调用（`list`/`projections`/`prompt`/`fork`）都带 `AbortSignal`；`prompt` 的 signal 是必传。用 `AbortController` + 超时包装。
- `main`/`sidebar` 注册不要写在 Host 插件里；客户端插件只 inject `slots`/`sessions`/`locale`。

- 客户端 bundle 的外部依赖必须是平台 baseline（React、DSH client 包）；其它依赖进 bundle 或声明 `dsh.client.external`。
- `src/client/index.jsx` 必须导出 `{ inject, apply }`；`apply` 注册 main/sidebar。
- CSS 在 client 内插入 `<style data-plugin="dsh-router-agent">`（或 wrapper 提供 `styles.insert`）；不要 `ctx.get('styles')`。
- 修改 client 后刷新页面；桌面端缓存异常时只清 `Cache`/`Code Cache`。

### 5.5 安装 / 开发

```bash
npm install
npm run build
dsh plugin --profile desktop add link:D:/code/dsh-router-agent
# 重启 Host；客户端改动需刷新页面
# 桌面端缓存异常时，只清 %APPDATA%/@deepseek-ai/dsh-desktop 的 Cache / Code Cache
```

隔离验证（不碰真实 profile）：

```bash
DSH_HOME=D:/tmp/dsh-ra-profile D:/deepseek\ harness/resources/runtime/cli/bin/dsh.cmd \
  --profile ui --from-default-profile web --dump-config
D:/deepseek\ harness/resources/runtime/cli/bin/dsh.cmd --profile ui --no-open
```

---

## 6. 数据模型与存储

### 6.1 `.dsh_RA` 目录

```text
<project>/.dsh_RA/
  state.json           # 项目、RA sessionId、settings、onboarding、schema
  sessions/<id>.json   # brief + tracking + lineage + context + coverage
  proposals/<token>.json
  dispatch.jsonl       # 每次判断/执行，history 来源
  diagnostics/
    probe.json
    summarizer.jsonl
  .gitignore           # * + !.gitignore
```

- **不要**把 RA 会话的日志写进来；RA 会话由 DSH 管理。
- **不要**写 session log；所有信息都是 sidecar。
- 原子写：同目录 `${file}.${pid}.${rand}.tmp` → `fsync`（可选）→ `rename`。
- 锁：`withFileLock(file, fn)` 使用 `${file}.lock` + `mkdir` 原子锁 / 过期清理；同一项目串行。
- 读取容错：JSON 解析失败 → 备份 `.corrupt.<ts>` → 用空/骨架重建；不要阻塞面板。

### 6.2 state.json

```json
{
  "schemaVersion": 1,
  "projectCwd": "D:\\code\\example-project",
  "raSessionId": "sess_...",
  "createdAt": "2026-11-19T...",
  "settings": {
    "layout": "vertical",
    "raModel": { "provider": "deepseek-official", "model": "deepseek-flash", "reasoningEffort": null },
    "defaultSessionModel": { "provider": "deepseek-official", "model": "deepseek-chat" },
    "composer": { "mode": "standard", "permissions": "workspace", "auto": false }
  },
  "onboarding": {
    "status": "idle|running|paused|done|failed",
    "total": 18,
    "done": 0,
    "startedAt": null,
    "lastError": null,
    "queue": ["sessionId"]
  },
  "trackingCutoffDays": 7,
  "probe": { "version": "0.2.2-rc.5", "checkedAt": "..." }
}
```

### 6.3 sessions/<id>.json（内部 brief）

```json
{
  "schemaVersion": 1,
  "sessionId": "sess_...",
  "title": "智能工牌详情抽屉3D轨迹回放",
  "titleSource": "native|ra|manual|fallback",
  "nativeTitle": "...",
  "createdAt": "2026-...",
  "lastActiveAt": "2026-...",
  "lastSeq": 812,
  "turns": 12,
  "status": "running|idle|queued|error",
  "tracking": true,
  "trackingReason": null,
  "lineage": {
    "parentSessionId": "sess_...|null",
    "forkTurn": 9,
    "forkAtSeq": 512,
    "forkMessageId": "msg_...",
    "source": "plugin|native|title|unknown"
  },
  "forks": [
    { "sessionId": "sess_...", "turn": 9, "atSeq": 512, "title": "...", "createdAt": "..." }
  ],
  "brief": {
    "goal": "...",
    "done": ["..."],
    "decisions": [{ "what": "...", "why": "..." }],
    "files": [{ "path": "src/...", "why": "..." }],
    "open": ["..."],
    "pitfalls": ["..."],
    "recentPrompts": ["..."],
    "boundaries": [
      { "turn": 9, "atSeq": 512, "messageId": "msg_...", "label": "速度曲线与回放联动" }
    ]
  },
  "context": {
    "usedTokens": 176000,
    "limitTokens": 200000,
    "percent": 88,
    "source": "projection|fold|unknown",
    "updatedAt": "..."
  },
  "coverage": {
    "throughSeq": 812,
    "throughTurn": 12,
    "generator": "deepseek-flash",
    "quality": "llm|fallback|skeleton",
    "updatedAt": "..."
  },
  "manual": { "title": null, "note": null }
}
```

- **没有 `oneLiner`**。
- `brief` 只给 RA 工具和 UI 的分叉点标签；详情不渲染。
- `boundaries.atSeq` 必须是 `turn/end` 事件的 seq，供 fork 使用。
- `lineage` 由插件自己维护；0.2.2 普通 fork 不写 `parentSession`。

### 6.4 proposals/<token>.json

```json
{
  "schemaVersion": 1,
  "token": "p_...",
  "cwd": "...",
  "requestId": "...",
  "createdAt": "...",
  "expiresAt": "...",
  "action": "route|fork|new|ask",
  "task": "...",
  "targetSessionId": "sess_...|null",
  "targetTitle": "...",
  "targetLastSeqAtPropose": 812,
  "targetBefore": {
    "planActive": false,
    "permission": "workspace-write"
  },
  "fork": { "turn": 9, "atSeq": 512, "messageId": "msg_...", "label": "..." },
  "forkFallback": null,
  "newSession": { "titleSuggestion": "...", "model": { "provider": "...", "model": "..." } },
  "ask": { "candidates": [{ "sessionId": "...", "reason": "..." }] },
  "reason": "...",
  "sendMode": "standard|plan",
  "sendPermissions": "readonly|workspace|full",
  "auto": false,
  "status": "pending|executing|done|failed|abandoned|expired",
  "result": null
}
```

- 卡片只显示：目标、元信息、理由、fork 点、模式/权限/auto 标签；不显示 brief。
- `targetBefore` 用于显示“将把目标从 X 改为 Y”。

### 6.5 dispatch.jsonl

```json
{"at":"...","cwd":"...","proposalId":"...","task":"...","action":"route","target":"sess_...","targetTitle":"...","mode":"plan","permissions":"readonly","auto":false,"result":"sent|created|failed|abandoned","error":null,"reason":"..."}
```

- 每次用户任务一条；history 读取最后 N 条；自动执行标 `auto:true`。
- 未执行/用户关闭的也写，`result:'abandoned'`。

### 6.6 索引

- 不维护单独的索引文件；tree endpoint 扫描 `sessions/*.json`（18–100 个），按 `lastActiveAt` 排序。
- 如果 > 500 个会话，再加 `index.json` 缓存；V1 不做。

---

## 7. Host：插件入口与服务

### 7.1 apply / inject / provide

`src/host/index.js`：

```js
import { RouterService } from './router-service.js';
import { registerRoutes } from './http.js';
import { probeHost } from './probe.js';

export const name = 'dsh-router-agent';
// Hard deps only. Optional services are ctx.get() + null-checked.
export const inject = ['sessions', 'agents', 'sessionQuery', 'sessionController'];

export function apply(ctx, config) {
  const service = new RouterService(ctx, config);
  ctx.effect(() => {
    const disposeService = ctx.provide('routerAgent', service);
    return () => { disposeService(); service.dispose(); };
  }, 'dsh-router-agent: service');

  const probe = probeHost(ctx);
  service.setProbe(probe);
  const connection = ctx.get('connection');
  if (connection?.fetch?.register) {
    registerRoutes(ctx, service, connection.fetch);
  } else {
    logError(ctx, 'connection.fetch unavailable; panel data routes are disabled');
  }

  ctx.effect(
    () => ctx.on('session/event', (session, event) => {
      try { service.onSessionEvent(session, event); }
      catch (error) { service.logError('session/event', error); }
    }),
    'dsh-router-agent: session events',
  );
}
```

- 可选服务（`sessionProjections`、`compaction`、`commands`、`planMode`、`permissionPresets`、`sandboxPolicy`、`approval`、`llm`、`connection`）一律 `ctx.get` + 判空，不 hard inject。
- `ctx.provide('routerAgent', service)` 的返回 disposer 交给 `ctx.effect`。
- `ctx.logger` 可能是函数；用 `typeof ctx.logger === 'function' ? ctx.logger('dsh-router-agent') : console`。

### 7.2 RouterService 方法

```js
class RouterService {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.projects = new Map(); // cwd -> ProjectStore
    this.ra = new RaSessionManager(ctx, this);
    this.brief = new BriefPipeline(ctx, this, config);
    this.context = new ContextUsage(ctx, this);
    this.dispatch = new DispatchService(ctx, this);
    this.history = new HistoryLog();
    this.probe = null;
  }

  async ensureProject(cwd) { /* create .dsh_RA, load state, mark tracking */ }
  async getState(cwd) { /* onboarding, ra, settings, probe */ }
  async getTree(cwd) { /* tracked sessions + context + boundaries */ }
  async getUntracked(cwd) { /* untracked list */ }
  async getSettings(cwd) { /* state.settings */ }
  async updateSettings(cwd, patch) { /* validate, persist, apply layout/RA model */ }
  async getModels() { /* sessionController.modelCatalog / llm */ }
  async ask(cwd, intent) { /* ensure RA, store active ask, prompt RA */ }
  async getPending(cwd, requestId) { /* thinking/proposal/executing/done/error */ }
  async confirm(cwd, token) { /* validate, execute */ }
  async choose(cwd, token, sessionId) { /* ask -> route proposal */ }
  async abandon(cwd, token) { /* mark abandoned */ }
  async track(cwd, sessionId, tracking) { /* stop/restore, children stay */ }
  async compress(cwd, sessionId) { /* /compact or compaction */ }
  async getHistory(cwd, limit) { /* dispatch.jsonl reversed */ }
  async rename(cwd, sessionId, title) { /* sidecar + best-effort native */ }
  async toolTree(cwd, args) { /* RA tool data */ }
  async toolBrief(cwd, args) { /* RA tool data */ }
  async toolHistory(cwd, args) { /* RA tool data */ }
  async toolPropose(cwd, raSessionId, args) { /* writes proposal; auto schedule */ }
  onSessionEvent(session, event) { /* context/title/lastActive/brief debounce */ }
  dispose() { /* stop queues, close stores */ }
}
```

### 7.3 HTTP routes

全部 `ctx.connection.fetch.register`，路径以 `/api/router/` 开头；handler 返回 `Response`。

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/router/state` | onboarding / RA / probe / settings 摘要 |
| GET | `/api/router/tree` | 跟踪中的会话 + 上下文 + boundaries |
| GET | `/api/router/untracked` | 未跟踪列表 |
| GET | `/api/router/settings` | 设置 |
| POST | `/api/router/settings` | 设置更新（layout/models/composer） |
| GET | `/api/router/models` | 模型目录 |
| POST | `/api/router/ask` | 提交任务给 RA（含 mode/permissions/auto） |
| GET | `/api/router/pending` | 轮询当前提议/执行结果 |
| POST | `/api/router/confirm` | 确认提议 |
| POST | `/api/router/choose` | 追问选一个候选 |
| POST | `/api/router/abandon` | 放弃提议 |
| POST | `/api/router/tracking` | 停止/恢复跟踪 |
| POST | `/api/router/compress` | 压缩上下文 |
| GET | `/api/router/history` | 最近判断历史 |
| POST | `/api/router/rename` | 修改标题 |

- 客户端 fetch 用相对路径 `api/router/tree?cwd=...`；不要用 `window.location.origin + '/api'`。
- `cwd` 必须校验：属于 `ctx.workspaceRegistry.list()` 或当前 session 的 cwd；拒绝任意路径。
- 错误返回 `{ error, code }` + 合适 HTTP 状态；前端显示。
- 不提供面板用 brief 接口；brief 只走 RA 工具。

### 7.4 路由骨架

```js
export function registerRoutes(ctx, service, fetch) {
  if (!fetch?.register) return;
  ctx.effect(() => fetch.register({
    path: '/api/router/tree',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const cwd = requiredCwd(ctx, new URL(request.url).searchParams.get('cwd'));
      return json(await service.getTree(cwd));
    },
  }), 'dsh-router-agent: GET tree');
  // ... other routes
}
```

---

## 8. Session 读取、跟踪范围、lineage

### 8.1 项目会话枚举

`src/host/session-reader.js`：

```js
async function listSummary(ctx, cwd) {
  if (typeof ctx.sessionController?.list === 'function') {
    const all = await ctx.sessionController.list({});
    return all.filter((s) => s.cwd === cwd);
  }
  const records = await ctx.sessionQuery.listSessions();
  return records.filter((r) => r.header.cwd === cwd).map(toSummary);
}
```

- `SessionSummary.updatedAt` 即 `lastActiveAt`；`running`、`parentSessionId`、`origin` 一并带出。
- 如果 `sessionController.list` 不可用，用 `sessionQuery.filterSessions([{kind:'cwd',values:[cwd]}])` + 最后一次事件时间。
- 排除 `origin:'subagent'`（不进入画布）；排除 RA 自己的 sessionId；默认排除 workspaceRegistry 里已归档的 session（归档目标需要显式恢复）。
- `blank:true` 的会话可显示但无 brief；首次接入不索引 blank（除非用户在最近 7 天有活动？blank 没有活动）。

### 8.2 读取单会话记录

照抄 tree-view 的归一化：

```js
async function readRecord(ctx, sessionId) {
  const live = ctx.sessions.get(sessionId);
  if (live) return recordFromLive(live);
  if (typeof ctx.sessionQuery.observeSession === 'function') {
    const obs = await ctx.sessionQuery.observeSession(sessionId, { projectionMode: 'none' });
    try { return recordFromObservation(obs); } finally { obs[Symbol.dispose]?.(); }
  }
  return recordFromSnapshot(await ctx.sessionQuery.readSession(sessionId));
}
```

- `record = { header, events, inheritedEventCount }`；`header` 兼容 `session`/`header`。
- 事件按 `seq` 升序；`lastSeq = events.at(-1)?.seq ?? 0`。
- 最后活跃：summary.updatedAt 优先；否则最后一个事件 time。

### 8.3 最近 7 天

- `cutoff = Date.now() - 7*86400000`。
- 项目内 `updatedAt >= cutoff` → `tracking:true`；否则 `tracking:false, trackingReason:'stale'`。
- 排除 RA 会话、subagent、blank。
- 首次 `ensureProject` 时写 skeleton；未跟踪不生成 brief，直到恢复。

### 8.4 lineage 解析

0.2.2 普通 fork 不写 `parentSession`，所以：

```js
function resolveLineage(record, summary, titleIndex, sidecar) {
  if (sidecar?.lineage?.parentSessionId) return sidecar.lineage;
  if (record.header.parentSession) return { parentSessionId: header.parentSession, source:'native' };
  if (record.header.isSeeded || record.inheritedEventCount > 0) {
    const m = /^Fork of (.+)$/.exec(nativeTitle);
    if (m && titleIndex.has(m[1])) return { parentSessionId: titleIndex.get(m[1]), source:'title' };
    return { parentSessionId: null, source:'unknown' };
  }
  return { parentSessionId: null, source:'root' };
}
```

- 插件创建的 fork：sidecar `source:'plugin'`，写 `forkAtSeq/forkTurn/forkMessageId`。
- 已有 DSH fork：`parentSession` → 标题 `Fork of` → unknown；unknown 作为根显示，不伪造关系。
- 画布 root = `!trackedParent(session)`；如果父未跟踪，子成为根。
- 详情不展示 lineage；这些字段只用于布局/停止父会话的“移到顶层”。

### 8.5 标题

- 原生标题：最近 `session/title` 事件 `data.title`；fallback 首条 user 文本截断；fallback id。
- 展示标题优先级：`manual.title` → nativeTitle（有意义）→ RA 生成 → 首条输入。
- 什么算无意义：空、`session-`、`Fork of …`、整段首条输入。
- 用户改名：写 manual.title；`ctx.get('sessionTitle')?.rename(session,title)` 尽力；失败只记日志。
- 自动命名不覆盖有意义的原生标题。

### 8.6 跟踪停止/恢复

- `track(cwd, sessionId, false)`：`tracking=false, trackingReason='manual'`；清 `activeAsk`；RA 工具过滤。
- 父会话停止：子会话的 `tracking` 不变；`trackedParent` 返回 null；布局把子会话当根；弹层文案“移到顶层继续跟踪（不会一起停止）”。
- 恢复：`tracking=true, trackingReason=null`；如果 brief 的 `coverage.throughSeq < lastSeq` 或缺失 → enqueue 摘要；父会话也 tracked 时回挂。
- 停止/恢复只改 sidecar，不动会话日志。
- undo：Host 直接恢复；UI toast 的撤销调用 track(true)。

---

## 9. 摘要器与首次接入

### 9.1 输入提取

`src/host/brief/extract.js`：

- 遍历 events：
  - `turn/start` / `turn/end`：记录 turn、seq。
  - `user/message`：`data.content` 的 text 块 → 用户输入；`id`。
  - `assistant/message`：`data.message.content` 的 text 块 → 助手文本；`data.message.id`。
  - `tool/call`：`data.name` + `data.arguments`（只提取路径/命令关键词，不复制大段代码）。
  - `tool/result`：只取错误/成功摘要，不取正文。
  - `session/title`：标题。
- 输出 `turns: [{turn, startSeq, endSeq, user, assistantText, tools:[{name, path?}], lastMessageId}]`。
- 文件路径提取：`arguments` 里常见 `path/file_path/paths/dir` 等字段；只用路径，不读文件。
- 截断：头 2 轮 + 最近 8 轮；单会话 ≤ 8000 tokens；超出用省略标记。

### 9.2 摘要 prompt

`src/prompts/summarize.md`（完整）：

```text
You are indexing one coding session for a routing agent.
You do NOT have the codebase. Never invent files or code.

Return ONE JSON object, no markdown fence:
{
  "goal": "one sentence, <=80 chars",
  "done": ["<=6 short verifiable outcomes"],
  "decisions": [{"what":"<=40 chars","why":"<=60 chars"}],
  "files": [{"path":"repo-relative path","why":"<=40 chars"}],
  "open": ["<=6 unfinished items"],
  "pitfalls": ["<=6 items: symptom + cause + avoidance"],
  "recentPrompts": ["last 3 user prompts, each <=80 chars"],
  "boundaries": [{"turn": 1, "label": "<=40 chars"}]
}

Rules:
- JSON only. No code blocks, no prose outside JSON.
- Never copy source code. File paths and one-line purposes only.
- "boundaries" are turns where a sub-task clearly finished and the next turn changed direction.
  Only include real task boundaries; 1-6 items; use the turn number from the transcript.
- "pitfalls" must be actionable, not vague.
- If unsure, omit the item rather than guess.
```

- 用户内容：`<session title>` + `[turn N] user: ...` + `assistant: ...` + `tools: ...` + `[turn N end]`。
- 模型：`ctx.get('llm').stream({ provider, model, messages:[{role:'user',content:[{type:'text',text:input}]}], system: prompt, temperature:0, maxTokens:2000, signal })`。
- 收集 `text-delta`；遇到 `finish` 停止；`error` 抛。
- 解析 JSON：去 ```json 围栏；找第一个 `{` 到最后一个 `}`；`JSON.parse`；校验字段类型；失败重试 1 次（repair prompt）；仍失败 → extractive fallback。

### 9.3 边界映射

- 摘要输出 `boundaries:[{turn,label}]`。
- Host 用 `turns` 找到该 turn 的 `endSeq`（`turn/end` 的 seq）和 `lastMessageId`；写 brief：
  ```json
  {"turn": 9, "atSeq": 512, "messageId": "msg_...", "label": "..."}
  ```
- 边界至少一个；若模型没给，fallback 取最后 1–2 个 `turn/end`（label 用“第 N 轮完成”）。
- fork 只用 `atSeq`；UI 显示 `T9`。

### 9.4 合并

- 增量输入：上一版 brief + 新 turn 的 transcript；prompt 要求输出合并后的完整 brief。
- 覆盖字段：goal/done/decisions/files/open/pitfalls/recentPrompts/boundaries。
- 保留 `manual.title/manual.note`；不覆盖。
- `coverage.throughSeq/throughTurn` 更新；`quality:'llm'`。
- 失败保留旧 brief；`quality:'fallback'`；下一轮再试；不显示降级徽章。

### 9.5 抽取式 fallback

- goal = 标题/首条用户输入截断。
- done = []；decisions = []；files = 从 tool/call 提取的唯一路径（≤5）；open = []；pitfalls = []；recentPrompts = 最近 3 条用户输入；boundaries = 最近 turn/end（≤2）。
- `quality:'fallback'`；不阻塞首次接入。

### 9.6 首次接入队列

- `ensureProject`：
  1. list project sessions; exclude RA/subagent/blank.
  2. per session: if within 7 days → tracking true, skeleton brief; else tracking false stale.
  3. onboarding.total = tracked count; status running; enqueue tracked sessions.
- Worker concurrency 2；串行写 brief；每完成一个 `done++`，写 state。
- 全部完成 status done；失败降级也计数；`failed` 只用于整体错误。
- 暂停：`status:'paused'`；worker 在下一个任务前停；恢复继续。
- 重开面板/重启 Host：从 state.onboarding 继续未完成队列；已完成的跳过。
- 恢复老会话时单独入队（不改变 onboarding total）。

### 9.7 增量与旁路观察

- `session/event`：
  - `assistant/message` / `request/context` → 更新 context 缓存；`lastActiveAt`/lastSeq。
  - `session/title` → 更新 nativeTitle；树标题。
  - `turn/end` → 如果 tracking 且非 RA/subagent：debounce 1.2s 入队 merge；更新 lastActive/turns。
  - `compaction/end` → 更新 context；可选重新摘要（v1 不）。
- 旁路观察：用户直接会话对话也走同一事件；树/上下文更新；不弹窗。
- 去重：同一 session 已有摘要任务时合并（latest wins）；`inFlight` set。
- 每会话每小时最多 N 次（config），避免刷爆。

---

## 10. RA preset、工具、提示词

### 10.1 router-tools 插件

`src/router-tools.js`：

```js
export const name = 'dsh-router-tools';
export const inject = ['routerAgent', 'tools', 'systemPrompt'];

export function apply(ctx) {
  const svc = ctx.routerAgent;
  const cwdOf = (exec) => exec?.agent?.session?.header?.cwd;
  const agentId = (exec) => exec?.agent?.id;

  ctx.tools.restrict({ allow: ['ra_tree', 'ra_brief', 'ra_history', 'ra_propose'] });

  ctx.tools.register(raTree(svc, cwdOf));
  ctx.tools.register(raBrief(svc, cwdOf));
  ctx.tools.register(raHistory(svc, cwdOf));
  ctx.tools.register(raPropose(svc, cwdOf, agentId));

  ctx.systemPrompt.section({
    name: 'router:policy',
    order: 2200,
    text: RA_SYSTEM_PROMPT,
  });
}
```

- `ctx.tools.restrict` 只过滤继承的全局工具；本 scope 自己注册的 4 个仍可见。
- `exec.agent` 的 TypeScript 类型没有 `session`；运行时从 loop agent 取；写成 `exec?.agent?.session?.header?.cwd`。
- `cwd` 缺失时 tool 抛错；RA 无法跨项目。
- 不要挂 `tool-fs`/`tool-bash`/`tool-web`/`tool-subagent`/`tool-workflow`/`tool-plugin-manager` 等；preset 的 plugins 列表也不要有。

### 10.2 工具 schema

所有 output 用 object root；`execute` 返回 JSON；`render` 产生 text。

**ra_tree**

```json
{
  "name": "ra_tree",
  "description": "List tracked sessions in this project, newest first. Only L0 metadata; read ra_brief for details.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "optional title/file keyword" },
      "status": { "type": "string", "enum": ["all", "running", "idle"] },
      "limit": { "type": "integer", "minimum": 1, "maximum": 50 }
    },
    "additionalProperties": false
  }
}
```

返回：

```json
{
  "sessions": [
    {
      "sessionId": "sess_...",
      "title": "...",
      "lastActiveAt": "...",
      "turns": 12,
      "running": false,
      "contextPercent": 88,
      "parentSessionId": "sess_...|null",
      "forkTurn": 9,
      "boundaries": [{ "turn": 9, "label": "..." }]
    }
  ]
}
```

**ra_brief**

```json
{
  "name": "ra_brief",
  "description": "Read the internal brief of one tracked session: goal, done, decisions, files, open, pitfalls, recent prompts, fork boundaries. No code contents.",
  "parameters": {
    "type": "object",
    "properties": { "sessionId": { "type": "string" } },
    "required": ["sessionId"],
    "additionalProperties": false
  }
}
```

返回 `{ sessionId, title, brief, boundaries, contextPercent, lastSeq }`；untracked/unknown → throw。

**ra_history**

```json
{
  "name": "ra_history",
  "description": "Read recent routing decisions in this project: task, action, target, result.",
  "parameters": {
    "type": "object",
    "properties": { "limit": { "type": "integer", "minimum": 1, "maximum": 50 } },
    "additionalProperties": false
  }
}
```

**ra_propose**

```json
{
  "name": "ra_propose",
  "description": "Create a pending proposal for the user. Never executes. Use one action.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["route", "fork", "new", "ask"] },
      "targetSessionId": { "type": "string" },
      "forkTurn": { "type": "integer" },
      "titleSuggestion": { "type": "string" },
      "reason": { "type": "string" },
      "candidates": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "sessionId": { "type": "string" },
            "reason": { "type": "string" }
          },
          "required": ["sessionId", "reason"],
          "additionalProperties": false
        }
      }
    },
    "required": ["action", "reason"],
    "additionalProperties": false
  }
}
```

- Host 校验：target 必须 tracked；forkTurn 必须在该 target 的 boundaries；new 需要 titleSuggestion（可空）；ask 需要 2 个 candidates；auto 模式下 ask 直接抛错。
- 提议的 `task`、`sendMode`、`sendPermissions`、`auto` 来自 Host 的 active ask，不由 RA 填写。
- `ra_propose` 写 `proposals/<token>.json`；返回 `{ proposalId, action, expiresAt }`；不执行。
- auto：Host 在 proposal 写入后 600ms 调度 `confirm`；UI 轮询看到“自动执行”。

### 10.3 RA 系统提示词

`src/prompts/ra-system.md`（完整）：

```text
You are Router, a session-routing agent for the current DeepSeek Harness project.

You do NOT read or write code. You have no filesystem, shell, web, subagent, or workflow tools.
Your only tools are:
- ra_tree: list tracked sessions (title, last active, turns, context %, lineage, boundaries)
- ra_brief: read one session's internal brief (goal, done, decisions, files, open, pitfalls, boundaries)
- ra_history: read recent routing decisions
- ra_propose: write a pending proposal (route / fork / new / ask). It never executes.

Your only job is to decide where the user's task should go:
1. route: the task continues an existing session and its current context is still relevant.
2. fork: the task belongs to the same feature, but the current tail has drifted; an earlier task boundary
   still holds the reusable context. Choose a boundary from ra_brief; explain why.
3. new: no existing session has reusable context, or the old session is polluted by failed attempts.
   New sessions start clean. Do NOT generate a handoff pack; do not copy old conclusions.
4. ask: two candidates are genuinely tied. Only allowed when auto mode is OFF.

Rules:
- Prefer route over fork, and fork over new, when reusable context exists.
- Do not route merely because titles look similar; cite evidence (turn, file, decision) from ra_brief.
- Never propose a session that is not tracked.
- Never propose a forkTurn that is not in that session's boundaries.
- Reason: one short paragraph, cite evidence. No confidence scores, no numbered lists.
- Use ra_propose exactly once per task. Do not answer with a plan in prose only.
- If ra_propose fails, read the error and retry with a valid target/boundary; do not invent ids.
- Auto mode: if the user message says auto, never use ask; choose the best candidate and say what is
  uncertain in the reason. The host executes without a confirmation click.
- The UI does not show your full brief; the user only sees your reason and the proposal card. Be precise.
- Do not mention internal file paths unless they are evidence in the brief.
```

- `{{cwd}}` 由 Host 在创建/恢复 RA 时注入？`systemPrompt.section.text` 是静态；可以改为 `text: () => buildRaPrompt(cwd)`，但 section 在 preset scope，cwd 来自 agent。使用 `ctx.systemPrompt.section({ text: (assemble) => ... })`；`assemble` 是否有 agent/cwd？The report says `AssembleContext`; likely contains agent. The plan can keep the prompt generic with "the current project" and the RA sees `cwd` via tools? The RA tools know cwd; the prompt can say "the current project"; the task message includes the project name. Simpler: static prompt; the Host's user message includes `Project: <cwd>` and the task. The plan.
- The RA's user message:
  ```
  Project: D:\code\example-project
  Auto mode: off
  Task: <task>
  ```
  - The Host sends this via sessionController.prompt; the RA's system prompt.
  - The RA can call ra_tree; the service uses cwd.
- Auto mode note; the RA tool rejects ask if auto.
- The RA's `ra_propose` reason; the panel.

### 10.4 RA session manager

```js
class RaSessionManager {
  async ensure(cwd) {
    const state = await store.loadState(cwd);
    const raId = state.raSessionId;
    const model = state.settings.raModel;
    if (raId) {
      const live = this.ctx.agents.get(raId);
      if (live) { await this.ensureModel(live, model); return raId; }
      if (await this.sessionExists(raId)) {
        await this.ctx.agents.resume({ resumeSessionId: raId, agentOptions: model });
        return raId;
      }
    }
    const sessionId = newSessionId();
    const handle = await this.ctx.agents.create({
      sessionId,
      meta: { cwd, agentPreset: 'router', isSeeded: false },
      agentOptions: model,
      setup: async (agentCtx) => { /* preset already mounted by meta */ },
    });
    await this.ctx.sessions.flush(handle.agent.session);
    await this.ctx.get('sessionTitle')?.rename?.(handle.agent.session, 'Router · ' + basename(cwd));
    await store.saveState(cwd, { ...state, raSessionId: sessionId });
    return sessionId;
  }

  async prompt(cwd, task, ask) {
    const raId = await this.ensure(cwd);
    const requestId = crypto.randomUUID();
    const signal = new AbortController().signal;
    await this.ctx.sessionController.prompt({
      requestId, sessionId: raId, mode: 'queue',
      content: [{ type: 'text', text: `Project: ${cwd}\nAuto mode: ${ask.auto ? 'on' : 'off'}\nTask: ${task}` }],
    }, signal);
    return { raId, requestId };
  }
}
```

- `ctx.agents.create` `meta.agentPreset` is the key; if the preset isn't found, throw and disable.
- `agentOptions` structure `{provider, model, reasoningEffort?}`.
- `ctx.get('sessionTitle')?.rename` is best-effort; if absent, the sidecar title.
- The RA session is excluded from the tree (by id).
- `sessionController.prompt` may resume cold; the `agents.resume` above is for model/tools; the prompt handles.
- The RA session's cwd; project.

### 10.5 工具执行上下文

```js
function cwdOf(exec) {
  const cwd = exec?.agent?.session?.header?.cwd ?? exec?.agent?.workspace?.cwd;
  if (!cwd) throw new Error('ra tools require an agent with a cwd');
  return cwd;
}
```

- `exec.signal`; `exec.agent.id`; no `exec.session`/`exec.cwd`.
- `ra_propose` `exec.agent.id` is the RA session id; the service finds the active ask for the cwd.

---

## 11. 派发：ask / proposal / confirm / auto

### 11.1 ask 流程

`POST /api/router/ask {cwd, task, mode, permissions, auto}`:

1. validate cwd; `ensureProject`.
2. Reject if no RA preset/agent.
3. Create `activeAsk` (per cwd, one at a time):
   ```js
   { requestId, task, sendMode: mode, sendPermissions: permissions, auto,
     createdAt, status:'thinking', proposal:null }
   ```
   - If an active ask is thinking, return 409 `busy` (panel disables).
4. Ensure RA; send the task prompt with `Project/Auto/Task`.
5. Persist `activeAsk` in memory; the panel polls `/pending?cwd&requestId`.
6. Timeout 90s → status error; the RA may still be running; allow retry.

### 11.2 ra_propose → proposal

`RouterService.toolPropose(cwd, raSessionId, args)`:

1. Find `activeAsk` for cwd; if none → throw.
2. Validate:
   - route: target tracked, exists.
   - fork: target tracked; `forkTurn` in brief.boundaries; boundary has atSeq. If probe.fork=false, set `forkFallback:'new'` and the card must say native fork is unavailable.
   - new: titleSuggestion.
   - ask: auto? throw `AUTO_MODE_REQUIRES_CHOICE`; candidates 2; both tracked.
3. Capture `targetLastSeqAtPropose` from `sessionReader.lastSeq(target)`; `targetBefore` from plan/permission projections (if available).
4. Generate token `p_<random>`; expiresAt +15m; write `proposals/<token>.json`.
5. Set activeAsk.status='proposal'; activeAsk.proposal = public proposal (no brief).
6. If `activeAsk.auto` and action !== ask: schedule `executeProposal(token)` after 600ms; status 'executing'; write history pending.
7. Return `{proposalId, action, expiresAt}`.
8. Do NOT execute synchronously; the RA tool returns; the RA turn ends.

### 11.3 pending 轮询

`GET /api/router/pending?cwd&requestId`:

```json
{
  "requestId": "...",
  "status": "thinking|proposal|executing|done|failed|expired",
  "proposal": {
    "token": "...",
    "action": "fork",
    "task": "...",
    "targetSessionId": "...",
    "targetTitle": "...",
    "targetMeta": "12 轮 · 最近 13:44 · 上下文 88%",
    "forkTurn": 9,
    "forkLabel": "速度曲线与回放联动",
    "boundaries": [{"turn": 9, "label": "..."}],
    "titleSuggestion": "...",
    "model": {"provider":"...","model":"..."},
    "candidates": [],
    "reason": "...",
    "sendMode": "plan",
    "sendPermissions": "readonly",
    "auto": false,
    "targetBefore": {"planActive":false,"permission":"workspace-write"},
    "expiresAt": "..."
  },
  "result": null
}
```

- The panel polls every 400–600ms while status thinking/executing.
- The proposal includes only L0 + reason; no brief.

### 11.4 confirm / choose / abandon

`POST /api/router/confirm {cwd, token}`:

1. Load proposal; check status pending; expiresAt; activeAsk.
2. Re-read target `lastSeq`; if changed → 409 `target-changed`; mark proposal; panel shows re-judge.
3. `executeProposal`:
   - route / fork / new.
4. Update proposal status done/result; activeAsk done; dispatch record; return result + target.
5. Errors: target untracked/archived → 409（提示恢复）；busy 允许排队；invalid boundary；fork unavailable → 明示降级；model unavailable；permission unsupported；panel 显示。

`POST /api/router/choose {cwd, token, sessionId}`:

- proposal action ask; validate candidate; create a **new route proposal** with the chosen candidate and reason (`自动模式/用户选择`); status pending; the panel can confirm or auto; update the ask record? The history record for the user task should be one; the ask proposal is replaced by the route proposal (new token; expire the ask). The panel sees the route card.
- In auto mode, the RA isn't allowed ask; the choose endpoint is for normal ask.

`POST /api/router/abandon {cwd, token}`:

- status abandoned; activeAsk status abandoned; dispatch record `abandoned`; history.
- The RA turn may still be running; no execution.

### 11.5 executeProposal

```js
async function executeProposal(cwd, proposal) {
  const { sendMode, sendPermissions, task } = proposal;
  if (proposal.action === 'route') {
    const target = requireTracked(proposal.targetSessionId);
    const handle = await ensureAgent(target.sessionId);
    const applied = await applyDispatchSettings(cwd, handle, target, sendMode, sendPermissions);
    await prompt(target.sessionId, task);
    result = { kind:'route', sessionId: target.sessionId, title: target.title, applied };
  } else if (proposal.action === 'fork') {
    const target = requireTracked(proposal.targetSessionId);
    if (!probe.fork || proposal.forkFallback === 'new') {
      // Explicit downgrade: never pretend this is a native fork.
      const created = await createNewSession(cwd, proposal.newSession?.titleSuggestion || target.title + ' · 分支', proposal.newSession?.model);
      const applied = await applyDispatchSettings(cwd, created.handle, created.session, sendMode, sendPermissions);
      await prompt(created.sessionId, task);
      result = { kind:'new', sessionId: created.sessionId, fallbackFrom:'fork', title: created.title };
    } else if (!proposal.fork?.atSeq) {
      throw new Error('fork boundary missing atSeq');
    } else {
      const child = await forkAtSeq(target.sessionId, proposal.fork.atSeq);
      const handle = await ensureAgent(child.sessionId);
      const applied = await applyDispatchSettings(cwd, handle, get(child), sendMode, sendPermissions);
      await prompt(child.sessionId, task);
      await writeLineage(child.sessionId, { parent:target.sessionId, atSeq: proposal.fork.atSeq, turn: proposal.fork.turn, messageId: proposal.fork.messageId, source:'plugin' });
      result = { kind:'fork', sessionId: child.sessionId, title: child.title };
    }
  } else if (proposal.action === 'new') {
    const created = await createNewSession(cwd, proposal.newSession.titleSuggestion, proposal.newSession.model);
    const applied = await applyDispatchSettings(cwd, created.handle, created.session, sendMode, sendPermissions);
    await prompt(created.sessionId, task);
    result = { kind:'new', sessionId: created.sessionId, title: ... };
  } else {
    throw ...
  }
  return result;
}
```

- `prompt()` uses `sessionController.prompt` with requestId/signal/mode queue/content text.
- `applyDispatchSettings` only if values differ from current; the card already showed the change.
- For new: create before applying; the first message is the task; the model from proposal; no handoff.
- For fork: the child inherits; the task is the first new message.
- The result used in the UI/History.

### 11.6 创建 / fork 辅助函数

```js
async function createNewSession(cwd, title, model) {
  const sessionId = 'sess_' + crypto.randomUUID();
  const handle = await ctx.agents.create({
    sessionId,
    meta: { cwd, isSeeded: false },
    agentOptions: model,
  });
  await ctx.sessions.flush(handle.agent.session);
  await ctx.get('sessionTitle')?.rename?.(handle.agent.session, title);
  return { sessionId, handle, session: handle.agent.session, title };
}

async function forkAtSeq(sessionId, atSeq) {
  const result = await ctx.sessionController.fork({
    sessionId,
    atSeq,
    allowMigration: true,
  });
  return { sessionId: result.sessionId };
}
```

- `createNewSession` 的 `agentOptions` 来自设置的 `defaultSessionModel`；`selectModel` 的副作用（可能保存部署默认）通过 agentOptions 规避。
- fork 后子会话的模型/preset 继承父；仅当 composer 指定不同模式/权限才 `applyDispatchSettings`。

### 11.7 applyDispatchSettings

```js
async function applyDispatchSettings(cwd, handle, session, sendMode, sendPermissions) {
  const before = readModes(session);
  const plan = sendMode === 'plan';
  if (plan !== before.planActive && ctx.get('planMode')?.set) {
    const r = ctx.get('planMode').set(handle.agent, plan); // committed|queued|cancelled|noop
    if (r === 'cancelled') throw ...
  }
  if (sendPermissions !== before.permission) {
    const preset = mapPermission(sendPermissions); // workspace-write / danger-full-access
    if (ctx.get('permissionPresets')?.catalog) {
      const names = ctx.get('permissionPresets').catalog().options.map(o=>o.value);
      if (names.includes(preset)) ctx.get('permissionPresets').set(session, preset);
      else if (sendPermissions === 'readonly') {
        ctx.get('sandboxPolicy')?.setSandboxMode(session, 'read-only');
        ctx.get('approval')?.setPolicy(handle.agent, 'ask');
      } else throw new Error('permission preset unavailable');
    } else {
      // fallback direct knobs
    }
  }
  return { plan, permissions: sendPermissions, before };
}
```

- `mapPermission`: readonly→`read-only`/sandbox; workspace→`workspace-write`; full→`danger-full-access`.
- The plan/permission changes are **session-level**; the proposal card shows `targetBefore` and the desired values; no silent.
- If the target is running, plan set may return `queued`; the prompt queues; the card note.
- If the API is unavailable, throw `unsupported`; the panel shows; do not silently ignore.
- The RA's own session never gets settings; only target/new.

### 11.8 auto

- `ask` stores `auto`; `toolPropose` rejects ask if auto.
- After proposal write, if auto:
  - status executing; schedule `confirmProposal` (Host) 600ms; the same validation; no user click.
  - If validation fails, status failed; the panel shows; history failed; no silent fallback to confirmation.
- The panel's proposal card shows "自动执行"; no confirm button; the poll result.
- The auto toggle is client-side, persisted in state.settings.composer.auto; default false.
- History records `auto:true`; the result.

### 11.9 lastSeq / token

- `targetLastSeqAtPropose` = last event seq of target at proposal time.
- On confirm/auto execution, re-read; if changed → 409 `target-changed`; panel re-judge.
- Token single-use; 15 min; pending proposal; server-side; no client trust.
- The RA tool cannot execute; only the Host uses the token.

---

## 12. 上下文占用与压缩

### 12.1 ContextUsage

```js
async function readContext(ctx, sessionId) {
  const live = ctx.sessions.get(sessionId);
  if (live && ctx.get('sessionProjections')?.snapshot) {
    const v = ctx.get('sessionProjections').snapshot(live, ['contextPressure', 'tokenUsage']);
    const p = v?.contextPressure;
    if (p?.contextWindow) return toContext(p.pressureTokens ?? p.projectedTokens, p.contextWindow, 'projection');
  }
  if (ctx.get('sessionController')?.projections) {
    const v = await ctx.sessionController.projections({ sessionId });
    const p = v?.values?.contextPressure ?? v?.values?.contextPressure;
    if (p?.contextWindow) return toContext(p.pressureTokens ?? p.projectedTokens, p.contextWindow, 'projection');
  }
  // fold events
  const record = await readRecord(ctx, sessionId);
  const window = lastRequestContext(record.events)?.contextWindow;
  const used = lastAssistantUsage(record.events)?.inputTokens;
  if (window && used) return toContext(used, window, 'fold');
  return { usedTokens: null, limitTokens: null, percent: null, source:'unknown' };
}
```

- `percent = round(used/limit*100)`; clamp 0–100.
- Colors: <60 blue; 60–84 amber; ≥85 red.
- Cache per session; update on `assistant/message`/`request/context`/compaction; tree endpoint.
- If no data: hide percent/bar; compress disabled; no fake numbers.

### 12.2 compress endpoint

`POST /api/router/compress {cwd, sessionId}`:

1. Require tracked; load.
2. Ensure live agent: `ctx.agents.get(id)` else `ctx.agents.resume({resumeSessionId:id, agentOptions: modelFromSession})`.
3. Try `ctx.get('commands')?.execute(sessionId, '/compact', [])` (documented `/compact`, no args).
   - If busy → 409 `busy`; UI toast "运行中，稍后再试/会排队".
4. Fallback `ctx.get('compaction')?.compactNow` if commands unavailable; else 501 `unsupported`.
5. Wait for completion; re-read context; write brief context; return `{before, after}`.
6. UI updates node/detail; toast `88% → 31%`.
- If compaction result is null → no safe range; 409 `noop`.
- Never simulate on the server; if unsupported, 501; UI hides/disables based on probe.

### 12.3 UI

- Node: percent + 2px bar + compress icon button; icon 18×18; click stops propagation; opens confirm.
- Detail: context row + exact `used/limit · percent` + `压缩上下文` button.
- Confirm modal: current usage; running note; cancel/compress.
- The compress button also available in the node; per session.
- After success: refresh tree/context; detail if open.
- If probe says unsupported: hide icon/button; or disabled with title "当前版本不支持".

---

## 13. 设置、历史、标题

### 13.1 settings

`GET /api/router/settings` returns `state.settings` + models availability.
`POST /api/router/settings` accepts `{layout?, raModel?, defaultSessionModel?, composer?}`:

- Validate layout `vertical|horizontal`; models against catalog; composer values.
- Write state atomically.
- If layout changed: no server layout; UI re-renders; return.
- If raModel changed: update RA session if exists:
  - live: `ctx.agents.get(raId)?.model.select({provider,model,reasoningEffort?})` if available; else `ctx.sessionController.selectModel` (note: may update deployment default; log).
  - cold: next `agents.resume` uses `agentOptions`; no immediate.
- If defaultSessionModel changed: used by next new proposal; no existing session change.
- Composer values: used as defaults for the panel; the panel sends them with ask.

`GET /api/router/models`:

```js
const catalog = await ctx.sessionController.modelCatalog();
return { default: catalog.default, groups: catalog.groups, failures: catalog.failures };
```

- Fallback `ctx.get('llm').listProviders/listModels`.
- If a saved model is no longer available → fallback default; toast/warning.

### 13.2 history

`GET /api/router/history?cwd&limit=100`:
- read dispatch.jsonl; last N; reverse; return `{items:[{at,task,action,targetTitle,reason,result,mode,permissions,auto}]}`.
- The panel history modal; no deletion; full RA chat link "打开 RA 会话".
- History records created at proposal; updated at confirm/abandon; auto.
- The RA session itself retains the full conversation; the panel's history is decision history.

### 13.3 title rename

`POST /api/router/rename {cwd, sessionId, title}`:
- trim; ≤60; write `manual.title`; update index; best-effort `ctx.get('sessionTitle')?.rename(session,title)`.
- If native rename unsupported: sidecar title; log; UI still shows.
- Never auto-rename a meaningful native title; only fallback for blank/`session-`/`Fork of`.
- New/fork title suggestions from RA; the Host sets sidecar and attempts native rename.

---

## 14. 客户端 UI

### 14.1 注册

`src/client/index.jsx`:

```jsx
import { RouterPanel } from './RouterPanel.jsx';
import { RouterIcon } from './RouterIcon.jsx';

const PANEL_ID = 'router-agent';

export const inject = ['slots', 'sessions', 'locale'];
export const apply = (ctx) => {
  const slots = ctx.get('slots');
  ctx.effect(() => slots.register(
    { name: 'main', key: PANEL_ID },
    RouterPanel,
  ), 'router: main panel');
  ctx.effect(() => slots.register(
    { name: 'sidebar.panellist', id: PANEL_ID, order: 30, label: 'Router' },
    RouterIcon,
  ), 'router: sidebar');
};
```

- `main` keyed; `sidebar.panellist` list id; same PANEL_ID.
- The panel gets `useSessions`/`useWorkspace` standard props? The slot component receives standard props; `RouterPanel` can use `ctx.sessions` via `inject` factory:
  ```js
  { name:'main', key:PANEL_ID, inject: () => ({ sessions: ctx.sessions, openSession: (id) => ctx.sessions.open(id), openPanel: (id) => ctx.layout.selectPanel(id) }) }
  ```
  - `inject` is a factory; the component receives props.
- The client plugin can use `ctx.sessions.list` snapshot; the panel's project cwd from `current`/`byId` or a project selector.

### 14.2 组件树

```text
RouterPanel
├─ PanelHeader (project, status, history, settings, more)
├─ SearchBar (placeholder 搜索会话)
├─ CanvasViewport
│  ├─ CanvasWorld (transform)
│  │  ├─ EdgeLayer (SVG)
│  │  └─ NodeCard[] (title, time, context% + bar + compress icon)
│  ├─ EmptyState (no tracked / no search)
│  └─ ZoomControls (bottom right; no pan hint)
├─ DetailDrawer (title/meta/actions/fork point/context/compress/stop; no lineage/overview)
├─ ProposalThread (bottom; proposal card; config tags)
├─ Composer (textarea; mode/permissions/auto; send hint; send)
├─ SettingsModal (layout, RA model, default model)
├─ HistoryModal (RA decisions)
├─ UntrackedModal (stop/restore)
├─ CompressConfirm / StopConfirm
├─ OnboardingOverlay (progress)
└─ Toast
```

### 14.3 数据流

- On mount: resolve cwd from `ctx.sessions.list` current session's `cwd` (fallback `ctx.workspaces`/`uiWorkspace` current); no project switch in V1. Then `GET api/router/state`, `tree`, `settings`, `models`; subscribe `sessions.list` for running.
- Refresh tree every 3s while visible and on `sessions.list` change; don't poll hidden.
- Search filters titles client-side; dim non-matches; Enter centers.
- Node click: detail; double-click: `openSession`.
- Compress: `POST compress`; modal; update.
- Stop: `POST tracking {false}`; tree; history? no.
- Untracked: `GET untracked`; restore.
- Settings: `GET/POST`; layout immediate; models.
- History: `GET`.
- Composer ask: `POST ask`; poll pending 500ms; render proposal; confirm/choose/abandon; auto: poll executing/done.
- Auto toggle: local state; sent in ask; hint changes.
- Onboarding: state.status running → overlay with done/total; poll every 1s; complete → close.

### 14.4 Canvas

- Pure `layout.js`:
  - `layoutVertical(sessions)` / `layoutHorizontal(sessions)`; both with order and parent center.
  - Constants: NODE_W 196, NODE_H 70, GAP_X 28, GAP_Y 54, ROOT_GAP 48, PAD 80.
  - Vertical: roots by `lastActiveAt` asc left→right; kids by asc left→right; parent centered horizontally; subtree width.
  - Horizontal: roots by lastActive asc top→bottom; kids by asc top→bottom; parent centered vertically; subtree height.
  - `edges`; `bounds`.
- Pan/zoom: like prototype; wheel zoom 0.2–1.6; drag; fit; latest; dot grid; edge fade.
- Initial fit: recent 4 roots (wide), 3 (700–980), focus latest (<700); horizontal top-align; no top HUD.
- Search: dim; Enter center.
- Node: context percent/bar/compress; no T9/branch count; active glow; pending dashed; selected; new flash.
- Detail: no overview/lineage; context/compress/stop; fork select; title edit; open.
- Modals: settings/history/untracked/compress/stop.
- Composer: mode/permissions/auto; proposal config; auto hint.
- CSS tokens `--dsw-*`; no hard-coded colors; container queries.
- Accessibility: keyboard, aria, reduced motion.

### 14.5 错误状态

| 状态 | UI |
|---|---|
| 当前无项目/工作区 | 面板空态“打开一个项目后使用 Router” |
| 没有跟踪中的会话 | 画布中央“没有跟踪中的会话”+未跟踪列表 |
| 搜索无结果 | “没有匹配的会话名称”+清除 |
| 模型目录为空 | 设置里禁用模型选择，提示“没有可用模型” |
| RA 无法创建/preset 缺失 | 面板顶部错误条 + 诊断；禁用输入 |
| RA 判断超时/失败 | 对话层错误 + 重试；不自动换目标 |
| 提议过期 | 卡片“提议已过期”+重新判断 |
| 目标有新进展 | 卡片“目标刚有新进展”+重新判断 |
| 模式/权限不支持 | 卡片/设置明示“目标保持当前设置”；不静默 |
| 压缩 busy/unsupported | toast/弹层原因；按钮保留可重试 |
| 原生 fork 不可用 | 卡片明示降级为新建；不假装分叉 |
| onboarding 失败 | 进度页错误 + 重试；未完成不开放路由 |

### 14.6 关键交互细节

- Node compress icon: `stopPropagation`; no select.
- Detail `分叉` button: sets composer forced fork; chip "从《…》T9 分叉"; send.
- Proposal `fork` select changes turn; card label/hint; confirm uses selected.
- Auto proposal: no confirm; card badge "自动执行"; host executes; poll result.
- Stopped parent: children become roots; the model has no lineage display; no UI note except the stop modal.
- Empty: no tracked → "没有跟踪中的会话" + untracked list; search no result → clear.
- Onboarding: full overlay; progress; pause/resume; no routing until done.
- Settings layout: switch immediately re-layouts; close.
- History: task/action/target/reason/result; auto tag; open RA session link.

---

## 15. 功能矩阵（全量验收）

| # | 功能 | 实现位置 | 验收 |
|---|---|---|---|
| 1 | 项目级 RA，每项目一个 | Host `ProjectStore` + `RaSessionManager` | 打开两个项目各有独立 `.dsh_RA` 与 RA session |
| 2 | RA 真实会话 + `router` preset | bundle patch + preset | 原生 session 可见；preset 为 router |
| 3 | RA 只有 4 个工具 | router-tools `tools.restrict` + preset plugins | `Tool.listTools` 仅 4 个；无 fs/bash/web |
| 4 | RA 不读/写代码 | 工具白名单 + prompt | 尝试读文件无工具；工具调用失败 |
| 5 | 继续提议 | `ra_propose route` + confirm | 目标会话收到任务；busy 排队 |
| 6 | 分叉提议 | `ra_propose fork` + boundary atSeq | fork 到 Tn；子节点在父下/右 |
| 7 | 分叉点可改 | 卡片/详情 select | 改 T6 后 fork at T6 |
| 8 | 新建干净会话 | `ra_propose new` + agents.create | 首条消息=任务；无交接 |
| 9 | 新会话默认模型 | settings + create agentOptions | 新 session 用设置模型 |
| 10 | 追问 | `ra_propose ask` + choose | 两个候选；选后 route 卡 |
| 11 | 自动执行 | ask auto + Host schedule | 无确认；结果“自动执行”；ask 不允许 |
| 12 | 最近 7 天默认跟踪 | sessionReader cutoff | 18 tracked/4 stale 演示；真实项目按 updatedAt |
| 13 | 首次全量预生成 | BriefPipeline queue | 进度 10/18→18/18；断开可续 |
| 14 | 增量更新 | session/event + debounce | turn/end 后 brief/树更新 |
| 15 | 旁路观察 | session/event | 直接对话后 lastActive/上下文变化 |
| 16 | 无限画布 | Canvas | 拖拽/滚轮/适应/最近 |
| 17 | 纵向排列 | layout vertical | 父上子下、根左→右 |
| 18 | 横向排列 | layout horizontal | 父左子右、根上→下 |
| 19 | 最后活跃排序 | trackedRoots/siblings | 根/同级按时间 |
| 20 | 分叉不移动父 | layout | 父保持位置 |
| 21 | 首屏适配 | fitRecent | 4/3/1；横向顶对齐 |
| 22 | 节点上下文 | tree context + NodeCard | %/条/颜色 |
| 23 | 节点压缩图标 | NodeCard + compress API | 点击确认；更新 |
| 24 | 详情上下文 | Detail | 精确用量 + 按钮 |
| 25 | 节点无一句话/概览/血缘/T9/分支数 | NodeCard/Detail | DOM 不含 |
| 26 | 详情无预览/血缘 | Detail | DOM 不含 |
| 27 | 停止跟踪 | Detail + tracking API | 确认；画布/RA 移除；撤销 |
| 28 | 父子停止语义 | trackedParent | 子会话顶层；父恢复回挂 |
| 29 | 未跟踪列表 | UntrackedModal | 手动/一周前；恢复 |
| 30 | 设置界面 | SettingsModal | 纵向/横向、RA/新会话模型 |
| 31 | 设置持久化 | state.json | 重启后保持 |
| 32 | 输入区计划模式 | Composer | 派发会话级计划；卡片 |
| 33 | 工作区权限 | Composer | 只读/工作区/完全；卡片；明示 |
| 34 | 自动执行开关 | Composer | 默认关；开；提示 |
| 35 | 提议配置行 | Proposal | 模式/权限/auto 标签 |
| 36 | 对话历史 | HistoryModal | 任务/动作/目标/理由/结果 |
| 37 | 顶部精简 | PanelHeader/Search | 无排序/跟踪数/右侧最近活跃 |
| 38 | 搜索“搜索会话” | SearchBar | 占位；Enter 定位 |
| 39 | 底部无平移提示 | Canvas | 无 hint；有缩放 |
| 40 | 标题编辑 | Detail + rename | 手动优先；原生尽力 |
| 41 | 主题 | CSS tokens | 深浅色；容器查询 |
| 42 | 窄屏 | container queries | 详情浮层；可读 |
| 43 | 数据 `.dsh_RA` | ProjectStore | 目录/原子/gitignore |
| 44 | 安全边界 | token/lastSeq/auto | 目标变化 409；不自动旧提议 |
| 45 | 安装/构建 | package/bundle | `dsh plugin add`；面板出现 |
| 46 | 能力探测 | probe | 缺失功能明示/隐藏 |

---

## 16. 测试计划

### 16.1 单元

- `atomic.js`：并发写/崩溃恢复；锁超时。
- `brief/extract.js`：从 fixture events 提取 turns/files/boundaries。
- `brief/merge.js`：增量合并保留 manual。
- `lineage.js`：native/title/plugin/unknown。
- `layout.js`：纵向/横向根序、兄弟序、父居中、子树不重叠。
- `context-usage.js`：projection/fold/unknown。
- `proposal`：token/expiry/target-changed/auto/ask reject。

### 16.2 Host 集成（fake ctx + real DSH test profile）

- 创建测试工作区（`D:/tmp/dsh-ra-test`）和 6 个会话：3 个最近、2 个旧、1 个 fork。
- 首次接入只索引 3；旧 3 未跟踪；进度。
- 停止父会话：子会话顶层；恢复回挂。
- fork atSeq：子会话 inherited 边界正确；lineage sidecar。
- new：首条消息=任务；model 设置。
- 自动：无确认执行；history auto。
- compress：/compact；context 更新；busy 409。
- settings：layout/models 持久化；RA model 应用。
- history：记录/顺序。
- 不修改测试工作区外会话。

### 16.3 真实 UI（Edge headless + CDP）

- 启动隔离 profile（`DSH_HOME=D:/tmp/dsh-ra-profile`）+ web profile；主面板出现。
- 画布/纵向/横向、缩放/平移、搜索、详情、压缩、停止/恢复、设置、历史、自动、onboarding。
- 1440×1000 / 900×800 / 780×860；深/浅色。
- 断言同原型 80 项 + 真实 API 结果。
- 错误状态：无模型/无压缩/无投影/无 preset。

### 16.4 能力探测

- `npm run probe` 输出 JSON；M0 验收；每次 DSH 升级重跑。
- 失败能力对应的 UI disabled 状态测试。

### 16.5 命令

```bash
npm run build
npm test
npm run test:ui
npm run probe
```

---

## 17. 里程碑

### M0：能力探测 + 空壳（0.5–1 天）

- 创建 package/bundle/preset；host plugin 提供 `routerAgent` + `/api/router/state`；client 面板 "Router" 占位。
- `probe.js` 输出；确认 `main` keyed/sidebar id、`connection.fetch`、preset 创建、RA agent 创建。
- 验收：DSH 启动无错误；面板可见；probe JSON 完整；preset 出现在 preset 列表；RA 会话可创建。
- 若 preset 不能通过 bundle 注册 → 停止，改用 profile 目录式 0.1.5 方案或报告阻塞。

### M1：项目数据 + 画布只读（2–3 天）

- ProjectStore、SessionReader、lineage、brief skeleton、first-run queue、tree API、context usage、settings layout/models、client canvas node/detail read-only.
- 验收：最近 7 天 tracked/stale；18/18 进度；纵向/横向切换；节点上下文；详情无概览/血缘；窄屏。
- 不做 RA/发送。

### M2：RA 会话 + 继续（2–3 天）

- preset/tools/system prompt；RA session manager；ask/pending/proposal/confirm；route dispatch；history basic.
- 验收：输入任务 → RA 调工具 → 提议卡 → 确认 → 目标收到消息；忙碌排队；ask 卡片。
- 安全：token/lastSeq；无自动。

### M3：分叉 + 新建（2–3 天）

- boundaries atSeq；fork API；lineage sidecar；new agents.create + model；title；child position.
- 验收：T9 分叉、子节点下方/右侧；新建首条任务；无交接；lineage 正确。
- 0.2.2 fork parent 缺失 → sidecar.

### M4：模式/权限 + 自动执行（2–3 天）

- Composer mode/permissions/auto；applyDispatchSettings；planMode/permissionPresets/sandbox/approval；auto schedule；proposal config.
- 验收：计划/只读生效并明示；auto 无确认执行；ask 在 auto 拒绝；目标变化 409。
- 能力缺失 → UI 明示。

### M5：停止/恢复 + 压缩 + 上下文实时（2–3 天）

- tracking endpoints；untracked modal；stop parent semantics；compress endpoint；context events.
- 验收：停止/撤销/恢复；子会话顶层；压缩 88→31；busy/unsupported；节点/详情更新。

### M6：增量 + 旁路 + 标题 + 历史完整（2–3 天）

- turn/end debounce；merge；observe；title/rename；history modal；onboarding pause/resume.
- 验收：直接对话后树/上下文更新；手动标题不被覆盖；历史记录完整。

### M7：真实桌面端集成 + UI 打磨（2–4 天）

- 面板在 desktop profile；主面板/sidebar；主题/窄屏；空态/错误/加载；客户端 bundle 缓存；截图。
- 验收：示例项目只读打开；不写真实会话；不自动发送；性能 50+ 节点。

### M8：验收 + 文档（1–2 天）

- 功能矩阵全过；host/UI tests；README/API/TROUBLESHOOTING；截图；release tarball。
- 验收：`npm run check` + `npm run test:ui` 绿；M0 probe 记录；用户验收。

---

## 18. 风险与降级

| 风险 | 影响 | 降级 |
|---|---|---|
| 0.2.2 fork 不写 parentSession | 已有 fork 血缘丢失 | sidecar（插件创建的）；title/isSeeded；unknown 当根；不伪造 |
| 原生 fork 不可用 | “分叉”无法继承上下文 | probe.fork=false → 卡片明示降级为新建干净会话；不假装 |
| fork atSeq 语义版本差 | 分叉点偏 | 边界用 turn/end seq；0.1.5 anchor 同样落在该 turn/end |
| context projection 不可用 | 无百分比 | fold usage/contextWindow；仍无 → 隐藏；不伪造 |
| compaction 不可用 | 压缩按钮无效 | probe 隐藏/置灰；501；toast |
| plan/permission 是会话级 | 派发设置改目标 | 卡片显示 before→after；确认/auto；不可用则明示 |
| model 不提供 | 设置/新建失败 | modelCatalog fallback；默认模型；报错 |
| preset 不能动态注册 | RA 无工具 | 必须 bundle；M0 阻塞；文档 |
| 工具 restrict 不影响自有注册 | 可能有额外工具 | preset plugins 只挂 router-tools；审计 Tool.listTools |
| `.dsh_RA` 非 storageDomain | 并发/损坏 | atomicWrite/lock/corrupt backup；文档 |
| 50+ 节点性能 | 卡顿 | DOM/SVG 50 足够；>500 虚拟化 |
| 客户端 bundle 缓存 | 旧 UI | 清 Cache/Code Cache；版本查询 |
| 自动执行误派 | 信任风险 | 默认关；卡片/历史留痕；token/lastSeq |
| 最近 7 天边界 | 老会话不可路由 | 未跟踪恢复；恢复时重建 |
| 首次全量耗时 | 等待 | 进度/暂停/后台；失败 fallback |
| 真实项目写入 | 风险 | 集成测试隔离；RA 只读；不写真实会话 |

---

## 19. 交付清单与启动

### 19.1 交付物

- `lib/index.js` / `lib/router-tools.js` / `lib/client.js`
- `cordis.patch.yml` / `package.json` / `README.md`
- `PLAN.md` / `DESIGN.md` / `docs/API.md` / `docs/ACCEPTANCE.md`
- `test/` 与 probe 结果
- 14 张 UI 截图（真实 DSH 面板，非 HTML 原型）

### 19.2 M0 启动命令

```bash
cd D:/code/dsh-router-agent
npm install
npm run build
npm run probe
```

### 19.3 完成定义

- 第 15 节矩阵 46 项全部勾选。
- `npm run check` 与 `npm run test:ui` 通过。
- 真实 DSH desktop 中：面板出现；RA 会话出现；路由/分叉/新建/自动/停止/压缩/设置/历史全部可用或明确 disabled。
- 没有未处理的 console error / slot error。
- 不修改真实项目会话；测试数据可清理。

---

## 附录 A：关键 schema（可直接复制）

### A.1 settings

```json
{
  "layout": "vertical",
  "raModel": { "provider": "deepseek-official", "model": "deepseek-flash" },
  "defaultSessionModel": { "provider": "deepseek-official", "model": "deepseek-chat" },
  "composer": { "mode": "standard", "permissions": "workspace", "auto": false }
}
```

### A.2 tree item

```json
{
  "sessionId": "sess_...",
  "title": "...",
  "parentSessionId": null,
  "lastActiveAt": "2026-11-19T...",
  "lastActiveLabel": "13:44",
  "turns": 12,
  "running": false,
  "context": { "usedTokens": 176000, "limitTokens": 200000, "percent": 88 },
  "boundaries": [{ "turn": 9, "label": "速度曲线与回放联动" }]
}
```

### A.3 proposal

见 6.4。

### A.4 dispatch

见 6.5。

---

## 附录 B：API 速查

| 目的 | 调用 |
|---|---|
| 项目会话 summaries | `ctx.sessionController.list({})` → filter `cwd` |
| 会话记录 | `ctx.sessionQuery.readSession(id)` / live `ctx.sessions.get(id)` |
| 项目过滤 | `ctx.sessionQuery.filterSessions([{kind:'cwd',values:[cwd]}])` |
| 读取 turn/events | `sessionQuery.readSession` / `ctx.sessionController.events({address})` |
| fork | `ctx.sessionController.fork({sessionId, atSeq, allowMigration:true})` |
| prompt | `ctx.sessionController.prompt({requestId,sessionId,mode:'queue',content:[{type:'text',text}]}, signal)` |
| create agent | `ctx.agents.create({sessionId, meta:{cwd,agentPreset?}, agentOptions:{provider,model}, setup})` |
| resume | `ctx.agents.resume({resumeSessionId, agentOptions})` |
| context | `ctx.sessionProjections.snapshot(session,['contextPressure','tokenUsage'])` / `ctx.sessionController.projections({sessionId})` |
| compact | `ctx.commands.execute(sessionId,'/compact',[])` / `ctx.compaction.compactNow` |
| plan | `ctx.planMode.get/set(agent, active)` |
| permissions | `ctx.permissionPresets.catalog/current/set`；`ctx.sandboxPolicy.setSandboxMode`；`ctx.approval.setPolicy` |
| models | `ctx.sessionController.modelCatalog()` |
| LLM summary | `ctx.llm.stream({provider,model,messages,system,temperature:0,maxTokens,signal})` |
| tools | `ctx.tools.register(def)`；`ctx.tools.restrict({allow})` |
| prompt section | `ctx.systemPrompt.section({name,order,text})` |
| custom service | `ctx.provide('routerAgent', service)` |
| HTTP | `ctx.connection.fetch.register({path:'/api/router/...',methods,requestBody:'buffered',fetch})` |
| client main | `{name:'main',key:PANEL_ID}` |
| client sidebar | `{name:'sidebar.panellist',id:PANEL_ID}` |
| open session | `ctx.sessions.open(id)` / `uiWorkspace.openSession(id)` |

---

## 附录 C：研究来源

- `C:/Users/user/.dsh/profiles/desktop/node_modules/dsh-tree-view` v1.3.1：live/cold session 读取、HTTP 路由、sidecar 原子写、main/sidebar/slot 注册。
- `D:/code/dsh-plugins/packages`：tools.register/output/render、systemPrompt.section、session/event、主面板/sidebar/header utilities、`/api` fetch 路由。
- `C:/Users/user/.dsh/profiles/node_modules/@deepseek-ai/*` 0.1.5：sessionController fork/prompt/create、token meter、plan/permission、preset 目录式。
- `D:/code/_notes/asar-extract/dsh/node_modules/@deepseek-ai/*` 0.2.1：projection、fork、preset、permission 投影。
- `D:/deepseek harness/resources/app.asar` 0.2.2-rc.5：fork atSeq、session projection、compaction、plan/permission、agent preset、model catalog。
- `C:/Users/user/AppData/Local/Temp/dshdocs` 0.2.2-rc.1：plugin/bundle/preset/slots/session/tools/web-server 文档。
