# AI Frontend Quality Skill

**English** | [简体中文](README.zh-CN.md)

**Build AI-powered interfaces that stay responsive, stable, and usable while work happens in the background.**

An open-source Agent Skill for designing, reviewing, and improving web and AI application frontends. It helps coding agents diagnose UI problems, choose appropriate interaction patterns, and implement changes without introducing unnecessary complexity.

**Version:** 1.4.6 · **License:** MIT

Designed for **Codex**, **Claude Code**, and **Cursor** when they support Agent Skills or an equivalent way to load local instructions. Exact installation and activation behavior depends on your agent version and configuration.

## Why this skill?

AI applications have UI challenges that go beyond ordinary loading spinners:

- A streaming response should not block navigation or unrelated actions.
- Switching conversations should not accidentally cancel a generation task.
- Unmounting a component, disconnecting an SSE stream, and cancelling a backend task are different operations.
- Re-renders, remounts, full-page reloads, and refetches have different causes and fixes.
- Long text, localization, right-to-left layouts, sidebars, and scrollbars should not break the interface.
- Component choices should follow user needs and risk—not a blanket rule to use modals, drawers, or animations.

The skill emphasizes **understanding the requirement and identifying the root cause before modifying code**. It follows the host project's existing framework, design system, accessibility requirements, and architectural constraints.

## What it covers

| Area | Guidance |
| --- | --- |
| Requirements and interaction choices | Decide when to ask clarifying questions; choose between dialogs, drawers, bottom sheets, inline feedback, undo, and other patterns. |
| Async and non-blocking UX | Scope loading and disabled states correctly; keep unrelated UI interactive; select task lifecycle designs proportionate to the app. |
| AI chat and streaming | Handle SSE subscriptions, background generation, conversation switching, stale responses, retries, and task cancellation semantics. |
| Rendering and state | Distinguish reload, remount, re-render, and refetch; maintain stable identity and state ownership. |
| Layout and responsive design | Handle shrinking flex/grid children, text overflow, scrollbars, sidebars, localization, and RTL/bidirectional text. |
| Desktop and mobile interactions | Address input-method composition, scroll-follow behavior, pointer hit targets, resizable panels, and desktop window details. |
| Visual polish | Improve hierarchy, loading transitions, spacing, borders, motion, and reduced-motion support without imposing a visual style. |
| Verification | Choose focused regression checks, relevant viewport/input conditions, and evidence-based diagnostics. |

**Scope:** Frontend design, implementation, and review for web apps, AI chat clients, and agent workspaces. It is **not** intended for unrelated backend-only tasks.

## Package structure

