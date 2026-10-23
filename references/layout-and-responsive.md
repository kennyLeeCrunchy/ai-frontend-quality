# Layout Stability / Responsive Design：定位与修复

## 症状 → 原因 → 修复

| 现象 | 常见根因 | 优先修复 |
|---|---|---|
| 长中文、英文 URL 撑爆卡片 | Grid/Flex 子项 `min-width:auto`；`white-space:nowrap`；连续 token | `min-width:0` / `minmax(0,1fr)`；`overflow-wrap:anywhere` |
| 内容一长旁边模块左右移动 | 宽度由内容决定、缺少容器边界、隐式最小宽度 | 明确网格轨道和最大/最小边界 |
| 右侧出现滚动条时中间突然变窄 | 传统滚动条占空间 | 滚动容器 `scrollbar-gutter:stable`；避免误套到整页 |
| 某个卡片变高带动整行 | Grid row 高度由最高项决定（正常布局行为） | 选择独立内部滚动、瀑布流或固定行高；不要无脑锁高度截断 |
| 左边固定栏 + 工作台 + AI 侧栏 50% 才能看 | 僵硬固定宽度、断点取窗口不是容器 | 外层 App Shell + 中层 container queries + 抽屉降级 |
| 缩小浏览器后文字过小/按钮挤在一起 | 用 Zoom 代替响应式；使用大量绝对定位和固定 px | 媒体查询、容器查询、`clamp` 仅用于适用元素 |
| 图片加载把下面内容推走 | 缺失占位大小/比例 | `aspect-ratio`、明确宽高或骨架区域 |
| 拖拽面板后主区变零宽 | 拖拽未设置 min/max 或无断点回退 | `clamp` 宽度、边界验证、compact 模式 |

## 四象限工作台布局的五个约束

1. App Shell 拆为导航/工作区/AI 栏；每列可收缩，业务需要的最小宽度明确。
2. 中央 Workspace 有独立滚动边界；右侧 Chat 也可独立滚动；用户状态不因滚动出现丢失。
3. 四象限 `repeat(2,minmax(0,1fr))`；内部 `min-width:0`；文本可以换行/截断/展开，策略依内容语义。
4. 使用 `@container` 根据**工作区可用宽度**从两列转一列；`@media` 根据**窗口宽度**切换右侧聊天抽屉。
5. 浏览器 Zoom 是验收矩阵，不是自适应设计手段。不要保证所有浏览器 50% 缩放下仍两列完整展示，应该在 100–200% 放大时也可操作。

请按需打开 [examples/workspace-layout.css](../examples/workspace-layout.css)，文件中含可复制样式；与现有 CSS tokens 做适配。通常不应直接固定四个象限的高度，否则长内容被裁掉且滚动易产生嵌套冲突。

## CSS 如何选择滚动条策略

```css
.scroll-pane { min-height: 0; overflow-y: auto; scrollbar-gutter: stable; }
.long-text { min-width: 0; overflow-wrap: anywhere; white-space: normal; }
/* 对代码块优先横向滚动，避免破坏代码缩进 */
pre { max-width: 100%; overflow-x: auto; }
```

`scrollbar-gutter: stable` 对 overlay scrollbar 不强制制造槽位；传统滚动条占空间的平台最明显。`overflow: hidden` 只用于有明确裁切语义的容器，不能拿它来“修复”所有溢出。

## 动态内容不必完全不动

新增一张卡片使**本象限高度增长**本身正常；错误是**无关面板宽度被推挤、输入焦点丢失、对话滚动无故回顶部**。追求的是边界稳定而非冻结一切高度。
