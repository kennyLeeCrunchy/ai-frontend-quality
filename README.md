# AI Frontend Quality Skill · v1.4.3

适合 Codex / Claude Code / Cursor（支持 Agent Skills 的运行方式）在开发或审查 AI 客户端与 Web 工作台时使用。

## 包内结构

```text
ai-frontend-quality/
├── SKILL.md                   # 激活条件、流程、强制原则、按需索引
├── README.md                  # 安装与使用
├── references/
│   ├── requirements-and-component-choice.md
│   ├── visual-polish.md
│   ├── layout-and-responsive.md
│   ├── pointer-hit-targets.md
│   ├── render-and-state-diagnostics.md
│   ├── async-nonblocking-ux.md
│   ├── backend-sse-contract.md
│   ├── verification-matrix.md
│   ├── desktop-chat-microinteractions.md
│   ├── desktop-resizable-and-shell.md
│   ├── ludi-review-and-safety-notes.md
│   └── sources.md
├── examples/
│   ├── workspace-layout.css
│   ├── react-stability.tsx
│   ├── task-manager.ts
│   ├── task-ui.tsx
│   ├── undo-snackbar.tsx
│   ├── ime-composer.tsx
│   ├── chat-scroll-follow.tsx
│   ├── file-name-chip.tsx
│   ├── resizable-workspace.tsx
│   ├── desktop-detail-tokens.css
│   └── playwright-stability.spec.ts
└── scripts/
    └── audit-ui.py
```

## 安装

1. 解压 ZIP，保留整个 `ai-frontend-quality` 文件夹结构（不要只拿 SKILL.md；references 和 examples 会一起被引用）。
2. 根据所用 Agent，放到相应 Skills 目录。可直接把 ZIP 发给 Codex/Claude Code，让它代为安装并确认已识别。
   - Codex 项目级：`项目/.agents/skills/ai-frontend-quality/SKILL.md`。部分版本还采用 `.codex/skills` 或用户目录 `$CODEX_HOME/skills`；具体以当前 Codex 安装/文档为准，不要重复安装同名两份。
   - Claude Code 项目级：`项目/.claude/skills/ai-frontend-quality/SKILL.md`。
   - Claude Code 用户级：`~/.claude/skills/ai-frontend-quality/SKILL.md`（Windows 一般为 `%USERPROFILE%\.claude\skills\ai-frontend-quality\SKILL.md`）。
   - Cursor：若环境可读取 Agent Skills，可放在它支持的 Skills 目录；否则把 `SKILL.md` 作为规则入口并保持相对引用可读，不应假设任何 Cursor 版本自动支持相同路径。
3. 重启会话或触发 Skills 重新扫描。在新会话中要求 Agent 检查能否读取此 SKILL.md 与一个 reference 文件。

## 让 Agent 自己装（推荐）

将压缩包交给编码 Agent，然后说：

> 把这个 `ai-frontend-quality` Skill 按你当前环境支持的项目级 Skill 路径安装，保留 references/examples/scripts 全部文件；不要覆盖已有同名 Skill；验证 frontmatter 和引用路径可读，随后对当前项目做一次诊断式 UI/UX 审查，先出问题清单和不确定的关键需求，不要立刻大规模改版。

## 使用示例

- “按 ai-frontend-quality 审查多栏工作台的文字溢出和侧栏挤压。”
- “切换对话时 SSE 经常中断，诊断并修复，不要影响其他对话。”
- “需求不明确时先跟我确认应该用 Drawer、Modal 还是独立页面。”
- “AI 生成过程中全屏 Loading，改为局部非阻塞交互，并补回归测试。”
- “参考 Ludi 的五个视觉质感要点，但不要改变已有品牌风格。”

## 备注

- `examples/` 是 **参考代码**，不是无需调整就能集成的完整项目；其中 FastAPI 端点合约为伪代码。
- `scripts/audit-ui.py` 只是寻找可疑写法的静态扫描器，不能替代 DevTools/Profiler 的根因诊断。
- Skill 本身只是行为指引，不会在代码或浏览器层面强制拦截开发行为。

## v1.1 新增内容（作者新视频与开源 Skill）

- IME 组字安全发送、正在输出时尊重滚动阅读意图。
- 避免多重可见描边、同心圆角、文件名后缀始终可辨。
- 可拖拽分屏：比例/最小宽度、键盘控制、Escape 取消、折叠与恢复。
- 桌面应用专属：阴影裁切、Scroll-Driven Animations、多窗口状态边界；这些都是**按需使用**，不是所有 Web 项目强制加入。
- 对作者 500ms IME、CSS 0% CPU、clip-audit 零告警等主张做了适用条件与验证提醒。原始仓库及 MIT 许可见 [Ludi-Herry/desktop-agent-ui](https://github.com/Ludi-Herry/desktop-agent-ui)，本包不包含其原版脚本。

**升级注意**：从 v1.0 升级时，先备份本地可能修改过的 Skill，然后替换 `ai-frontend-quality/` 整个目录；不要把两个版本的同名 Skill 同时安装。作者原版 `desktop-agent-ui` 也可以作为单独 Skill 安装，但建议避免在同一任务里强制加载两份互相重叠的规则。

## v1.3 新增内容（异步加载与内容切换）

- 刷新、切换工作区时优先保留仍有效的内容；必要时尽早展示贴合布局的局部 skeleton。
- 内容就绪后可用克制的淡入淡出衔接，不阻塞操作；快速请求避免闪烁，并遵循 `prefers-reduced-motion`。
- 补充 Apple HIG Loading 与 Motion 官方参考，并注明动效时长属于项目验证项，不是 Apple 规定值。

## v1.4 新增内容（移动端点击区域）

- 增加移动端适配参考：区分视觉范围和真实可点击范围，定位点击死区、透明层拦截与相邻控件误触。
- 结合触控目标尺寸、滚动手势和键盘可达性检查；尺寸依据与视频观点分别标注来源。

## v1.4.1 补充（桌面端点击区域）

- 同一 reference 现覆盖桌面鼠标、触控板和移动触屏；检查视觉边界、hover、真实命中区及嵌套操作是否一致。

## v1.4.2 补充（触觉反馈与统一加载）

- 在命中区 reference 中加入离散事件的震动反馈、关闭与降级方式，并标明 Web API 的支持限制。
- 在总原则中补充同一视图相关 skeleton 的统一释放和同步淡入淡出。

## v1.4.3 修订（审查反馈）

- 统一加载补上空态、错误与慢请求的退出路径；简单界面修复按需选择步骤，任务复杂度分档只用于异步任务。
- 修正任务示例中的重试幂等键与用户可见错误文案；静态扫描器遍历时跳过依赖和构建目录。
