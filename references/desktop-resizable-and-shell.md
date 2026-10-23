# Desktop Shell & Resizable Panels（按需启用）

参考视频与 MIT 仓库： https://github.com/Ludi-Herry/desktop-agent-ui

## 范围边界

本扩展针对桌面浏览器工作台、Electron / Tauri 包装层，以及多栏 AI Agent Workspace。对普通手机网页、单列文章页，不强行应用窗口级规则。优先检查项目现有 Resizable/Panel 组件（如已使用成熟库则延用），不能为了 Skill 引入第二套。

## 1. 分栏拖拽：稳定的比例、手柄与折叠状态

- 宽度从可用容器空间计算，设置实际可用的最小宽度；当总空间不足时退化到 Drawer/单列，而不是任由内容被挤成 0px。
- 只改变相邻两个面板，不导致其他无关面板 Layout Shift；左右滚动各自独立，`min-width:0`。
- 支持拖拽、键盘箭头调整、Escape 取消并恢复本次拖拽起点；拖拽结束才提交最终布局值。
- 折叠/吸附策略**是产品决策**：作者视频示意极限比例可吸附，18%/82% 仅为示例；须有明确的一键恢复入口。拖拽期间不卸载仍负责 pointer capture 的 handle。
- 采用原生 Pointer Events 的项目需要处理 `pointercancel`、取消时的 pointer capture 和卸载；不应仅靠 `mousemove` + 页面全局监听。
- 参考 [`examples/resizable-workspace.tsx`](../examples/resizable-workspace.tsx)；这是较易复用的演示级实现，成熟项目优先用已有可访问分栏组件。

## 2. 自适应 Composer

- `field-sizing: content` 是渐进增强，不应假定所有 WebView 的运行时都支持；在不支持时可以使用 scrollHeight 测量。
- 设定合理的 `min-height/max-height`，达到最大高度时滚动输入框本身；避免整个页面被撑高。
- 隐藏滚动条并不是默认的无障碍优先选择：若仅依靠滚动条暗示有更多文本，应保留明显滚动线索。测试键盘/滚轮/触摸可达性。
- 外框过渡避免使按钮在每次换行时大幅位移；尊重 reduced motion。

## 3. Shadow / Clip：可测量但别滥用零告警

- 视觉阴影可能被任何裁切祖先（overflow, clip-path, contain:paint）或桌面窗口物理边界截断；检查真实层级和窗口尺寸。
- 结构建议：外层投影、内层圆角裁切；只给需要滚动的内层设置 `overflow:auto`；不能全局改成 `overflow:visible`。
- 作者提供 [`scripts/clip-audit.js`](https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/scripts/clip-audit.js) 用于近似寻找可能被裁切的投影；该脚本只做启发式几何估计，非渲染像素真值。其 `cut===0` 表示**没有被脚本检测出的部分裁切问题**，不等于视觉完全通过；`cut>0` 也可能是设计允许的裁切。配合截图/浏览器实测，不可把它当唯一发布门禁。
- 对第三方脚本先审查其执行内容和权限再运行。未经用户明确要求，不自动执行远程代码。

## 4. CSS Scroll-Driven Animations

滚动渐变遮罩可以通过 `animation-timeline: scroll()` 或 View Timeline 逐步增强，但不能仅因“Zero JS”就声称 CPU 为 0 / 主线程永远不阻塞。滚动动画的合成器支持、动画属性、设备/浏览器实现差异均需实际测量；必须给出 `@supports` 检测及静态/渐变降级。

## 5. 多窗口/多进程：只在业务真需要时引入

弹出桌面新窗口 + 多窗口写入共享文档时，需要权威持久状态、订阅机制和乐观并发版本控制（例如版本号 / ETag / CAS）。

- 不等于必须从零造 Broker-Replica；可复用已有 Electron/Tauri IPC、React Query 缓存/后端持久化。
- 不同窗口断连后以权威数据重新同步；带副作用的工具调用不可“收到重复事件就再执行一次”。
- 如果只是一页浏览器中的两个面板，不引入多窗口 Broker。

## 验收重点

- 对比宽屏/窄屏、100%/150%/200% 缩放。
- pointerdown → move → Escape / pointercancel / pointerup 状态全部能回到可拖拽状态。
- 低于最小宽度后折叠能恢复，聊天输出未中止，草稿未丢。
- 不同滚动区域不相互劫持，也没有莫名水平滚动。
