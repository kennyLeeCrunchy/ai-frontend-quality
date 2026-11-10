# 按需参考：数据展示、首次使用与权限

只在任务涉及下列场景时读取对应小节。普通页面设计、样式调整和其他前端任务可跳过本文件。

## 列表表格与图表

- 按任务选呈现方式。扫描单条记录用列表，比较多项字段或查精确值用表格，看趋势或分布用图表。表头写清字段和必要的单位。支持排序时标出当前列与方向。
- 区分当前查看的行与批量选中的行。批量操作前明确显示选中数量。涉及分页或筛选时，说明操作作用于当前页、当前选中项还是全部匹配项。
- 重要图表提供一句能独立理解的摘要，注明范围和单位。需要读具体数值时，提供可访问的明细或数据表。多个数据系列可结合标签、标记或线型区分。

参考 [Apple HIG · Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) 和 [Charts](https://developer.apple.com/design/human-interface-guidelines/charts)。

## 首次使用与权限请求

- 先给可直接使用的默认体验。需要说明时，优先在相关操作旁提供简短提示。可选教程允许跳过，跳过后可从帮助入口重新打开。
- 通常在用户首次使用依赖该权限的功能时提出请求，说明用途。例如点击「录音」后，再说明麦克风用于录制本条音频。若缺少权限会让产品无法完成核心任务，可在必要的初始化步骤说明。
- 用户拒绝或后来撤销权限时，仅影响依赖它的功能。根据实际能力提供替代入口或重新授权指引，并以系统、浏览器或服务端实际权限状态控制访问。

参考 [Apple HIG · Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) 和 [Apple Developer · Requesting access to protected resources](https://developer.apple.com/documentation/uikit/requesting-access-to-protected-resources)。
