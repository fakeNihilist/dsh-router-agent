# dsh-router-agent

> 文档语言：简体中文（默认 README）。

项目级 **Router Agent**（RA）插件，用于 DeepSeek Harness（DSH）0.2.2。

同一个功能的修改经常散落在多个会话里。上下文一长，只能新开会话，Agent 又要重新读代码。
这个插件把项目里的会话变成一组**可路由的上下文单元**：来一个任务，Router 判断
**继续已有会话 / 从某轮分叉 / 新建干净会话**，而不是让用户自己猜该打开哪一个。

> RA 不读代码、不写代码。它只读索引、只提交提议；默认必须由用户确认后才发送。

## 功能

- **横向铺开的无限画布**：根节点按各自最后活跃时间排列，分叉向下（纵向，默认）或向右（横向）。
- **每个节点显示上下文占用**：百分比 + 2px 条 + 压缩图标；阈值 60/85 变色。
- **详情不展示概览、一句话、血缘或分支数**：父子关系只由连线和分叉点表达。
- **继续 / 分叉 / 新建**：分叉落到具体 `turn/end` 的 `atSeq`，用户可以在提议卡或详情里换分叉点。
- **默认只跟踪最近 7 天**：更早的会话进入“未跟踪会话”，可恢复；恢复后重新进入 RA 上下文。
- **停止父会话只停父本身**：跟踪中的子会话移到顶层继续跟踪；恢复父会话后自动回挂。
- **计划模式 / 工作区权限**：输入区的派发设置按**会话级**生效，提议卡会显示目标当前设置和将要发生的变化。
- **自动执行**：默认关闭；用户显式开启后，RA 判断完由 Host 校验目标 `lastSeq`（读不到时 fail-closed 拒绝）后直接发送，不再确认。
- **与 RA 的对话历史 + 派发记录**：任务、动作、目标、理由、结果（已发送/已创建/已分叉/自动执行/未执行/失败）。
- **首次接入预生成索引**：只索引跟踪范围，显示进度；Host 重启会续跑，队列失败会显示可重试的失败状态，单会话失败降级为抽取式索引。
- **旁路更新**：用户直接在 DSH 里继续会话，`turn/end` 后按日志 revision 防抖刷新索引和画布。
- **原生压缩**：调用 DSH `/compact`（或 `ctx.compaction.compactNow`），不伪造成功；运行中/不可用时明确提示。
- **主题与窄屏**：使用 `--dsw-*` token，深/浅色一致；容器查询适配窄面板。

## 安装

要求：DSH Desktop `0.2.2-rc.x`（session format V4），Node `>=22.19`。

```bash
git clone https://github.com/<owner>/dsh-router-agent.git
cd dsh-router-agent
npm install
npm run build

# 装进 desktop profile（link 到当前仓库）
dsh plugin --profile desktop add link:"$PWD"

# 重启 DSH Host；客户端改动后刷新页面
# 桌面端缓存异常时，只清 %APPDATA%/@deepseek-ai/dsh-desktop 的 Cache / Code Cache
```

插件会注册：

- 一个 Host 插件行 `dsh-router-agent`；
- 一个 Agent preset `router`（显示名 `Router`）；
- 浏览器端主面板（keyed `main`）和侧栏入口 `Router`。

### 隔离试跑

```bash
cd dsh-router-agent
DSH_HOME=D:/tmp/dsh-ra-home dsh --profile ui --from-default-profile web --dump-config
DSH_HOME=D:/tmp/dsh-ra-home dsh plugin --profile ui add link:"$PWD"
DSH_HOME=D:/tmp/dsh-ra-home dsh --profile ui --no-open --port 8170
```

打开的 URL 带一次性 token；面板通过同源认证的 `/api/router/*` 读取数据。

## 使用

