# Host API

浏览器端只调用认证的 `/api/router/*`。所有路由通过
`ctx.connection.fetch.register({ path, methods, requestBody: 'buffered', fetch })`
注册；Host/Origin 与浏览器认证由 Connection 负责。

## 读取

### `GET /api/router/state?project=<cwd>`

返回面板的唯一读模型。`project` 决定画布和未跟踪列表读取哪个项目；省略时选择最近活跃的项目。

```json
{
  "ok": true,
  "probe": { "...": "capability flags" },
  "blockers": [],
  "projects": [{ "project": "D:/code/example-project", "name": "example-project", "sessions": 22, "tracked": 18, "lastActiveAt": 1795 }],
  "selectedProject": { "project": "D:/code/example-project", "name": "example-project", "sessions": 22, "tracked": 18, "lastActiveAt": 1795 },
  "tree": {
    "project": "D:/code/example-project",
    "generatedAt": "2026-11-19T...",
    "sessions": [{
      "sessionId": "session-...",
      "title": "登录页表单校验",
      "parentSessionId": null,
      "lastActiveAt": 1795,
      "lastActiveLabel": "14:39",
      "turns": 2,
      "running": false,
      "live": false,
      "context": { "usedTokens": 62000, "limitTokens": 200000, "percent": 31, "source": "projection" },
      "boundaries": [{ "turn": 1, "atSeq": 9, "label": "登录页表单校验总是误报" }],
      "boundaryCount": 1,
      "plan": { "active": false, "pending": false },
      "permissions": "workspace-write",
      "pending": false,
      "titleSource": "native"
    }],
    "roots": ["session-..."],
    "edges": [{ "from": "session-parent", "to": "session-child" }],
    "trackedCount": 13,
    "untrackedCount": 3
  },
  "untracked": [{ "sessionId": "session-...", "title": "旧会话", "reason": "older", "lastActiveLabel": "11/8" }],
  "settings": {
    "layout": "vertical",
    "raModel": null,
    "indexModel": null,
    "defaultSessionModel": null,
    "autoAsk": "keep",
    "trackingDays": 7,
    "composer": { "mode": "standard", "permissions": "workspace-write", "auto": false }
  },
  "models": { "default": { "provider": "deepseek-official", "model": "deepseek-flash" }, "groups": [] },
  "onboarding": { "status": "complete", "total": 13, "done": 13, "current": null, "failed": [] },
  "ra": { "sessionId": "session-...", "running": false, "task": null },
  "pending": [],
  "history": []
}
```

- 树和未跟踪列表始终只读取 `selectedProject` 的 cwd；`state()` 传入的全局摘要会先按项目过滤，不会跨项目泄漏。切换 `project` 会重建这两部分。
- 根/兄弟顺序由客户端用 `lastActiveAt` 计算；`edges` 是 sidecar 解析后的父子关系。
- `context.source` 为 `projection`（`contextPressure`）、`fold`（`assistant/message.usage` + `request/context.contextWindow`）或 `unknown`。
- `lastActiveAt` 优先取日志末尾事件时间（不是最后一次用户提问时间）。
- `boundaries` 最多下发最近 100 条；`boundaryCount` 是完整边界数（分叉选择/校验仍可在服务端使用完整列表）。
- 树行**不包含** brief 的 `overview`，详情里也不渲染概览。
- `projects[].sessions` 是项目全部可跟踪会话数，`tracked` 是当前跟踪窗口内（或已固定）的数量；项目下拉同时显示两者。`tracked` 只从各项目 sidecar 的 `trackingDays/stopped/pinned` 计算，不会为了计数读取全部项目树。
- `onboarding.status` 为 `awaiting | running | complete | skipped | failed`。`awaiting` 表示等待用户确认索引；Host 不会自动调用模型。`skipped` 表示用户选择稍后，此时仍可路由。
- `ra.task` 是当前等待 RA 判断的任务（`task/composer/at`）；`running` 为 true 时可以取消。panel 不再拉取 RA 对话文本。
- 显式 `project` 不存在时返回空 `selectedProject`（只读空态）；写操作返回 `404 project-not-found`。

