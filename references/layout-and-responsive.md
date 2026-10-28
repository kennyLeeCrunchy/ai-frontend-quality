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
| 滚动条悬在内容列边缘、与窗口边之间大片空白 | 居中的内容列同时充当滚动容器（`max-width` + `margin:auto` + `overflow:auto`） | 滚动容器通栏全宽让滚动条贴边，内容列改用 padding 居中：`padding-inline: max(16px, calc((100% - 内容宽)/2))` |

## 多栏工作台布局的检查点

1. 若采用导航、主内容和辅助栏，明确每列的最小可用宽度与收缩方式。
2. 需要独立滚动的区域设清楚边界，避免滚动时丢失输入或阅读位置。
3. 网格列可用 `minmax(0,1fr)` 与子项 `min-width:0` 防止内容撑宽；换行、截断或展开依内容语义选择。
4. 可用容器查询依据局部可用宽度调整列数，用媒体查询处理视口级布局；不要求所有页面都改为抽屉。
5. 浏览器缩放是验收场景，不是响应式设计手段；在放大后仍应可操作。

请按需打开 [examples/workspace-layout.css](../examples/workspace-layout.css)，其中的四象限布局只是一个示例，需适配现有结构与 CSS tokens。固定网格项高度前先确认长内容与滚动行为。

## CSS 如何选择滚动条策略

```css
.scroll-pane { min-height: 0; overflow-y: auto; scrollbar-gutter: stable; }
.long-text { min-width: 0; overflow-wrap: anywhere; white-space: normal; }
/* 对代码块优先横向滚动，避免破坏代码缩进 */
pre { max-width: 100%; overflow-x: auto; }
```

`scrollbar-gutter: stable` 对 overlay scrollbar 不强制制造槽位；传统滚动条占空间的平台最明显。`overflow: hidden` 只用于有明确裁切语义的容器，不能拿它来“修复”所有溢出。

## 动态内容不必完全不动

新增内容使当前区域增高本身正常；应排查无关面板被推挤、输入焦点丢失或滚动位置意外重置。追求的是边界稳定而非冻结一切高度。
