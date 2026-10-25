---
name: ai-frontend-quality
description: 在开发、审查或修复 React/Vue/AI Agent 客户端、工作台、聊天界面时使用。重点处理 UI/UX 组件选型（Tooltip/Toast/Snackbar/Dialog/Drawer/Sheet）、视觉质感、文字溢出、布局跳动、滚动条挤压、响应式缩放、React 重新渲染/重挂载、局部 Loading、SSE 生成中切换对话不中断、任务/服务器/UI 状态隔离、可访问性与前端验收。需求不明确时先判定是否需向用户确认，禁止凭个人偏好擅自修改重要交互。
metadata:
  version: '1.2.0'
  origin: '用户提供的四段 Ludi UI 视频、开源 desktop-agent-ui 与后续工程讨论'
---
# AI Frontend Quality — 设计选择、稳定性与异步 UX

## 定位

面向具有真实用户与动态内容的 Web/AI 客户端。**先判断需求和根因，再选组件/改代码；不是不分场景地给 UI 加动效或盲目搬运参考代码。** 以项目既有框架、设计系统、无障碍和业务约束为优先。

触发：前端功能设计、视觉优化、组件/弹窗选择、UI 审查；页面错位、文字撑破布局、滚动条挤动、响应式/缩放问题；切换页面后状态丢失、全屏 Loading、AI SSE 流断开、无谓 Refetch 或渲染闪烁。

不触发：纯后端重构、与 UI 无关的服务端算法或纯静态文案润色（除非用户明确请求前端体验优化）。

## 执行顺序（必须按问题相关性执行）

1. **理解任务和界面**：读项目的 README、组件、路由、状态/请求、CSS tokens、交互组件库、现有测试；记录框架及依赖。没有代码则输出设计建议与*明确标注的示意实现*，不得装作已经改好。
2. **需求门槛：判断是否必须问用户**：在选择对话框/抽屉/撤销、移动端交互、任务跨页面继续运行、信息布局变化等方案前，确认用户目标、风险、是否可撤销、内容量、所需上下文、目标设备、已有规范。
   - **会产生明显不同交互或影响数据安全，而现有信息无法推断时**：先用最多 1–3 个具体的、可回答的问题征询用户；给出可选方案和权衡，不用“你喜欢哪种”这种空问法。
   - **需求已经明确或改动低风险可逆时**：不要机械地询问；陈述假设并直接开展最小可行修改。
   - 用户明确授权自行决策时依风险、已有设计系统与一致性选择，并说明理由；不能默许高风险操作。
   - 参考 [requirements-and-component-choice.md](references/requirements-and-component-choice.md)。
3. **诊断与分类**：先确认是布局、滚动、响应式、视觉、路由 Reload、Remount、Re-render、Refetch、主线程阻塞，还是全局状态/任务生命周期问题；用证据排除猜测。参考 [render-and-state-diagnostics.md](references/render-and-state-diagnostics.md)、[layout-and-responsive.md](references/layout-and-responsive.md)。
4. **选复杂度档位**：
   - S：组件内部状态、局部 Loading、基础响应式；适合简单页面。
   - M：路由外任务管理器、TanStack Query/现有缓存、并发互不阻塞、避免组件卸载取消流；适合多对话 SPA。
   - L：服务端持久任务 ID、事件序列/重放、任务恢复/worker、幂等及并发版本控制；适合长耗时 AI Agent、多端/断线恢复。
   - 绝不把 L 档作为所有按钮 Loading 的默认解决方案。参考 [async-nonblocking-ux.md](references/async-nonblocking-ux.md)。
5. **小步实施**：复用现有组件，优先修正错误边界与状态归属，严禁以 `overflow:hidden`、缩小所有文字、统一 `pointer-events:none` 掩盖问题；重要视觉改动提供前后对照。
6. **验证**：覆盖长文本、增删编辑、侧栏收起/展开、滚动条、不同容器宽度与浏览器缩放、键盘/焦点、流式生成期间切对话、后台完成回填、错误/取消/重试。用对应性能/网络工具验证根因；参考 [verification-matrix.md](references/verification-matrix.md)。
7. **汇报**：说明「观察与证据 → 根因 → 选择方案及被放弃方案 → 具体文件 → 验证结果 → 剩余风险」。未运行的测试必须说未运行。

## 不可违反的原则