### `GET /api/router/probe`

`{ ok, probe, blockers }`。probe 是当前进程实际存在的能力，不缓存旧版本结果。

历史通过 `POST /api/router/api { op:'history' }` 读取。

## 写入

统一入口：

```http
POST /api/router/api
content-type: application/json

{ "op": "ask", "...": "payload" }
```

成功：`{ "ok": true, ... }`。失败：

```json
{ "ok": false, "error": { "code": "target-changed", "message": "目标会话在提议后又有新消息，请重新判断。", "details": { "expected": 19, "actual": 24 } } }
```

### `ask`

```json
{ "op": "ask", "project": "D:/code/example-project", "task": "补一个验证码刷新后的用例", "composer": { "mode": "plan", "permissions": "read-only", "auto": false } }
```

- 首次调用创建/恢复该项目的 Router 会话（`agentPreset: 'router'`）。
- 任务会包装成 `项目/用户任务/派发设置` 发给 RA；RA 自己调工具。
- 只有索引正在建立时返回 `409 onboarding-running`；`awaiting` / `skipped` 仍允许先路由，RA 先用标题、`ra_brief` 按需构建候选会话的索引。
- 自动模式的追问策略由 `settings.autoAsk` 决定：`keep`（默认，仍生成待回答的 `ask` 提议）、`suggest`（RA 必须给 `options`，Host 自动取第一个回答并继续判断）、`decide`（禁止 `ask`，要求直接 route/fork/new）。

### `manual`

```json
{ "op": "manual", "project": "...", "task": "手动发到父会话", "action": "route", "targetSessionId": "session-p", "atSeq": 16, "composer": { "mode": "standard", "permissions": "workspace-write" } }
```

用户选中画布节点后的手动派发兜底。`action` 只接受 `route | fork | new`；`fork` 省略 `atSeq` 时取目标最后一个 `turn/end`。只写一条 `manual: true`、`auto: false` 的 pending 提议，仍然必须 `confirm`，因此 token/项目/expiry/`lastSeq` 校验与 RA 提议完全相同；手动派发不会自动执行。

### `retry`

```json
{ "op": "retry", "project": "...", "token": "<uuid>", "note": "应该分叉，不要改父会话" }
```

把原提议标为 `abandoned`（历史结果 `revised`），把 `任务原文 + 设置 + 用户要求重新判断：...` 发回 RA。`note` 最长 500 字，可为空。prompt 发送失败会把提议恢复为 pending。只适用于 RA 生成的提议；`manual: true` 的提议返回 `400 manual-proposal`。

### `retarget`

```json
{ "op": "retarget", "project": "...", "token": "<uuid>", "sessionId": "session-c" }
```

只对 pending 的 `route | fork` 提议有效。重写目标标题、`targetLastSeq`、目标当前计划/权限；`fork` 会改用新目标的最后一个边界。仍需 `confirm`。

### `cancelTask`

```json
{ "op": "cancelTask", "project": "..." }
```

清除该项目的 active task；如果 RA 正在运行，调用 `agent.cancel({ kind: 'user' })` 中止当前轮并清空排队输入。返回 `{ ok, canceled, hadTask }`。

### `confirm`

```json
{ "op": "confirm", "project": "D:/code/example-project", "token": "<uuid>" }
```

校验 token、项目、expiry、目标 `lastSeq`，然后：

- 以 compare-and-set 把提议从 `pending` 认领为 `executing`；并发/重复确认只允许一个执行，其余返回 `409 proposal-executing` 或 `proposal-not-pending`。
- `route`：`sessionController.prompt({ mode:'queue', sessionId, content:[{type:'text',text:task}] }, signal)`
- `fork`：`sessionController.fork({ sessionId, atSeq, allowMigration:true })`，写 sidecar lineage，再 prompt 子会话
- `new`：`sessionController.create({ cwd })`，应用默认模型，再 prompt
- 目标 lastSeq 读不到时返回 `409 target-unreadable`，不会盲发。
- fork/new 已创建会话后失败：提议标为 `failed` 并记录 `resultSessionId`，不会在重试时创建第二个子会话；route 在 prompt 前失败会退回 `pending` 供重试。