1. 在 DSH 中打开一个已有会话的项目。
2. 点击侧栏 **Router**。
3. 首次进入会建立最近 7 天的会话索引；完成后画布出现节点。
4. 在底部输入任务，按 Enter 发送给 RA。
5. RA 调 `ra_tree` / `ra_brief` 后给出一个提议：
   - **继续**：目标会话收到任务；
   - **分叉**：从 Tn 的 `atSeq` 创建子会话，子节点挂在父节点下方/右侧；
   - **新建**：干净会话，首条消息就是任务原文，没有交接包；
   - **追问**：给一个明确选择，回答后 RA 继续判断。
6. 默认点“确认发送”；开启“自动执行”后不再确认，但结果会写入派发记录。

### 输入区

- **模式**：标准 / 计划模式。计划模式通过 `/plan` 命令作用于**目标会话**；卡片刻意显示目标当前状态。
- **工作区权限**：只读 / 工作区内修改 / 完全访问。通过 `permissionPresets.set` 作用于目标会话。
- **自动执行**：默认关；开启后 RA 不能再用 `ask`，必须直接选择 route/fork/new。
- **跨目标变化**：确认时若目标会话在提议后又有新事件，Host 返回 `409 target-changed`，不会把任务发到已经变了的上下文里。

### 设置

齿轮：

- 节点排列：纵向（根从左到右、分叉向下）/ 横向（根从上到下、分叉向右）。
- RA 模型：只影响 Router 会话；通过 `agent.model.select` 应用，不改变部署默认。
- 新会话默认模型：只用于 Router 新建/分叉出的会话。

### 未跟踪会话

时钟旁的「更多」→“未跟踪会话”。默认只跟踪最近 7 天；手动停止的会话也在这里。恢复后写回 `.dsh_RA` 的 `pinned`，重新进入跟踪范围。

## 安全边界

- **RA 只有 4 个工具**：preset 的 `plugins` 挂 native executor + `router-tools`；`router-tools` 用 deny 列表隐藏继承的全局工具，并在 `tools/change` 时刷新（覆盖 MCP 等之后动态注册的工具），再用 `tools.guard` 做只允许 `ra_*` 的执行兜底。没有 fs / bash / web / subagent / workflow；PTC 部署下也不会暴露 `run_code`。
- **提议与发送分离**：`ra_propose` 只写 `proposals/<token>.json`。发送由 Host 在用户确认后执行；自动执行必须由用户显式开启。确认以 compare-and-set 认领 `executing`，并发请求只执行一次；fork/new 已创建会话后失败会标记 failed，不会重试出第二个子会话。
- **token + lastSeq 校验**：确认时校验 token、过期时间、项目、目标最后事件 seq；读不到目标日志时拒绝执行（fail-closed）。
- **不改写历史**：brief、跟踪、设置、历史全部在项目侧车 `.dsh_RA`；RA 不会 rename 路由目标。brief 与派发历史会脱敏 `sk-…`、`Bearer …`、key-value 凭证。
- **不覆盖有意义标题**：只有新建/分叉时 RA 显式给出的标题才调原生 rename；用户手动改名会写侧车并尽力同步原生标题。
- **压缩是用户动作**：不经过 RA；需要 live idle agent；失败原样返回，不假装成功。

## 数据

项目根目录 `.dsh_RA/`：

```text
.dsh_RA/
  .gitignore
  state.json                 # 跟踪/停止/设置/RA 会话/lineage/标题/onboarding
  sessions/<id>.json         # 内部 brief（不渲染概览）
  proposals/<token>.json     # RA 提议
  dispatch.jsonl             # 派发历史
  diagnostics/probe.json     # 能力探测
```

这是 DSH 官方 `storageDomain` 的**有意例外**：产品要求数据跟着项目走。插件自己实现原子写（temp + rename）、进程内与跨 Host 文件锁、并发 brief 写入和 `.gitignore`；`.dsh_RA/.gitignore` 只含 `*`，目录不会出现在 `git status`。`dispatch.jsonl` 保留最近 `maxHistory`（默认 100）条，过期 proposal/brief 会定期清理。

