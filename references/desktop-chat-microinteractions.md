# Desktop AI Chat: 细节、输入法、滚动与视觉边界

参考视频：Ludi《大厂 UI 第二弹》，以及其开源 [desktop-agent-ui](https://github.com/Ludi-Herry/desktop-agent-ui)；本文件为适配本 Skill 的独立整理/实现建议，**不是源仓库逐字搬运**。

## 触发及用户确认

- 做新聊天输入框时，先确认 Enter 发送 / Shift+Enter 换行是否符合已有习惯；如用户指定其他快捷键，以用户设置优先。现有产品已定规范不反复问。
- 做流式滚动时，确认「用户手动上滚后停止跟随」为默认，只有需要反常行为时才讨论。
- 做分屏时，确认用户是否需要固定侧栏、拖动调宽、折叠/全屏以及最小可用宽度；大改信息架构才询问。
- 视觉参数只作为可调设计 token，不因视频出现数值就硬编码为常数。

## 1. IME Enter：选字不等于发送

常见误触：拼音输入候选时 Enter 选字被组件误识别为发送。

优先用事件语义拦截：`KeyboardEvent.isComposing`、`keyCode===229`（仅兼容性兜底）、`compositionstart/end` 跟踪组合态；**仅在实际观察到输入法在 compositionend 后继续派发 Enter 时**，对刚结束组字的首个 Enter 做短时的一次性防护。作者仓库提及 500ms，**它不是通用标准**：窗口设得过大可能吞掉用户选择词后快速按下的正常发送。应跨 Windows 拼音、搜狗、macOS 拼音、浏览器实际测试，评估合适窗口，必要时允许 Ctrl/Cmd+Enter 显式发送作为替代。

- 有效输入不应被截断，也不能在 `compositionend` 之前处理一个尚未确定的 draft。
- Enter 发送时判断空文本、发送中的冲突策略、附件上传未完成状态。不要只在 keydown 判断，表单 onSubmit 也要遵守安全提交策略。
- 参考 [`examples/ime-composer.tsx`](../examples/ime-composer.tsx)；短时防护默认关闭，确认目标输入法确有额外 Enter 后再配置。这是独立 React 演示组件，不是所有 IME 的完备兼容证明。

## 2. 流式滚动必须尊重用户阅读意图

- 只有用户原本贴底 / 主动点击“回到底部”时才自动跟随流式内容。
- `distanceFromBottom = scrollHeight - scrollTop - clientHeight`，可从 40px 容差调参；**这不是唯一信号**：用户主动向上滚轮时即使仍离底部很近，也应暂停跟随。
- 不能每输出一个 token 都执行 `scrollIntoView({behavior:'smooth'})`：容易形成动画队列/抖动。通常直接贴底，靠稳定的布局与适度批处理实现顺滑。
- 上方阅读状态时保持当前位置；新消息可提示“有新回复 / 回到底部”；图片、代码高亮增高时尤其要测试。恢复历史滚动建议记录 messageId 与相对偏移，单独评估 CSS `overflow-anchor` 与虚拟列表行为。
- 参考 [`examples/chat-scroll-follow.tsx`](../examples/chat-scroll-follow.tsx)。

## 3. 边框收敛：清晰层级，不是全局禁用边框

- 避免外卡片 → 内框 → 操作栏 → 按钮重复套明显描边；优先让一层负责可见轮廓，其他层用背景明度、间距或分割线表达。
- 外层卡片边框配合内层浅背景即可；交互控件的边界、键盘 focus ring、输入框错误态仍应保留。**不可为了好看删除无障碍焦点轮廓。**
- 1px / hairline 在高 DPI 下视觉权重不同，应现场确认。不要把“只准套一层”当作不可违背的 CSS 规则。

## 4. 同心圆角（Concentric Radius）

相同四边内间距 `p`、形状接近、边线厚度可忽略时，常用近似：

`outerRadius ≈ innerRadius + p`

例如内层 `8px`、四周 `12px` 内边距 → 外层 `20px`。对不等间距、非圆形、非均匀圆角或使用不同 border box 的组件，必须按图形实际检查，不能盲用公式。

参考 [`examples/desktop-detail-tokens.css`](../examples/desktop-detail-tokens.css)：同时包含 token、单主边框、焦点态及 reduced motion。

## 5. 长文件名：扩展名要保留

上传列表中 `季度经营分析汇总...pdf` 比 `季度经营分析...` 更有意义。

- 将文件 baseName 和扩展名分离渲染；让 baseName `min-width:0; text-overflow:ellipsis`，扩展名 `flex:none`。
- 完整文件名留在 `title` / `aria-label` / 文件详情中；不能只靠扩展名判断真实 MIME type/安全性。
- 参考 [`examples/file-name-chip.tsx`](../examples/file-name-chip.tsx)。

## 验收

1. 打拼音、按 Enter 选词，不发送；结束组字后明确按 Enter 可以发送。
2. 长流式回复时上滚不被拽回；回底按钮有效；滚动位置不意外跳动。
3. 背景/分割线/边框只承担明确功能，焦点与错误状态始终可见。
4. 嵌套圆角与内边距视觉协调，不出现局部硬折线。
5. 超长文件名、窄窗口、200% 缩放依然可识别后缀，完整名称可获取。
