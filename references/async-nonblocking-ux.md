# Async UX & Non-blocking UI：AI 工作台任务并发

## 总原则

`busy(task-123)` 不应该转换为 `disabled(App)`。按**操作是否共享资源、有无真实依赖/冲突**决定禁用范围。

| 操作 | AI 生成时允许？ | 备注 |
|---|---|---|
| 切对话、打开另一工作区、编辑无关卡片 | 是 | 默认保持响应 |
| 阅读历史、复制、搜索 | 是 | 除非有明确业务冲突 |
| 当前任务的停止按钮 | 是 | 要真的取消/请求取消后端任务 |
| 同一对话再次发送 | 产品决定 | 排队、拒绝、并发分支、停止后发送等 |
| 修改当前任务读取的数据 | 产品决定 | 快照语义、版本控制、重启任务或阻止冲突更新 |
| 永久删除正在运行任务所需数据 | 保护 | 明确后果，可能要取消任务并等待一致性处理 |

## Task State / UI State / Server State

- UI State：当前选中对话、Drawer 开关、草稿、滚动位置。
- Server State：消息历史、卡片列表、工作区结构（建议有缓存和精确 query key）。
- Task State：`taskId`、`conversationId`、`status`、增量结果、错误/取消/完成、连接状态、事件 cursor。

不要把 3 类数据放在同一个大而全 AppState，尤其不要用一个全局 `isLoading` 驱动所有面板的 disabled。

## 分三个可靠性档位

**S（单页面简单任务）**：按钮内部 pending、局部更新、显示旧数据。页面离开时可以按业务规则取消；不能承诺离开后继续。

**M（多对话 SPA）**：在不会随 ChatRoute 卸载的层级创建 TaskManager，按 `taskId`/`conversationId` 维护多个任务。路由切换只更新当前视图，不调用 `AbortController.abort()` / `EventSource.close()`，除非这个连接明确是临时订阅且后台任务仍会继续。例：[examples/task-manager.ts](../examples/task-manager.ts)。

**L（真正后台持久）**：`POST /tasks` 创建服务端任务，返回稳定 `taskId`；worker 持续处理；事件/消息持久化；支持状态查询、断线重连与幂等取消，前端通过 taskId 订阅。浏览器关闭或后端重启仍可能继续执行（取决于任务队列/worker 的持久性）。例见 [backend-sse-contract.md](backend-sse-contract.md)。

**关键澄清**：把 EventSource 挪到全局 JS Store，只保证同一个 Tab 的 SPA 路由切换不销毁它；Tab 关闭、刷新、网络重连、浏览器冻结、服务端部署等需要 L 档保证。SSE 连接的断开 ≠ 服务端任务取消，服务端不能把流订阅的 disconnect 作为无条件停止生成的信号。

## 建议状态机

```text
created → queued → running/streaming → succeeded
                       ├→ failed
                       └→ cancel_requested → cancelled
```

可增加 reconnecting、retryable_failed（这是连接/投递状态，不要与任务业务结果混淆）。所有事件必须指向唯一 `taskId`，最好有单调递增 `sequence`。消费方须去重，并防止迟来的旧事件覆盖新状态。

## SSE：事件订阅 vs 生成任务

```text
[用户创建生成] POST /tasks {conversationId, input, idempotencyKey}
                           └→ 202 {taskId}
[任意页面/侧栏] GET /tasks/:taskId/events?after=cursor  → EventSource
[用户切换聊天]   UI route changes（前端 TaskManager 仍可订阅）
[关闭浏览器]     SSE connection closes，服务器任务仍按业务策略执行
[重新进入]       GET /tasks?conversationId=...，获取 taskId/status
                   GET /tasks/:taskId/events?after=cursor，补播必要事件
[用户明确停止]   POST /tasks/:taskId/cancel
```

- `EventSource` 自带断线自动重连，同一个连接会根据服务端 `id` 发送 `Last-Event-ID`。新创建 EventSource 的 cursor 恢复需要显式 URL/服务端支持，不能假设自动恢复本地丢失的数据。
- `onerror` 往往只意味着连接断开/正在重连，不能立即把任务标记为 failed；可以先 GET status。
- 流中只推增量文本不够完成恢复：要能查询**权威的消息快照/最终产物**，因为网络重试可能重复或遗漏事件。
- SSE 单向服务端→客户端，发消息/取消用 REST；如需双向实时协议可另选 WebSocket，不改变任务生命周期原则。
- 防止重复任务：创建请求使用幂等键；重复取消应允许幂等；任务结束安全关闭连接。
- 安全：事件订阅和操作需做 authn/authz，确认 task 与当前用户/租户匹配；Cookie + CSRF 或鉴权方案取决于项目；不得把 token 随手放在 URL。
- 任务执行期间依赖对象被更新时，约定快照/版本；不要隐藏竞态条件。

## 反例：路由卸载时无条件中止生成

```tsx
// ⚠️ 如果 useEffect 属于 ConversationPage，切换路由时执行 cleanup。
useEffect(() => {
  const abort = new AbortController();
  startModelStream({ signal: abort.signal });
  return () => abort.abort(); // 只用于“离开即取消”的明确业务规则
}, [conversationId]);
```

**替代方向**：连接由应用级任务管理器拥有；React 页面订阅数据、解除订阅只释放 UI listener。任务取消需要独立明确的 API。单靠取消 UI listener 不会终止服务端任务。

## 适配与不要过度工程

- 如果现有后端已经支持 task_id、数据库、worker、Redis，可复用；如果任务只有 100ms，没必要排队。
- 对话切换只要求“保持继续执行”且只针对当前 Tab，可先做 M 档；但不能宣称刷新之后也可恢复。
- 前端显示正在生成的对话徽标、后台完成 Toast（可选）和“返回正在生成会话”入口，不需要锁全屏。
- 不同任务应有局部重试、取消、超时与错误信息；全局导航永远应可用，除非整个应用确实处于安全维护等全局不可用状态。
