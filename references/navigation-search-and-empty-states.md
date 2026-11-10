# 导航、搜索与空状态

## 区分导航、局部切换和操作

- 用侧栏或顶层标签进入不同区域，用分段控件切换同一视图的相关模式，例如「列表／网格」。「新建」「导出」等操作放在任务对应的操作区。
- 标出当前位置。顶层栏目暂时没有内容时，通常保留用户熟悉的入口，在栏目内解释原因并提供下一步。切换区域后，按任务需要恢复之前的筛选、选中项或滚动位置。
- 窄窗下可以改变导航呈现方式，保持当前区域与其他入口可辨认。工具栏降级见 [layout-and-responsive.md](layout-and-responsive.md#窄窗口工具栏)。

参考 [Apple HIG · Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) 和 [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)。

## 搜索范围和筛选条件

- 让用户看得出当前在搜什么范围，例如「当前项目／全部项目」。已生效的筛选应可见、可移除。
- 没有结果时保留查询和筛选，方便用户改词、清除条件或扩大范围。查询失败时保留这些输入，重试沿用同一组条件。

## 区分三种无内容状态

| 状态 | 说明和下一步 |
|---|---|
| 还没有内容 | 说明当前区域为何为空，提供与任务相关的入口，例如「新建项目」。 |
| 没有匹配结果 | 显示当前搜索词或筛选条件，按场景提供「清除筛选」或「扩大搜索范围」。 |
| 加载失败 | 在受影响区域说明内容暂时无法加载，提供重试或可用的恢复操作。 |

参考 [Apple HIG · Searching](https://developer.apple.com/design/human-interface-guidelines/searching) 和 [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)。

只有涉及首次使用、教程或权限请求时，再读 [首次使用与权限请求](specialized-page-patterns.md#首次使用与权限请求)。