返回：

```json
{ "ok": true, "result": { "result": "forked", "targetSessionId": "session-parent", "sessionId": "session-child", "atSeq": 16, "turn": 2, "dispatch": { "plan": { "before": false, "after": false }, "permissions": { "before": "workspace-write", "after": "workspace-write" } } } }
```

目标在提议后变化：`409 target-changed`，不会发送。

### `choose`

```json
{ "op": "choose", "project": "...", "token": "<uuid>", "atSeq": 12 }
```

只对 `fork` 提议有效；必须是目标会话已完成的 `turn/end` seq。更新后仍需 `confirm`。与确认一样用 compare-and-set，提议已进入执行时返回 `409 proposal-not-pending`。

### `abandon`

```json
{ "op": "abandon", "project": "...", "token": "<uuid>" }
```

标记为 `abandoned`，写一条 `未执行` 历史。

### `answer`

```json
{ "op": "answer", "project": "...", "token": "<uuid>", "answer": "继续" }
```

只对 `ask` 提议有效；把 `任务原文 + 设置 + 用户回答：...` 发回 RA，提议标记 `answered`，不直接派发。回答会认领 `executing`，避免重复回答；RA 的下一个 `ra_propose` 以最新用户消息里的任务信封为准，因此回答旧追问不会误用新任务。

### `detail`

```json
{ "op": "detail", "project": "...", "sessionId": "session-..." }
```

返回 `session`（同树行）、`brief`（overview/topics/decisions/files）和 `boundaries`。UI 只渲染名称、meta、分叉点、上下文、压缩、停止；**不渲染 brief.overview**。

### `compress`

```json
{ "op": "compress", "project": "...", "sessionId": "session-..." }
```

- 只允许跟踪中的会话。
- 需要 live idle Agent；无 live → `409 session-not-live`；running → `409 session-busy`。
- 优先 `ctx.compaction.compactNow(agent, signal)`，否则 `commands.execute(agent, '/compact', [], signal)`。
- 返回新的 `context`；失败 `409 compact-failed`，不伪造成功。

### `stop` / `restore`

```json
{ "op": "stop", "project": "...", "sessionId": "session-..." }
{ "op": "restore", "project": "...", "sessionId": "session-..." }
```

`stop` 只写 `state.stopped[id]`；不删除会话。父会话停止后，跟踪中的子会话在树里自然成为根。
`restore` 删除 stopped 并写 `state.pinned[id] = true`，因此更早的会话恢复后也会重新跟踪。

### `settings`

```json
{
  "op": "settings",
  "project": "...",
  "settings": {
    "layout": "horizontal",
    "raModel": { "provider": "deepseek-official", "model": "deepseek-flash" },
    "indexModel": { "provider": "deepseek-official", "model": "deepseek-chat" },
    "defaultSessionModel": { "provider": "deepseek-official", "model": "deepseek-chat" },
    "autoAsk": "keep",
    "trackingDays": 14
  }
}
```

布局只接受 `vertical | horizontal`；模型只接受 `{provider, model, reasoningEffort?}`；`autoAsk` 只接受 `keep | suggest | decide`；`trackingDays` 接受 1–365 的整数。字段缺省表示“保持不变”，显式 `null` 表示清空并跟随部署默认；只改 `raModel` 不会重置 `layout`。`raModel` 只作用于 Router 对话；`indexModel` 只作用于 brief 构建/刷新（为空时跟随模型目录默认）。保存 `raModel` 后如果 RA 会话 live，立即 `agent.model.select`；清空时尝试选择模型目录默认。保存 `trackingDays` 会同步旧的 `state.tracking.days` 并清空项目列表缓存。

