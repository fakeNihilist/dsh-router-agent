# 排障

## 侧栏没有 Router

1. 确认插件在 profile 中：
   ```bash
   dsh plugin --profile desktop why dsh-router-agent
   ```
2. `dsh --profile desktop --dump-config | grep -A5 dsh-router-agent` 应看到 Host 行和 `preset-router`。
3. 重启 Host；客户端改动刷新页面。桌面端只清 `Cache` / `Code Cache`，不要清整个用户目录。
4. 检查 Host 日志是否 `connection.fetch` 不可用；该部署下 `/api/router/*` 不会注册。

## 面板一直“正在读取项目”

- `GET /api/router/probe` 是否 401：说明 token/cookie 失效，重新打开带 token 的 URL。
- `blockers` 是否包含 `connection.fetch` / `sessionController.list`。
- 项目没有会话时 `selectedProject` 为 null，这是正常空态。

## 首次接入一直运行 / 中断

- `state.json.onboarding.status` 为 `running` 时，重启 Host 会从已完成的 brief 继续。
- 队列/写入失败会把状态置为 `failed`，面板显示失败条目和重试；`onboarding` op 也会重试（已完成的 brief 跳过）。
- 若 `summaryUseLlm` 打开但模型不可用，会走抽取式 fallback，不应阻塞。

## RA 说没有会话 / 工具返回 lossless JSON 错误

- 检查 RA preset 是否真的加载了 `router-tools`：
  开发配置下调用 `debugAgent`，工具应只有 4 个。
- 工具输出会经过 `JSON.parse(JSON.stringify(...))` 清洗；仍失败时看 Host 日志中的 `tools.register`/`router-tools` 激活错误。`tools.restrict` 失败会**阻止 preset 激活**，不会再静默暴露全局工具。
- 模型如果不支持原生 tool calling，可能把调用写成文本；换支持 tool calling 的 RA 模型。

## 确认时报 `target-changed`

这是保护：目标会话在提议后又有新事件。让 RA 重新判断即可；任务不会发送到变了的上下文。

## 压缩按钮提示不可用

- 冷会话：需要先在 DSH 中打开，产生 live Agent。
- 运行中：等 `turn/end` 后再点。
- 部署没有 `/compact` command 与 `ctx.compaction.compactNow` 时，压缩不可用；UI 会显示错误而不是假成功。

## 模型设置不可用

隔离 profile 没有可用模型凭据时，`modelCatalog` 为空，两个模型下拉会禁用并提示“没有可用的模型目录”。真实 desktop profile 登录/配置 API Key 后会出现模型组；未保存过选择时下拉会预选部署默认模型。

## 关系不对

- 0.2.2 普通 fork 不写 `parentSession`；插件用 `.dsh_RA/lineage` 记录自己创建的分叉。
- 已有 fork 依次尝试 `parentSession`、唯一的 `Fork of X` 标题、否则当根。不会伪造边。
- 停止父会话后子会话本来就是根；恢复父会话后重新出现边。

## 测试相关

- `npm run test:ui` 使用 `D:/tmp/dsh-ra-ui-home` 隔离 profile；不碰真实项目（路径已脱敏）。
- 如果 Edge/CDP 端口被占用，脚本会按端口清理测试进程；不要手动把测试 profile 指向真实 DSH_HOME。
- 截图在 `test/ui/shots`；深色参考在 `test/ui/shots-dark`。
