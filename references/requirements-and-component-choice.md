# 组件选型：先确认任务语义，不凭喜好选弹窗

## 决策门槛（需求驱动）

在决定界面行为前，先从已有 PRD、页面交互、接口与用户描述获得下列信息：

1. 目标：解释 / 信息提示 / 成功反馈 / 表单 / 选动作 / 关键确认 / 预览。
2. 影响：误操作损失有多大、是否可逆、撤销可保持多久、是否触及权限或永久删除。
3. 工作上下文：是否需要同时查看主页面、对比多条记录，用户是否可能留有未保存草稿。
4. 内容与设备：信息长度、表单步数、手机/桌面、键盘使用、低宽度布局。
5. 一致性：项目已有设计系统、组件库、产品术语。

**只在以下情况询问**：答案改变组件类别、数据风险、导航/任务持续运行行为或大量 UI 改动。例如“删除”是软删除还是永久删除？“详情编辑”需要参照原列表吗？“切换对话”后生成要继续还是主动取消？

可用提问：

> 删除卡片后需要支持撤销吗？如果可以恢复，我倾向 Snackbar + 撤销；如果永久不可恢复，我会改用明确后果的 AlertDialog。

> 编辑流程需要边看主画布边操作吗？需要则更适合 Drawer；不需要且步骤较多则独立页面可能更稳定。

> 切换聊天时生成任务是否要继续？如果要继续，前端流连接必须离开会卸载的聊天子组件；如果还要刷新/跨设备恢复，则需要后端持久任务。

如果需求已明显，**不要为了流程问用户**；如果用户没给细节但任务可逆，默认最小改动并列出假设。

## 组件矩阵