### `rename`

```json
{ "op": "rename", "project": "...", "sessionId": "session-...", "title": "新的名称" }
```

先写 sidecar `titles[id]`，再尽力 `sessionController.rename`。侧车标题优先展示；不会覆盖用户自己的原生标题。

### `untracked` / `history` / `onboarding` / `refresh`

```json
{ "op": "untracked", "project": "..." }
{ "op": "history", "project": "...", "limit": 50 }
{ "op": "onboarding", "project": "...", "action": "start|skip|retry" }
{ "op": "refresh", "project": "..." }
```

- `untracked`：`{ ok, items }`，reason 为 `stopped | older`。
- `history`：`{ ok, items }`，最新在前。
- `onboarding`：`start` 启动或续跑首次索引（已完成的 brief 会跳过）；`skip` 写 `status: skipped`，仍允许路由；`retry` 重新启动 dirty/failed 项。`reset` 仅在 `config.dev` 下可用，把状态置回 `awaiting` 供验收测试使用。
- `refresh`：返回完整 state。

## 数据 schema

### state.json

```json
{
  "version": 1,
  "project": "D:/code/example-project",
  "createdAt": "...",
  "updatedAt": "...",
  "raSessionId": "session-...",
  "tracking": { "days": 7 },
  "stopped": { "session-x": { "at": "...", "reason": "manual" } },
  "pinned": { "session-old": true },
  "lineage": { "session-child": "session-parent" },
  "titles": { "session-x": { "title": "...", "source": "manual", "updatedAt": "..." } },
  "settings": {
    "layout": "vertical",
    "raModel": null,
    "indexModel": null,
    "defaultSessionModel": null,
    "autoAsk": "keep",
    "trackingDays": 7,
    "composer": { "mode": "standard", "permissions": "workspace-write", "auto": false }
  },
  "onboarding": { "status": "awaiting|running|complete|skipped|failed", "total": 13, "done": 13, "current": null, "failed": [] },
  "summary": { "session-x": { "status": "ready|fallback|pending", "summarizedThroughSeq": 19, "title": "...", "lastActiveAt": 1795 } }
}
```

`tracking.days` 是旧字段，仍与新 `settings.trackingDays` 同步写入；读取以 `settings.trackingDays` 为准。`lastSeen` 已移除。

### brief

```json
{
  "sessionId": "session-...",
  "title": "登录页表单校验",
  "titleSource": "native|sidecar|manual|generated",
  "nativeTitle": "登录页表单校验",
  "overview": "任务：...；后续：...；最近进展：...",
  "topics": ["form.ts"],
  "decisions": ["已补充用例。"],
  "files": ["src/login/form.ts"],
  "turns": 2,
  "lastActiveAt": 1795,
  "boundaries": [{ "turn": 1, "atSeq": 9, "messageId": "u-1", "label": "登录页校验误报" }],
  "manual": { "title": null, "overview": null },
  "summarizedThroughSeq": 19,
  "summaryStatus": "ready|fallback",
  "updatedAt": "..."
}
```

`atSeq`/`messageId` 永远来自真实 `turn/end`/`user/message` 事件，不接受模型输出里的值。

### proposal

```json
{
  "token": "uuid",
  "project": "D:/code/example-project",
  "action": "route|fork|new|ask",
  "task": "用户任务原文",
  "targetSessionId": "session-...",
  "targetTitle": "登录页：验证码刷新",
  "targetLastSeq": 19,
  "targetPlan": false,
  "targetPermissions": "workspace-write",
  "atSeq": 16,
  "turn": 2,
  "title": null,
  "question": null,
  "options": [],
  "reason": "为什么这样选",
  "composer": { "mode": "standard", "permissions": "workspace-write", "auto": false },
  "auto": false,
  "manual": false,
  "answer": null,
  "status": "pending|executing|confirmed|auto|abandoned|answered|expired|target-changed|failed",
  "claimedAt": 1795,
  "resultSessionId": "session-...",
  "createdAt": 1795,
  "expiresAt": 1795,
  "raSessionId": "session-..."
}
```

