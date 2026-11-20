# 验收矩阵

环境：DSH Desktop `0.2.2-rc.5`（web carrier，Edge headless）+ 隔离 profile。
数据：16 个合成 V4 会话（13 跟踪、3 未跟踪）+ 1 个导入的真实会话（仅压缩验证）。
一个真实项目的会话没有被读取或修改（路径与名称已脱敏）。

状态：✅ 已实现并验证；⚠️ 已实现，结果取决于部署能力（probe/DSH 服务）。

| # | 功能 | 状态 | 证据 |
|---|---|---|---|
| 1 | 项目级 RA，每项目一个 | ✅ | `state.json.raSessionId`；`test/host` ask 测试；UI 项目下拉 |
| 2 | RA 真实会话 + router preset | ✅ | 真实会话 `agentPreset: router`；`debugAgent` 返回 preset |
| 3 | RA 只有 4 个工具 | ✅ | 真实 `debugAgent` 返回 `ra_tree/ra_brief/ra_history/ra_propose`；preset 挂 native executor + 动态 deny + guard |
| 4 | RA 不读/写代码 | ✅ | 全局工具 deny + `ra_*` guard；无 fs/bash/web/subagent/workflow；PTC `run_code` 也被 native executor 排除 |
| 5 | 继续提议 | ✅ | `route proposal confirms token and sends the task`；真实 RA 路由 |
| 6 | 分叉提议 | ✅ | `fork proposal records atSeq...`；真实 RA T2 fork 确认 |
| 7 | 分叉点可改 | ✅ | `a fork proposal can change its boundary...`；提议卡 select（详情不再提供分叉点） |
| 8 | 新建干净会话 | ✅ | `new proposal creates a clean session...`；首条 prompt=task |
| 9 | 新会话默认模型 | ✅ | `new proposal... applies the model`；fork 同样应用 |
| 10 | 追问 | ✅ | `answering an ask proposal...`；回答信封携带原任务；UI 选项/回答输入 |
| 11 | 自动执行 | ✅ | `auto mode executes...`；真实 RA route 自动发送；`mode: auto` 历史 |
| 12 | 最近 7 天默认跟踪 | ✅ | `state indexes only the last 7 days...`；UI 13 tracked/3 untracked |
| 13 | 首次全量预生成 | ✅ | `onboarding 13/13`；`onboarding resumes...`；失败进入可重试的 failed 状态 |
| 14 | 增量更新 | ✅ | `a turn/end event refreshes the brief...`；live 会话按日志 revision 失效缓存 |
| 15 | 旁路观察 | ✅ | 同一 turn/end 订阅；直接对话后树/上下文刷新 |
| 16 | 无限画布 | ✅ | UI 缩放/平移/适应/最近；`08-narrow` 截图 |
| 17 | 纵向排列 | ✅ | `vertical: roots...` / `forks...`；`01-default` 截图 |
| 18 | 横向排列 | ✅ | `horizontal: roots...`；`04-horizontal` 截图 |
| 19 | 最后活跃排序 | ✅ | layout 单测；根/兄弟按 `lastActiveAt` |
| 20 | 分叉不移动父 | ✅ | layout 父节点位置只由子树跨度决定，不被子活跃推动 |
| 21 | 首屏适配 | ✅ | `fitSelection` 4/3/1；1440/900/780 截图 |
| 22 | 节点上下文 | ✅ | `% + 2px 条`；阈值 60/85；UI 截图 |
| 23 | 节点压缩图标 | ✅ | 点击弹确认；使用提供的压缩 SVG；Host `/compact`；真实会话 36.6k→24.3k |
| 24 | 详情上下文 | ✅ | 精确 used/limit/%；`02-detail` 截图 |
| 25 | 节点无一句话/概览/血缘/T9/分支数 | ✅ | NodeCard 只渲染 title/time/context |
| 26 | 详情无概览/血缘 | ✅ | UI 测试断言 `doesNotMatch(/概览|血缘|一句话/)` |
| 27 | 停止跟踪 | ✅ | `stop parent...`；确认弹层；未跟踪恢复 |
| 28 | 父子停止语义 | ✅ | `stop parent makes child root; restore reattaches`；真实 UI 截图 |
| 29 | 未跟踪列表 | ✅ | `05-untracked`；reason `stopped/older`；只含当前选中项目；无顶部提示；列表独立滚动、底部固定；最大高度 `min(560px, 100% - 40px)`；勾选同意后批量恢复，按钮不带数量 |
| 30 | 设置界面 | ✅ | 布局/RA/新会话模型三项；模型下拉不再有“跟随部署默认”，未设置时预选部署默认模型；`settings persist...`；模型组依赖部署凭据 |
| 31 | 设置持久化 | ✅ | `settings persist...`；`.dsh_RA/state.json`；显式清空/局部更新已单测 |
| 32 | 输入区计划模式 | ✅ | 真实 `applySettings`：`/plan` → `plan.active=true`；卡片标签 |
| 33 | 工作区权限 | ✅ | 真实 `permissionPresets.set`：workspace-write→read-only→回退 |
| 34 | 自动执行开关 | ✅ | 默认 false；UI 开关/警告；真实 auto |
| 35 | 提议配置行 | ✅ | 标准/计划、工作区权限、自动标签、目标 before→after |
| 36 | 对话历史 | ✅ | `06-history`；任务/动作/目标/理由/结果 |
| 37 | 顶部精简 | ✅ | 无排序/跟踪数/右侧最近活跃；搜索占位“搜索会话” |
| 38 | 搜索 | ✅ | UI 测试：输入变淡、Enter 选中；placeholder 正确 |
| 39 | 底部无平移提示 | ✅ | 只有缩放控件；无 hint |
| 40 | 标题编辑 | ✅ | 详情双击/重命名；sidecar + 原生 rename |
| 41 | 主题 | ✅ | light `01-default`；dark `shots-dark/01-default`；`--dsw-*` token |
| 42 | 窄屏 | ✅ | `11-narrow`；780×860 无横向溢出；缩放控件在输入区上方（UI 断言无重叠） |
| 43 | `.dsh_RA` | ✅ | `ProjectStore` 单测；原子写/跨实例合并/损坏归档/`.gitignore` |
| 44 | 安全边界 | ✅ | token/lastSeq/项目/过期；并发 confirm 只执行一次；target 不可读 fail-closed；auto ask 拒绝 |
| 45 | 安装/构建 | ✅ | `npm run build`；真实 profile `dsh plugin add link:` |
| 46 | 能力探测 | ✅ | `probeHost` 每次 state 刷新；`connection` 通过 `ctx.inject` 等待；UI disabled 由 probe 驱动 |
| 47 | 打开会话导航 | ✅ | UI 测试点击详情“打开会话”，断言 Router 面板退出并重新进入 |
| 48 | 设置清空/局部更新 | ✅ | `settings can clear a model and a partial patch keeps the layout` |
| 49 | 计划/权限回滚 | ✅ | `a permission failure rolls the plan change back` |
| 50 | 工具边界封闭性 | ✅ | 动态 `tools/change` 刷新、guard 拒绝非 `ra_*`、restrict 失败即失败；真实 DSH 只返回 4 工具 |
| 51 | 脱敏 | ✅ | `redactSecrets`/`redactBrief` 单测；`buildSummaryInput` 脱敏断言 |
| 52 | 派发幂等 | ✅ | `two concurrent confirms execute a route proposal once`；fork/new 失败保留 `resultSessionId` |
| 53 | 项目切换 | ✅ | 项目下拉列出全部项目；`switching projects reads only that project...`；切换后画布/未跟踪只含该项目，并重新适配视图 |
| 54 | 控件观感 | ✅ | 面板内自定义 tooltip；下拉箭头为 SVG 且绕中心旋转；压缩图标来自提供的 SVG；UI 断言 SVG 视框与旋转中心 |