- **局部忙 ≠ 全局不可操作**。Loading/Disabled 的作用域必须与真实依赖冲突一致；只能阻断受影响区域。不随手禁用导航、对话切换、无关编辑。
- **界面生命周期 ≠ AI 任务生命周期**。对话组件卸载不得意外取消业务任务；区分停止订阅（disconnect）、取消模型生成（cancel task）、删除对话（delete data）。真正跨刷新/多端持续执行需要服务端可靠任务管理，前端 Store 不能独立保证。
- **Re-render ≠ Remount ≠ Reload ≠ Refetch**。先定位再优化；不要默认 `React.memo` 或强制刷新是解决方案。
- **数据的稳定身份**：列表以业务 ID 为 `key`；UI State、Server State、Task State 分离；避免旧请求覆盖新任务/新页面。
- **输入法与滚动稳定**：组合输入阶段 Enter 不可误发；用户主动查看历史时流式输出不得抢回滚动位置；分屏折叠必须可以恢复。
- **布局稳定**：长文不撑宽；容器有可收缩边界；传统滚动条出现时预留布局空间；高度增长可以合理滚动但不意外移动无关面板。
- **标题层级保持克制**：避免 eyebrow、标题、副标题与辅助说明层层堆叠；只有当副标题补充了标题未表达的信息时才保留，避免重复释义或为填充版面硬加文案。详见 [visual-polish.md](references/visual-polish.md)。
- **响应式并非浏览器 50% 缩放**：针对窗口与组件实际可用宽度设计降级（常驻侧栏→抽屉、两列→单列），不得无限压缩字体。
- **交互语义优先于风格**：先看是否风险/撤销/输入草稿/内容长度，再选 Tooltip、Toast、Snackbar、Popconfirm、Modal、AlertDialog、Drawer、Bottom Sheet、Action Sheet。
- **避免盲从视频参数**：surface 明度差、流式淡入 120ms、字重、动效曲线等均为参考起点，不是硬性标准；优先可读性、性能和 `prefers-reduced-motion`。
- **不引入不必要依赖或大规模架构重写**；如确需新库/持久任务基础设施，说明引入理由与迁移成本。

## 扩展：新视频与 desktop-agent-ui（按需启用）

新视频中的 IME 防误发、流式历史阅读跟随、减少边框、同心圆角、可恢复分屏、长文件名后缀保留，见 [desktop-chat-microinteractions.md](references/desktop-chat-microinteractions.md)。

Electron/Tauri 原生窗口、阴影裁切、可拖拽分栏完整状态机，以及可选多窗口同步，见 [desktop-resizable-and-shell.md](references/desktop-resizable-and-shell.md)。

**复用前先核验作者技术主张**：500ms 拦截窗口、CSS 零 CPU、clip-audit `cut===0` 等都不可视为放之四海皆准的保证。详见 [ludi-review-and-safety-notes.md](references/ludi-review-and-safety-notes.md)。优先复用项目现成的 Resizable、ScrollArea、Dialog 等组件；不要为本扩展强加 Electron、Tauri 或新组件库。

## 按任务加载 references

| 需要解决的问题 | 仅读取必要文件 |
|---|---|
| 需求含糊、选弹出组件、确认/撤销/表单误关 | [requirements-and-component-choice.md](references/requirements-and-component-choice.md) + [examples/undo-snackbar.tsx](examples/undo-snackbar.tsx) |
| 视觉层级、标题/副标题密度、暗色字重、流式淡入、数字、动效 | [visual-polish.md](references/visual-polish.md) |
| 文本撑宽、滚动条挤压、四象限、侧栏、缩放 | [layout-and-responsive.md](references/layout-and-responsive.md) + [examples/workspace-layout.css](examples/workspace-layout.css) |
| Reload / Remount / Re-render / Refetch、闪烁和丢状态 | [render-and-state-diagnostics.md](references/render-and-state-diagnostics.md) + [examples/react-stability.tsx](examples/react-stability.tsx) |
| 生成期间能切换、后台任务不断、断线恢复、竞争条件 | [async-nonblocking-ux.md](references/async-nonblocking-ux.md) + [examples/task-manager.ts](examples/task-manager.ts) + [examples/task-ui.tsx](examples/task-ui.tsx) |
| FastAPI / SSE 任务持久化/协议 | [backend-sse-contract.md](references/backend-sse-contract.md) |
| 测试与验收 | [verification-matrix.md](references/verification-matrix.md) + [examples/playwright-stability.spec.ts](examples/playwright-stability.spec.ts) |
| 新视频：中文选词、回底策略、边框与圆角、长文件名 | [desktop-chat-microinteractions.md](references/desktop-chat-microinteractions.md) + 对应 examples |
| 分屏可恢复拖拽、透明桌面窗阴影、跨窗口同步 | [desktop-resizable-and-shell.md](references/desktop-resizable-and-shell.md) + [examples/resizable-workspace.tsx](examples/resizable-workspace.tsx) |
| 作者源码审查与实现边界 | [ludi-review-and-safety-notes.md](references/ludi-review-and-safety-notes.md) |
| 外部权威资料、视频来源及界限 | [sources.md](references/sources.md) |

## 输出模板

- **场景/确认**：已知需求；必要的 1–3 个待确认问题（若无则无需询问）。
- **现象与根因**：证据及置信度；先解释“为什么”。
- **方案**：组件/布局/缓存/任务模式，为什么适合；局部优先，复杂度 S/M/L。
- **实施**：逐文件说明 + 有意义的差异。
- **验收**：实测环境、通过与未测案例、可回退方案。

## 最小禁忌清单

禁止为了“防重入”锁整页；禁止用动态 `key={Date.now()}` 强制刷新；禁止把 `queryClient.invalidateQueries()` 无筛选地用于每个保存操作；禁止把“断开 SSE 客户端”误认为“后台任务已取消”；禁止把加载骨架屏替换所有可用旧内容；禁止 `overflow:hidden` 一刀切遮掉内容；禁止在页面宽度不足时直接把全站字号缩到不可读。