`status=executing` 是确认/自动执行的认领态，只有持锁的调用会推进；15 分钟仍为 executing 会被视为中断失败。fork/new 失败时 `resultSessionId` 记录已创建的会话，避免重试重复创建。`manual: true` 表示由画布手动派发；`answer` 记录追问/自动建议项的回答。

### dispatch.jsonl

```json
{
  "id": "uuid",
  "at": "2026-11-19T...",
  "task": "...（已脱敏）",
  "action": "route|fork|new|ask",
  "targetSessionId": "session-...",
  "targetTitle": "...",
  "atSeq": 16,
  "turn": 2,
  "reason": "...（已脱敏）",
  "result": "sent|created|forked|auto|abandoned|revised|asked|failed",
  "mode": "confirm|auto|manual",
  "composer": { "...": "..." },
  "error": null
}
```

文件只保留最近 `maxHistory`（默认 100）条；读取走有界尾部。`task`/`reason` 会按 `sk-…`、`Bearer …`、key-value 模式脱敏。

## RA 工具

工具定义在 `src/router-tools.js`，preset `router` 挂 native executor + 该插件；继承的全局工具用 deny 列表隐藏，`tools/change` 时增量刷新，`tools.guard` 只允许四个 `ra_*` 工具执行。

### `ra_tree`

参数：`{ includeStopped?: boolean }`。返回项目、跟踪会话（id/title/lastActive/turns/running/contextPercent/boundaries/boundaryCount）；`includeStopped` 只额外返回 `stoppedCount`，停止的会话不可路由，需先在 UI 恢复。每个会话最多返回最近 30 个边界，`boundaryCount` 是完整数量。

### `ra_brief`

参数：`{ sessionId }`。返回内部 brief、上下文、计划/权限、分叉边界（最多 200 条 + `boundaryCount`）。

### `ra_history`

参数：`{ limit?: number }`（1–50，默认 12）。返回最近派发记录。

### `ra_propose`

参数：

```json
{
  "action": "route|fork|new|ask",
  "task": "route/fork/new 必填",
  "targetSessionId": "route/fork 必填",
  "atSeq": "fork 可选；省略取最后一个边界",
  "title": "new/fork 可选",
  "question": "ask 必填",
  "options": ["ask 可选"],
  "reason": "必填，一句话"
}
```

返回 `{ token, action, summary, confirmRequired, executed? }`。自动模式下 `executed: true`，否则等待用户确认。`task` 以 Host 写在 RA 最新用户消息里的任务信封为准（回答了旧追问也保持旧任务），模型参数里的 `task` 只在没有信封时兜底；`composer` 同源。

## 错误码

| HTTP | code | 含义 |
|---|---|---|
| 400 | `bad-request` / `bad-json` / `unknown-op` / `bad-project` / `bad-token` | 请求格式错误 |
| 400 | `empty-task` / `bad-boundary` / `not-a-fork` / `not-an-ask` / `not-retargetable` / `empty-answer` | 业务参数错误 |
| 404 | `project-not-found` / `session-not-tracked` / `proposal-not-found` | 目标不存在 |
| 409 | `onboarding-running` | 首次索引正在建立（稍后可路由） |
| 409 | `proposal-not-pending` / `proposal-executing` / `proposal-expired` | 提议已处理/执行中/过期 |
| 409 | `target-changed` / `target-unreadable` | 目标 lastSeq 变了 / 读不到目标进度 |
| 409 | `ra-busy` / `ra-unavailable` | RA 会话被占用/暂时不可用 |
| 409 | `session-not-live` / `session-busy` | 压缩需要 live idle Agent |
| 409 | `plan-unavailable` / `permission-unavailable` | 目标会话不支持该设置（已回滚） |
| 409 | `compact-failed` | DSH 压缩失败（原文返回） |
| 500 | `internal` | 未预期错误 |