## 真实环境额外验证

- **RA 工具调用**：真实 DeepSeek 模型调用 `ra_tree`/`ra_brief`，给出 T2 分叉提议；确认后 fork atSeq 16。
- **自动执行**：同一 RA 在 auto 模式下直接 route 到「西数硬盘颜色含义」，无确认；历史 `mode: auto`。
- **压缩**：导入真实 4 轮会话，`/compact` 成功，上下文 36,589 → 24,343。
- **计划/权限**：目标会话投影从 `plan.active=false / workspace-write` 变为 `true / read-only`，再回退成功。
- **停止/恢复**：父会话停止后子节点变根；恢复后 sidecar lineage 重新挂回。

## 未覆盖/环境限制

- 压缩成功依赖 DSH compaction 与 live idle agent；冷会话/运行中会明确拒绝。
- 计划模式/权限依赖目标 preset 是否挂载 `plan-mode`/`permission-presets`；缺失时返回错误；切换失败会尝试回滚。
- 模型目录依赖部署凭据；测试隔离 profile 中模型组可能为空，但设置写入/应用路径已单测。
- 0.2.2 普通 fork 不写 `parentSession`；跨版本已有 fork 的父子关系只能靠 `Fork of` 标题或当根。
- RA 原生 tool calling 取决于所选模型；不支持时模型可能把调用写成文本（这是模型行为，Host 不伪造）。
- 多 Host 同时写同一项目为 best-effort 文件锁；界面状态最终一致。
- 归档会话的恢复行为取决于 Host 列表；插件未专门处理归档。

## 自动化验证

```text
npm test        74 pass
npm run test:ui UI acceptance passed（含项目切换数据隔离、下拉字体一致、勾选恢复、窄屏缩放避让、打开会话导航与 Router preset 工具边界）
npm run check   build + test
```