| 组件 | 语义/场景 | 特别注意 |
|---|---|---|
| Switch（开关） | 可直接开启或关闭的布尔设置 | 一眼看出当前状态，标签固定，不只靠颜色区分 |
| Tooltip | 解释术语、图标含义 | 非必读信息；支持键盘聚焦和触屏替代 |
| Toast | 已保存/已复制 | 短、不阻断；不是表单字段错误的唯一来源 |
| Snackbar | 可恢复删除、归档后 Undo | 撤销必须真实有效；可恢复期限合理 |
| Popconfirm | 列表行级轻量确认 | 高风险不能只靠靠近按钮的轻提醒 |
| Modal/Dialog | 需要暂时集中注意力的短任务 | 保留草稿；遮罩/Esc 导致丢失前要防护 |
| AlertDialog | 永久删除等不可逆/高风险 | 后果、对象、不可逆性、明确动词 |
| Drawer | 复杂详情、边参照列表边编辑 | 过窄时改全屏或独立页；正确管理焦点 |
| 移动端面板与动作菜单 | 底部内容面板、上下文动作菜单 | 见 [移动端面板与动作菜单](mobile-touch-and-motion.md#移动端面板与动作菜单) |
| Inline Field Error | 输入字段校验失败 | 字段邻近关联 `aria-describedby` |
| Lightbox | 放大预览图片/媒体 | 清楚退出、快捷键、焦点与关闭后返回 |

## 布尔设置使用开关

- 用固定标签命名设置，例如「显示底部面板」，由滑块位置清楚表达开关状态。优先复用已有 Switch，确保键盘可操作、读屏可读到状态。参考 [W3C Switch Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)。
- 设置项能直接修改时，禁止用动作按钮代替开关。设置只能在系统页面修改时，单独展示能读到的当前状态，并用「前往系统设置」链接或按钮导航。
- 判断依据是功能是否开启。两个命名选项（例如「浅色／深色」）用单选或分段控件。

## 设置的位置与保存反馈

- 影响当前视图或任务的选项放在对应界面，例如在面板附近提供显示控制。跨页面、低频修改的偏好集中到应用设置。
- 异步保存失败时，让开关恢复到最近确认的状态，并在设置项附近说明失败及可用操作。若请求超时且是否保存成功未知，先核对实际状态再确认结果。

参考 [Apple HIG · Settings](https://developer.apple.com/design/human-interface-guidelines/settings)。

## 焦点与替代操作

- 模态打开后将焦点移入并限制在对话框内，关闭后还给触发控件。若原控件已删除或隐藏，将焦点移到逻辑上的后续位置，例如同列表的下一项。非模态面板保留页面原有的键盘操作路径。
- 为依赖拖拽的关键操作提供可点击且键盘可用的替代入口。例如拖入文件区旁提供「选择文件」，拖拽排序提供「上移／下移」。

参考 [Apple HIG · Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)、[W3C 模态框模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) 与 [W3C 拖拽替代操作](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)。

## 表单填写与纠错

- 用持续可见的字段标签说明输入内容，并与控件建立关联。placeholder 用于展示例子，关键格式要求保留在字段附近。
- 根据字段选择校验时机。邮箱等格式适合在离开字段或提交时校验，避免输入尚未完成就报错。用户修改已报错的字段时，适时更新反馈。
- 提交失败后保留已填内容。字段错误就地说明原因和改法，并关联错误文案。比如「请输入公司邮箱，例如 name@example.com」。无法关联到单个字段的错误放在表单提交区附近，并说明下一步。

参考 [Apple HIG · Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) 和 [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data)。

**参考 HTML（字段校验失败时）**

```html
<label for="work-email">工作邮箱</label>
<input id="work-email" name="workEmail" type="email" autocomplete="email"
       aria-invalid="true" aria-describedby="work-email-error">
<p id="work-email-error">请输入公司邮箱，例如 name@example.com。</p>
```

用户修正后，更新字段的无效状态和错误描述。字段的当前值由表单状态保留。

## 按钮层级与可发现性

- 同一组操作里，用明显的样式突出最常用或最合理的下一步。例如编辑表单突出「保存」，「取消」用次要样式。具有同等重要性的选择使用相近的视觉权重。
- 图标含义不直观时加短标签。纯图标按钮提供可访问名称。重要操作也要有可见、可用键盘打开的入口，例如「重命名」同时出现在右键菜单和行内「更多」里。

参考 [Apple HIG · Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) 和 [Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)。

## 三个典型误用

1. **把所有事件都弹窗确认**：如果行为安全、可以撤销，考虑 Snackbar + Undo；支付、永久删除仍需强确认。
2. **正在填写的表单点击背景就消失**：识别 dirty state；可保留草稿、提示丢失风险或要求确认丢弃；仅禁止 Esc 不是完整方案。
3. **二义按钮**：不要“是 / 否”或“确定”；改为“取消 / 永久删除项目”。

## 选择过程的交付示例

```text
任务：从四象限移除一张卡片
已知：卡片进入回收站，30 天可恢复；不需要额外输入
判断：可撤销、低风险、列表内操作
选型：直接操作 + Snackbar「已移至回收站 · 撤销」
不选：AlertDialog（操作可恢复、确认过重）
实现约束：操作失败则回滚；Undo 可以恢复原位置、顺序和选择状态
验收：按钮键盘可达；撤销不会覆盖后续修改
```

## 参考伪代码：脏表单阻止误关

```tsx
function EditDrawer({ open, onOpenChange }: Props) {
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function requestClose() {
    if (dirty) { setConfirmDiscard(true); return; }
    onOpenChange(false);
  }

  // 将同一个 requestClose 用于关闭按钮、Esc、遮罩、返回路径。
  // 确认丢弃时，清理草稿再关闭；取消确认则保持编辑状态。
  // 依赖组件库的 onEscapeKeyDown / onInteractOutside 回调正确拦截默认关闭。
}
```

以上是行为示意，不是完整可运行弹窗组件；实际应复用 Radix/Headless UI/项目已有无障碍实现。

## 参考实现：可撤销归档

[examples/undo-snackbar.tsx](../examples/undo-snackbar.tsx) 演示 Snackbar 展示期、撤销 API、失败反馈和超时清理。注意：Toast 关闭不等于不能再恢复；重要操作应确保服务端有可靠恢复机制。