```text
ai-frontend-quality/
├── SKILL.md                        # Activation criteria, workflow, and core principles
├── README.md                       # Installation and usage guide
├── README.zh-CN.md                 # Chinese installation and usage guide
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

The `references/` files are loaded selectively for the task. The `examples/` files are **adaptable reference implementations**, not a ready-to-run application or drop-in production components.

## Installation

### 1. Download the skill

Download the repository ZIP or clone the repository. Keep the **entire `ai-frontend-quality/` folder** intact, including `references/`, `examples/`, and `scripts/`. Copying only `SKILL.md` will break its relative references.

### 2. Place it in your agent's skill directory

Common project-level locations:

| Agent | Example location |
| --- | --- |
| Codex | `<project>/.agents/skills/ai-frontend-quality/SKILL.md` |
| Claude Code | `<project>/.claude/skills/ai-frontend-quality/SKILL.md` |
| Cursor | A supported Agent Skills directory, if available in your version |

For Claude Code user-level installation, a common location is `~/.claude/skills/ai-frontend-quality/SKILL.md` (on Windows, `%USERPROFILE%\.claude\skills\ai-frontend-quality\SKILL.md`). Codex configurations may also use `$CODEX_HOME/skills` or a version-specific directory. Follow your installed agent's current documentation; avoid installing duplicate copies with the same skill name at the same scope.

If Cursor does not automatically discover Agent Skills in your setup, you may load `SKILL.md` through its supported rules/instructions mechanism, while preserving the relative reference paths.

### 3. Verify discovery

Restart the agent session or trigger a skills refresh, then ask it to confirm that it can read `SKILL.md` and one file from `references/`.

### Updating an existing installation

Back up any local changes, then **replace the entire existing skill directory** with the new version. Do not merge ZIP contents into an older copy: outdated references or examples may otherwise remain. Keep only one copy of the skill in the same scope.

## Let your coding agent install it

You can attach the ZIP to a coding agent and use this prompt:

> Install the `ai-frontend-quality` skill at the project-level path supported by this environment. If an older copy exists, back up any local modifications and replace the entire skill directory. Preserve `SKILL.md`, `references/`, `examples/`, and `scripts/`. Verify the frontmatter and relative reference paths, then perform a diagnostic UI/UX review of the current project. Do not make unrelated changes.

## Example prompts

- "Use `ai-frontend-quality` to review overflow and sidebar compression in this multi-panel workspace."
- "Switching conversations sometimes interrupts an SSE response. Diagnose the lifecycle and fix it without blocking other chats."
- "Before deciding between a drawer, modal, or separate page, ask me only the questions that materially affect the interaction."
- "Replace the full-screen loading lock during AI generation with appropriately scoped, non-blocking feedback and focused regression tests."
- "Check this checkout UI with long German translations and Arabic RTL content, then fix overflow and directionality issues."
- "Apply the relevant UI-detail guidance while preserving the product's existing brand style."

## Design principles

1. **Local busy state ≠ global lock.** Disable only actions that genuinely conflict with the operation in progress.
2. **UI lifecycle ≠ task lifecycle.** Unsubscribing from a stream must not implicitly cancel the backend job. Reliable execution across refreshes or devices requires backend support.
3. **Diagnose before optimizing.** A re-render, remount, reload, and refetch are not interchangeable.
4. **Preserve stable state and identity.** Separate UI state, server state, and task state; use stable business IDs as keys; prevent stale results from overwriting newer state.
5. **Respect user intent.** Do not hijack the scroll position while the user reads earlier messages; avoid sending messages during IME composition; allow collapsed layouts to be restored.
6. **Prefer proportional solutions.** Do not introduce distributed task infrastructure for a simple button spinner, or large new dependencies for a small UI fix.
7. **Validate in context.** Test the actual input method, viewport, task state, accessibility behavior, and project constraints that matter to the change.

## Important limitations

- This is a **guidance skill**, not a runtime guardrail. It cannot enforce correct behavior in a browser or application by itself.
- `scripts/audit-ui.py` is a lightweight static heuristic scanner. Its warnings are prompts for investigation, not confirmed root causes; use appropriate browser tools and profilers to verify issues.
- Files under `examples/` illustrate patterns and require adaptation. Some FastAPI/SSE contract examples are pseudocode, and some Playwright cases describe verification work rather than supplying a complete runnable test suite.
- UI durations, visual tokens, and patterns referenced from videos or open-source projects are **starting points**, not universal standards. Honor accessibility and `prefers-reduced-motion`.
- The package discusses the open-source [Ludi-Herry/desktop-agent-ui](https://github.com/Ludi-Herry/desktop-agent-ui) work and its MIT license. **It does not bundle the author's original scripts.** If using that skill separately, avoid imposing two overlapping rule sets on the same task without reconciling them.

## Release notes

**v1.4.6 — Localization and RTL layouts**
- Added rules for long translations, flexible sizing, and testing with the longest relevant content.
- Added RTL and bidirectional-text checks, CSS logical properties, and links to MDN/W3C references.

**v1.4.5 — Consistent examples and installation**
- Clarified when scroll-follow should resume after users scroll away from the latest message.
- Made the optional post-IME composition guard opt-in pending testing with target input methods.
- Distinguished fresh installations from upgrades and recommended replacing the complete folder.

**v1.4.4 — Contract and example review**
- Streamlined skill activation text and standardized safe error messaging.
- Improved cancellation-state handling in task examples and replaced incomplete Playwright placeholders with acceptance checklists.

**v1.4.3 — Rules and examples review**
- Clarified loading exit paths for empty, error, and slow-request states.
- Kept simple UI fixes lightweight; reserved task-complexity tiers for asynchronous workflows.
- Improved retry/idempotency examples and excluded build/dependency folders from the static scanner.

**v1.4.2 — Haptics and coordinated loading**
- Added optional haptic feedback guidance and browser-support caveats.
- Clarified coordinated skeleton release for related UI regions.

**v1.4.1 — Desktop pointer targets**
- Extended hit-target guidance to mouse and trackpad interactions as well as touchscreens.

**v1.4 — Mobile hit targets**
- Added guidance on actual clickable areas, overlapping hit regions, accidental touches, and touch ergonomics.

**v1.3 — Async loading and content transitions**
- Prioritized preserving valid existing content and using layout-matched local skeletons where needed.
- Added restrained content transitions, fast-request flicker avoidance, and reduced-motion guidance.

**v1.1 — Desktop chat microinteractions**
- Added IME-safe sending, streaming scroll behavior, restrained borders, concentric corners, filename suffix preservation, and restorable split panes.
- Added desktop window and multi-window guidance with explicit cautions about unverified performance and behavior claims.

## License and attribution

Released under the [MIT License](LICENSE). See [sources.md](references/sources.md) for design and engineering references and [ludi-review-and-safety-notes.md](references/ludi-review-and-safety-notes.md) for implementation caveats and attribution notes.

**Source repository:** https://github.com/kennyLeeCrunchy/ai-frontend-quality