## 能力探测

首次加载/每次 DSH 升级后，`probeHost(ctx)` 记录（`state` 读取会刷新当前结果）：

- `sessionController` list/create/fork/prompt/projections/modelCatalog/selectModel/rename
- `sessionQuery` read/observe/inspect/list
- `sessionProjections.snapshot`
- `compaction.compactNow` / `commands.execute`
- `planMode` / `permissionPresets` / `sandboxPolicy` / `approval`
- `llm.stream`
- `connection.fetch.register` / `webServer.register`
- `tools.register/restrict/guard` / `systemPrompt.section`
- `agentPresets` / `sessionTitle` / `workspaceRegistry`

`GET /api/router/probe` 返回当前进程结果；UI 用 probe 驱动 disabled 状态。

## 开发与测试

```bash
npm run build       # esbuild 打包客户端到 lib/client.js
npm test            # 单元 + 假 Host 集成（73 项）
npm run test:ui     # 真实 DSH Web + Edge headless + CDP（隔离 profile）
npm run probe       # 读取 .dsh_RA/diagnostics/probe.json
npm run probe -- <token-url>  # 从运行中的 DSH Web 读取实时 probe
npm run check       # build + test
```

`npm run test:ui`（需要本机 Edge headless）：

- 使用 `DSH_HOME=D:/tmp/dsh-ra-ui-home`（可用 `DSH_RA_UI_HOME` 覆盖）；
- 会把本机 `.dsh/.credentials.yaml` 与模型设置复制到隔离 HOME，仅用于模型目录；设置 `DSH_RA_UI_NO_CREDENTIALS=1` 可完全跳过；
- 生成 16 个**合成 V4 会话**（不是真实项目数据）；
- 启动真实 DSH Web，Edge headless 驱动面板，包含“打开会话”导航断言与真实 Router preset 工具边界断言；
- 截图写入 `test/ui/shots`；
- 不读取、不修改真实项目会话。

真实环境的压缩用独立导入的真实会话验证过：36.6k → 24.3k。
自动执行、分叉 atSeq、计划模式、权限、停止/恢复、目标变化 409 都有 Host 集成测试。

## 已知限制

- 压缩需要会话已有 live idle Agent；冷会话请先在 DSH 中打开。
- 计划模式 / 权限是**会话级**，不是按 prompt 传参；派发会改变目标会话，卡片会显示 before → after。
- 0.2.2 普通 fork 不写 `parentSession`；插件用自己的 `.dsh_RA/lineage` 记录，已有 fork 依次尝试 `parentSession`、`Fork of` 标题、否则当根。
- 模型目录依赖部署凭据；没有可用模型时，设置里的模型项只显示“跟随部署默认”。
- RA 的工具调用依赖目标模型原生 tool calling；不支持 tool calling 的模型会把调用写成文本。
- 多个 DSH Host 同时服务同一项目时，sidecar 写入有跨进程锁并会重读合并，但界面状态仍是最终一致；建议同一项目只在一个窗口做跟踪/派发。
- 树与 RA 工具下发的分叉边界有上限（树 100、`ra_tree` 30、`ra_brief` 200），更早的轮次不进入下拉；服务端仍会用完整边界校验 `atSeq`。
- `dispatch.jsonl` 只保留最近 `maxHistory`（默认 100）条。
- 未专门处理归档会话的恢复；是否能出现在列表取决于当前 DSH 的 Host 列表行为。

## 目录

```text
src/host/              Host 插件、ProjectStore、SessionReader、摘要、派发、路由
src/router-tools.js    RA preset 的 4 个工具 + 提示词 + 工具白名单
src/client/            React 面板、画布、详情、输入区、弹层
test/unit/             纯函数单测
test/host/             假 Host 集成
test/ui/               真实 DSH + Edge 验收
tools/make-fixtures.mjs 合成 V4 测试会话
docs/                  API / 验收 / 排障
```

## License

MIT
