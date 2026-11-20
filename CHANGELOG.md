# Changelog

## 未发布

界面与设置修正。

- **设置**：移除 RA 模型/新会话默认模型里的“跟随部署默认”选项；未保存过选择时预选部署默认模型，下拉直接列出部署模型。
- **未跟踪会话**：去掉顶部提示语；只有列表区域滚动，底部操作区固定；弹窗最大高度限制为 `min(560px, 100% - 40px)`，长列表不再撑满面板；“恢复所选”按钮不再拼接勾选数量。
- **输入区**：输入框加高（3 行，最小 88px）；恢复 switch 旁的“自动执行”文字；tooltip 改为面板内自绘气泡（悬停/聚焦显示，不再用系统 title）。
- **控件**：下拉箭头改为 SVG chevron，展开时绕自身中心旋转 180°；节点与详情的压缩图标改用提供的 `压缩.svg`（1024×1024 填充图形）。
- **会话详情**：移除“分叉点”区块；分叉点只在提议卡上调整。节点时间/上下文行改为底部对齐，利用为两行标题预留的高度。
- **项目切换**：项目下拉恢复为全部项目；切换项目后按该项目重建画布与未跟踪列表并重新适配视图。顺带修复 `state()` 把全局摘要直接传给 `collect()` 导致树/未跟踪跨项目泄漏的问题；新增 Host 回归测试。
- **下拉框**：用自绘 listbox 替换原生 `<select>`，闭合态与展开态共用字号/主题 token；支持分组、勾选态、键盘导航、点击外部关闭、对话框内浮层不被滚动容器裁切。项目/模式/权限/分叉点/设置项全部切换。
- **字号**：整体上调一档（节点标题 13.5、正文/下拉 13、辅助 11.5–12），原生弹层在 Windows 上放大字体的问题随之消失。
- **输入区标签**：去掉底部“默认需要确认…”提示行和发送按钮左侧的“标准 · 工作区”标签；switch 保留“自动执行”文字。
- **未跟踪会话**：每行改为复选框（勾选即同意恢复），底部显示“已勾选 n / 总数”与“恢复所选”；未勾选时按钮禁用，可全选/取消全选后批量恢复。
- **窄窗口**：实测输入区（含提议卡）高度并写入 `--dra-composer-top`；容器宽度不足 1100px 时缩放控件移到输入区上方，不再被遮挡；适应画布的底部预留也改用实测值。
- **测试**：74 项单元/Host；UI 验收新增下拉字体一致、弹层不裁切、勾选恢复、项目切换数据隔离、缩放控件无重叠断言。

## 0.1.1 — 2026-11-20

审查修复版。

- **新鲜度**：`SessionReader` 的 live 会话按日志 revision 缓存，修复“turn 进行中轮询后，turn/end 仍读旧快照”导致 brief/边界不刷新、route 反复 `409 target-changed` 的问题；补回归测试。
- **导航**：`uiWorkspace.openSession` 懒解析并改传 `SessionId` 字符串（原来传 `{ sessionId }`，`resolveTarget` 取到 undefined，点击“打开会话”无反应）；UI 验收新增该路径。
- **工具边界**：RA preset 对继承的全局工具建 deny 名单，并在 `tools/change` 时增量刷新（覆盖 MCP 等动态注册工具）；`tools.guard` 只允许四个 `ra_*` 工具作为执行兜底；preset 显式挂 native executor，PTC 部署也不会暴露 `run_code`。
- **派发幂等**：proposal 增加 `executing` 认领与 compare-and-set；并发 confirm/answer 只执行一次；fork/new 产生会话后失败会标记 failed 并保留 `resultSessionId`，不再重试产生重复子会话。
- **校验 fail-closed**：目标 `lastSeq` 读不到时拒绝执行，不再跳过目标变化校验。
- **任务归属**：answer 的回复信封携带原任务与设置；`ra_propose` 以 RA 最新用户消息里的信封为准；手动对话则优先使用工具参数，修复“回答旧追问却派发新任务”。
- **设置**：模型可显式清空（跟随部署默认），局部设置不再重置布局；RA 会话 busy/writer-held 时不再重建并孤立原对话。
- **设置/投影**：修正 `summary.projections.values.*` 层级；`ra_tree` 的 `includeStopped` 明确为计数；计划/权限切换失败会回滚。
- **性能与清理**：state 轮询只列一次会话、批量写 summary、索引进度节流；dispatch 历史尾部读取并裁剪到 `maxHistory`；过期 proposal/brief/state 行定期清理；边界列表按上限下发（树 100、ra_tree 30、ra_brief 200，附 `boundaryCount`）。
- **可靠性**：跨进程 sidecar 文件锁 + 写入前重读合并；损坏 state 归档为 `state.json.corrupt-*`；`ensure()` 失败可重试；brief 路径校验；写操作校验项目路径；probe 每次 state 刷新；`connection` 通过 `ctx.inject` 等待挂载。
- **隐私**：brief、dispatch 历史按 `sk-…` / `Bearer …` / key-value 模式脱敏；`.dsh_RA/.gitignore` 改为只含 `*`，不再出现在 `git status`。
- **测试**：73 项单元/Host 集成；UI 验收新增“打开会话”导航与真实 Router preset 工具边界断言。
- **兼容性**：`engines.dsh` 改为 `>=0.2.2-0 <0.3.0-0`，允许 0.2.2 预发布版并拒绝缺少 `tools.guard` 的旧版本。

## 0.1.0 — 2026-11-19

首个可运行版本。

- Host 插件 + `router` Agent preset（4 个只读/提议工具）。
- 项目级 `.dsh_RA` sidecar：跟踪、brief、提议、派发历史、设置、probe。
- 真实 DSH 0.2.2 适配：`connection.fetch` 认证 `/api/router/*`、`atSeq` fork、session projections、会话级 plan/permission、`/compact`。
- 画布：纵向/横向、无限平移缩放、适应/最近、搜索定位、节点上下文/压缩。
- 提议：继续/分叉/新建/追问；token + lastSeq + 项目 + 过期校验；目标变化 409。
- 自动执行：显式开关；auto 下禁止 ask；历史留痕。
- 停止/恢复父会话语义；未跟踪列表；首次接入进度与断点续跑。
- 深浅色 token、窄屏容器查询。
- 测试：40 项单元/Host + 真实 DSH Web/Edge UI 验收。
- 文档：README / API / ACCEPTANCE / TROUBLESHOOTING。
