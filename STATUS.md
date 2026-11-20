# 实现状态

更新时间：2026-11-20

| 里程碑 | 状态 | 证据 |
|---|---|---|
| M0 能力探测 + 空壳 | ✅ | 真实 DSH Web 面板可见；16 会话枚举；RA preset 创建；probe 全绿 |
| M1 项目数据 + 画布只读 | ✅ | ProjectStore/SessionReader/lineage/brief/tree/context；13 tracked/3 untracked |
| M2 RA 会话 + 继续 | ✅ | 真实 RA 调 4 工具；route 提议确认；目标收到 prompt |
| M3 分叉 + 新建 | ✅ | atSeq 16 fork；sidecar lineage；子节点挂父下；新建首条=任务 |
| M4 模式/权限 + 自动 | ✅ | 真实 `/plan`/permission set；真实 auto route；auto ask 拒绝 |
| M5 停止/恢复 + 压缩 | ✅ | 父停子根/恢复回挂；真实 import 会话 36.6k→24.3k |
| M6 增量/旁路/标题/历史 | ✅ | turn/end 事件按日志 revision 刷新；brief 续跑；sidecar 标题；history |
| M7 真实集成 + UI 打磨 | ✅ | 真实 DSH 0.2.2 Web；light/dark；窄屏；打开会话导航；截图 |
| M8 验收 + 文档 | ✅ | `npm test` 73、`npm run test:ui`、API/ACCEPTANCE/README |
| M9 审查修复 | ✅ | 缓存新鲜度、幂等派发、fail-closed、工具白名单、跨进程锁、脱敏、性能清理 |

## 测试

```text
npm test        73 pass
npm run test:ui UI acceptance passed
npm run check   build + test
```

## 当前限制

见 `README.md` 的“已知限制”和 `docs/ACCEPTANCE.md` 的“未覆盖/环境限制”。
