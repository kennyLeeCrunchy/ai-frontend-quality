# 前端验证矩阵与性能诊断

## 按问题选诊断工具

| 要确认的假设 | Chrome / React 工具 | 可观测证据 |
|---|---|---|
| 真正整页 Reload | Network → Preserve log / document 请求 | 同一次交互产生新的 HTML document |
| 非必要重挂载 | React DevTools Profiler、组件 mount/unmount 日志 | 输入焦点或 local state 被重置，mount 新实例 |
| 大范围 Re-render | React Profiler flamegraph | render/commit 哪些组件参与及耗时 |
| Refetch / Loading 闪烁 | Network Fetch/XHR、TanStack Query Devtools | 保存一张卡片触发整个 workspace 的重新拉取或清空数据 |
| 文字撑宽、布局跳动 | Elements → Computed；Rendering → Layout Shift Regions | 哪个子节点超过父容器；哪个元素位移 |
| 滚动条挤布局 | 分别模拟有/无内容溢出；检查 scrollbar 类型 | 隔壁面板宽度/位移变化 |
| 主线程卡顿 | DevTools Performance → Long tasks | 同步渲染/JS 占用 >50ms 的任务（具体按设备核实） |
| 流切路由被取消 | Network SSE 连接 + 后端 task 状态日志 | 连接被关闭是否连带任务结束；回到旧对话能否继续/恢复 |

注意：React Profiler 的 render 并不等于 DOM 一定重建；DevTools 的绘制高亮不等于组件重挂载。严格区分证据。

## 验收场景

- 视口：375×812、768×1024、1280×720、1440×900、1920×1080（根据目标产品调整）。
- 浏览器缩放：100%、125%、150%、200%；此外检查系统文本放大、窄窗侧栏折叠。浏览器缩放的 E2E 自动化支持依浏览器和环境而异，必要时人工测试。
- 内容：空状态、超长中文、连续无空格英文/URL、代码块、图片、十倍数量的卡片、正在流式生成的大篇文本。
- 操作：增删改卡片、模态编辑未保存草稿、右栏开合、滚动条切换、工作区/对话频繁切换。
- 状态：正在加载 / 成功 / 部分失败 / 离线 / 超时 / 重连 / 取消与完成竞速。
- 非阻塞：生成中切 B 对话、编辑另一卡片、保存配置、回 A 查看已有输出；确认只影响相关业务。
- 可访问性：Tab 焦点顺序、Esc/遮罩、ARIA、reduced-motion、足够可读对比度、触屏软键盘。

## 测试完成的定义

1. 具体重现步骤 + 修前失败证据。
2. 说明根因（若仅是假设，标注未确认）。
3. 修后结果；例如任务运行时是否仍可切 B、草稿是否保留；不要凭截图宣布已修复网络/状态问题。
4. Playwright 可作基础回归；使用 [examples/playwright-stability.spec.ts](../examples/playwright-stability.spec.ts) 的测试骨架并适配项目真实 selector。
5. 说明未执行的浏览器/屏幕/恢复场景，不捏造测试通过。
