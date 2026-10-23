# Render Stability / State Management：先识别再修

## 四种完全不同的问题

| 类别 | 用户看到 | 如何确认 | 修复方向 |
|---|---|---|---|
| 真正的 Reload | 整页闪白、导航/连接重新初始化、整站状态重置 | DevTools Network 出现新的 `document`，检查页面导航/`location.reload()`/原生 form submit | SPA 路由/事件阻止默认提交、避免非必要强制刷新 |
| Remount | 输入草稿消失、组件局部 state 重置、重新挂载副作用或动画重播 | React DevTools Profiler / mount/unmount 日志；检查 `key` 是否变化 | 稳定业务 ID、组件类型和树结构；保留跨视图草稿 |
| 大范围 Re-render | 许多子组件 render 函数重新运行，但 DOM 不一定改变 | React Profiler、render count；对比 commit 的 DOM | 将频繁状态放在近使用处；memo 前先测；必要时 selective subscriptions |
| Refetch / loading 闪烁 | 保存一个对象后全屏 skeleton、重复请求、旧数据消失 | Network 的 XHR/fetch；TanStack Query Devtools；观察缓存和 invalidation | 精确 query key、局部 cache mutation、保留旧数据、局部加载 |
| 主线程被同步计算占满 | 所有点击都迟钝，动画冻结，切换也不动 | Performance 长任务/CPU profile | Web Worker / 分块计算 / 虚拟列表；异步网络请求本身通常不会锁主线程 |

**不能仅凭截图证明是哪一种**，优先让 Agent 实测重现。

## 首轮定位顺序

1. Network 勾选 Preserve log；触发一次添加/删除，是否 `document` 新请求？
2. React Profiler 记录 commit 与组件 mount/更新；状态重置时看 key / conditional tree。
3. Network/XHR 看是否所有接口重新发起；定位失效范围和骨架屏条件。
4. Chrome Rendering → Paint flashing / Layout Shift Regions（与 DevTools 版本有关），区分重绘与布局位移；Performance 查长任务。
5. 如果异步结果乱序，给响应绑定 `conversationId`、`requestId` 或服务端版本，不因切换当前页面就错误地把结果写到当前可见对话。

## 不建议的“伪修复”

- 给最外层加 `key={Date.now()}` 强制刷新。
- 每保存一次调用 `window.location.reload()`。
- 把所有网络 Query 都统一 invalidate，或先清空全部缓存显示全屏 Loading。
- 对所有组件无差别 `memo`，忽略数据依赖错误和组件重挂载。
- 使用 `useTransition` 试图解决服务端任务被取消。Transition 调度渲染，不是任务持久化。

## 参考用法

阅读 [examples/react-stability.tsx](../examples/react-stability.tsx)：它演示列表稳定业务 ID、独立编辑草稿、TanStack Query 的单条/单列表范围更新（需按现有版本和 API 调整）。

React ReactDOM 的普通 Re-render 不意味着整页 DOM 被重建；改变 key 可能主动触发重置。缓存更新应保留未修改区域的稳定数据。

## 参考修复：原生表单提交导致 Reload

```tsx
// 错：button 在 form 内可能默认 type="submit"，触发浏览器导航。
<form><button onClick={saveDraft}>保存</button></form>

// 对：阻止默认导航，或者将不提交表单的按钮标为 type="button"。
<form onSubmit={event => { event.preventDefault(); void saveDraft(); }}>
  <button type="submit">保存</button>
  <button type="button" onClick={closeEditor}>关闭</button>
</form>
```

## 参考修复：不稳定 key 导致 Remount

```tsx
// 错：每次 render 都改 key，组件会丢输入与内部状态。
<CardEditor key={Date.now()} card={card} />

// 对：业务实体使用稳定 ID。同一条卡片编辑中的重渲染不会自动丢状态。
<CardEditor key={card.id} card={card} />
```

如果是**有意**切换完全不同对象且需要清空局部编辑状态，稳定的对象 ID 作为 `key` 也可以用于**有意的** Remount。真正的跨对象草稿则需按 `cardId` 保存到上层/独立 store。
