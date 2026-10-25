# 视觉质感：三段视频提炼 + 工程补充

本文件分清楚 **视频中的设计观点** 与 **本 Skill 的工程延伸**。参数是演示参考，不是准则。

## 第一段视频：AI 客户端质感五项

1. 背景层级替代大量黑粗边框：用 surface 0–3、间距、轻微明度/透明度差区分布局。相邻层明度差参考 1%–3%，由实际色彩与设备调整。不能去掉焦点环和真正有语义的分隔线。
2. 暗色模式字体重量：白字黑底可能显得更粗，可对实际字体试低一档字重；先保证正文可读性/对比度，再谈美感。
3. 流式淡入：可尝试短片段从 `blur(6px)` / 低透明到清晰，参考 120ms、错峰 30ms、`cubic-bezier(0.16,1,0.3,1)`；不能为了动效延迟真实流式内容。
4. 数字和图标稳定：`font-variant-numeric: tabular-nums`；行内图标在有证据时使用 `vertical-align:-0.125em`；折叠区可用 `grid-template-rows:0fr → 1fr`，高度变化须保证阅读位置可控。
5. 动效与反馈有性格：拖拽/吸附可使用阻尼、点击即时反馈、复制成功可在约 2.5 秒后消失；不需要每个控件都有弹跳动画。

## 后两段视频：弹出层家族

Bottom Sheet、Action Sheet、Snackbar、AlertDialog、Inline Alert；Tooltip、Toast、Modal、Popconfirm、Drawer 的语义差异。重点不是“新潮组件”，而是**使用任务和误触风险驱动选择**。详见 [requirements-and-component-choice.md](requirements-and-component-choice.md)。

## 工程建议（本 Skill 补充）

- Design tokens 集中管理，优先继承已有品牌和暗色模式，不直接覆盖业务色彩。
- 标题层级保持克制：避免 eyebrow、标题、副标题与辅助说明层层堆叠；只有当副标题补充了标题未表达的信息时才保留，避免重复释义或为填充版面硬加文案。
- 降低动画 DOM 成本：不要每次 SSE chunk 为每个字符新建永久 span；短片段动画+reduced-motion；长 Markdown、代码、表格显示稳定优先。
- 首帧/内容加载保持视觉稳定，不做全屏闪屏骨架；仅 skeleton 局部必要区域。
- 数字从 99 → 100 位数变化时 `tabular-nums` 并不保证整个数字盒子宽度不变，必要时额外预留宽度。
- 适当检查字体抗锯齿、设备像素比与暗色背景。字重 350 只有字体支持时才有意义。
- 如动画引起 Layout Shift、LCP/INP 回退、可读性下降，宁可不用动画。

## 可参考 CSS

```css
:root {
  --surface-0: #f7f8f6;
  --surface-1: #f0f3ef;
  --surface-2: #e8eeea;
  --surface-3: #e0e8e2;
  --motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
/* 颜色只是占位例子，需替换成项目已用 tokens 并检测对比度 */

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
