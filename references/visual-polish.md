# 视觉层级、主题与动效

## 界面层级与视觉反馈

1. 用背景和间距区分层级：用 surface 0–3、间距、轻微明度/透明度差区分布局。相邻层明度差按实际色彩、对比度与设备调整。不能去掉焦点环和真正有语义的分隔线。
2. 暗色模式字体重量：白字黑底可能显得更粗，可对实际字体试低一档字重；先保证正文可读性/对比度，再谈美感。
3. 流式淡入：可尝试短片段从 `blur(6px)` / 低透明到清晰，时长、错峰和曲线按片段密度与实际表现调整；不能为了动效延迟真实流式内容。
4. 数字和图标稳定：`font-variant-numeric: tabular-nums`；行内图标在有证据时使用 `vertical-align:-0.125em`；折叠区可用 `grid-template-rows:0fr → 1fr`，高度变化须保证阅读位置可控。
5. 反馈与动作对应：拖拽/吸附可使用阻尼、点击即时反馈、复制成功等低风险反馈可短暂显示；不需要每个控件都有弹跳动画。

## 连续曲率圆角

卡片、面板、按钮等圆角矩形默认使用连续曲率的平滑圆角，让直边到圆角的弯曲逐渐过渡。同一组组件沿用一致的圆角形状，半径按尺寸和层级选择。圆形头像等有明确几何语义的形状按原有语义绘制。

- **Apple 原生界面**：优先复用系统控件。自定义形状可用 SwiftUI 的 `RoundedRectangle(cornerRadius: radius, style: .continuous)`，或设置 `CALayer.cornerCurve = .continuous` 并配合 `cornerRadius`。[SwiftUI 连续圆角](https://developer.apple.com/documentation/swiftui/roundedcornerstyle/continuous) · [Apple Core Animation 示例](https://developer.apple.com/videos/play/tech-talks/10857/)
- **Figma**：分别记录 `cornerRadius` 与 `cornerSmoothing`。iOS 预设是 60%（API 值 `0.6`），按项目视觉调整。需要理解或复刻几何时，参考 Figma 对直边、三次贝塞尔过渡段与圆弧的推导。[Figma Corner Smoothing API](https://developers.figma.com/docs/plugins/api/properties/nodes-cornersmoothing/) · [Figma 圆角曲率推导](https://www.figma.com/blog/desperately-seeking-squircles/)
- **Web**：保留 `border-radius` 作为不支持时的回退，支持时渐进增强为 `corner-shape: squircle`（等价于 `superellipse(2)`）。这类轮廓可用于视觉近似，参数不能与 Figma 平滑百分比直接换算。若固定形状必须精确贴合设计稿，可复用设计导出的 SVG 路径。[CSS Corner Shaping](https://drafts.csswg.org/css-borders-4/#corner-shape)

验收时检查实际尺寸下的轮廓、嵌套间距、边框和内容裁切，保留键盘焦点的可见性。

## 异步加载与内容切换

- 刷新、切换视图等操作开始后，尽快反馈当前区域的加载状态。旧内容仍适用于当前视图时先保留，避免空白和无意义闪烁；旧内容不再适用时，用与真实内容结构相近的局部 skeleton 占位，保持尺寸和布局稳定。不要用全屏遮罩替代局部反馈。
- 同一视图中视觉上属于一次切换、且需要保持内容一致的区域，共用就绪条件；先各自显示贴合形状的占位，关键结果到达后在一次状态切换中统一释放 skeleton、同步淡入。就绪条件须覆盖成功、空态及可展示的错误；慢请求应能让用户恢复，不能无限维持骨架。避免多个组件各自设置延时或先后揭示，造成“闪两次”。真正独立的数据仍可单独呈现，不强迫整页等待。
- 数据就绪后直接替换占位内容；短暂的透明度淡入淡出可以帮助用户感知内容已切换。动效保持克制，不用大幅位移或缩放，也不能等待动画结束才允许继续操作。具体时长以实际界面中的可读性与响应速度为准。
- 请求很快完成时不显示一闪而过的 skeleton 或过渡动画。尊重 `prefers-reduced-motion`，减少或关闭装饰性过渡，同时保留清晰的状态变化。

参考 [Apple HIG · Loading](https://developer.apple.com/design/human-interface-guidelines/loading) 和 [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)。

## 主题、排版与性能

- Design tokens 集中管理，优先继承已有品牌和暗色模式，不直接覆盖业务色彩。为错误、选中、焦点等状态复用或定义语义颜色，同一用途在浅色、深色和平台支持的高对比模式下保持可辨认。关键信息同时用文字、图标或形状表达。验证实际背景上的对比度，尤其是浮层与半透明区域。参考 [Apple HIG · Color](https://developer.apple.com/design/human-interface-guidelines/color) 和 [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)。
- 当相邻功能区需要更明确的层级时，可试用现有 tokens 的相邻明度，而不是新增色相或降低文字对比度。色带是否通栏、内部卡片是否保留边框，应由页面结构和既有设计系统决定；避免叠加没有作用的多层描边。
- 标题层级保持克制：避免 eyebrow、标题、副标题与辅助说明层层堆叠；只有当副标题补充了标题未表达的信息时才保留，避免重复释义或为填充版面硬加文案。
- 降低动画 DOM 成本：不要每次 SSE chunk 为每个字符新建永久 span；短片段动画+reduced-motion；长 Markdown、代码、表格显示稳定优先。
- 数字从 99 → 100 位数变化时 `tabular-nums` 并不保证整个数字盒子宽度不变，必要时额外预留宽度。
- 适当检查字体抗锯齿、设备像素比与暗色背景。字重 350 只有字体支持时才有意义。
- 如动画引起 Layout Shift、LCP/INP 回退、可读性下降，宁可不用动画。

## 参考实现：数字、流式淡入与折叠

这里的缓动用于不跟手的短过渡。移动端拖拽、吸附和回弹见 [手势驱动的弹簧动效](mobile-touch-and-motion.md#手势驱动的弹簧动效)。

```css
:root {
  --surface-0: #f7f8f6;
  --surface-1: #f0f3ef;
  --surface-2: #e8eeea;
  --surface-3: #e0e8e2;
  --motion-ease-out: ease-out;
}
/* 颜色、位移和动效时长均为示意。使用项目 tokens 并验证实际效果。 */

.numeric { font-variant-numeric: tabular-nums; }
.inline-icon--optical { vertical-align: -0.125em; }

.stream-chunk-enter {
  animation: stream-reveal 120ms var(--motion-ease-out) both;
}
@keyframes stream-reveal {
  from { opacity: .55; filter: blur(6px); }
  to { opacity: 1; filter: blur(0); }
}
.collapsible { display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows 220ms var(--motion-ease-out); }
.collapsible[data-open='true'] { grid-template-rows: 1fr; }
.collapsible > * { min-height: 0; overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
  .stream-chunk-enter { animation: none; }
  .collapsible { transition: none; }
}
```

## 不要强行套用

- 页面高密度 B2B 工作台不一定适合每个角落都使用柔和浮层。
- 对话打字动画应当低于可理解的文本到达速度，不要制造过度“光晕”。
- 复制反馈不适合唯一的重要错误提示，错误需要持续可见的修复路径。
