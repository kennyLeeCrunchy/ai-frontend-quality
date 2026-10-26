# 来源、权威文档及适用界限

## 用户提供的视频（设计观点）

1. Ludi《扒了大厂 AI 客户端源码，质感全靠这 5 招！》：surface 细微层次、暗色字体字重、流式文字淡入、数字/图标光学对齐、动作反馈。
2. Ludi《弹窗家族》（2:44 录屏）：Bottom Sheet、Action Sheet、Snackbar、Alert Dialog 与移动端设计。
3. Ludi《别再把弹出来的东西都叫弹窗了》（1:57 录屏）：Tooltip、Toast、Modal、Popconfirm、Drawer；避免草稿误关、可撤销优于无意义确认、危险按钮使用明确动词。

视频内容已经由用户提供的文件和上一轮总结整理；**本 Skill 不声称这些视频包含后端 taskId 设计、TanStack Query、SSE 断线恢复等工程实现**。后者是对后续讨论的补充方案。

## 权威技术资料（可在线查阅）

- Agent Skills 格式： https://agentskills.io/specification
- React 状态保留/重置： https://react.dev/learn/preserving-and-resetting-state
- React 性能与 effect： https://react.dev/reference/react/useEffect
- React useSyncExternalStore： https://react.dev/reference/react/useSyncExternalStore
- TanStack Query 乐观更新： https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- MDN Scrollbar Gutter： https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter
- MDN 容器查询： https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
- MDN Server-Sent Events： https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
- MDN Web 性能/CLS： https://web.dev/articles/cls
- WAI-ARIA APG Dialog： https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Apple Human Interface Guidelines — Loading： https://developer.apple.com/design/human-interface-guidelines/loading
- Apple Human Interface Guidelines — Motion： https://developer.apple.com/design/human-interface-guidelines/motion

## 适配提示

- 样例主要基于 React + TypeScript + FastAPI，Vue/Svelte/小程序应遵循同一**行为契约**而非照搬 API。
- 部分复杂参考是架构示例而非可运行的完整服务；完整生产部署还需要 DB、鉴权、队列、重试、日志、监控和测试。
- 代码中出现的 token、响应式断点和 UI 文字只是起点，应由真实设计系统、内容密度和目标设备验证。

## 2026-10-23 增补：Ludi Desktop Agent UI

- 原作者仓库： https://github.com/Ludi-Herry/desktop-agent-ui
- 作者 Skill： https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/SKILL.md
- 工程 pitfalls： https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/references/desktop-pitfalls.md
- Agent interaction： https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/references/agent-interaction.md
- Motion & components： https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/references/components-motion.md
- MIT 许可： https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/LICENSE

本 Skill 从新视频及仓库吸收问题意识，examples 为独立实现，保留了对性能/IME/裁切零误差等主张的适用边界检查；不直接重分发作者脚本。参考 `ludi-review-and-safety-notes.md`。
