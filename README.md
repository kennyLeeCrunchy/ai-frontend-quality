# AI Frontend Quality

> A practical Agent Skill for building beautiful, responsive, stable, and non-blocking AI applications.

AI Frontend Quality helps coding agents make better frontend decisions across visual design, interaction, responsive layout, rendering, state management, and asynchronous workflows. It is framework- and design-system-agnostic, and expands beyond desktop-only interfaces to AI-powered web applications and workspaces.

## What it covers

- UI/UX decisions, including choosing the right component and asking about requirements that materially affect the design.
- Responsive layouts, overflow, scroll behavior, and resizable workspaces.
- Diagnosing reloads, remounts, re-renders, and unnecessary refetches.
- Non-blocking loading states, SSE lifecycles, and keeping tasks alive while users switch conversations.
- Practical React, CSS, FastAPI-contract, and Playwright examples, plus a lightweight UI audit script.

## Repository layout

```text
ai-frontend-quality/
├── SKILL.md
├── README.md
├── LICENSE
├── references/   # Decision guidance and engineering notes
├── examples/     # Adaptable implementation examples
└── scripts/      # Lightweight static checks
```

## Install

Keep the complete directory so the skill can load its references and examples. For Codex on Windows, clone it into your user skills directory:

If that destination already exists, back it up or choose another path before cloning; Git will not overwrite an existing directory.

```powershell
git clone https://github.com/kennyLeeCrunchy/ai-frontend-quality.git "$env:USERPROFILE\.codex\skills\ai-frontend-quality"
```

For other Agent Skills-compatible tools, place this repository directory in the tool's supported skills directory. Avoid installing duplicate copies under the same name, then start a new session or refresh skill discovery.

## Use

Ask your coding agent to invoke `ai-frontend-quality`, for example:

> Review this AI workspace for text overflow, sidebar compression, and conversation-switching issues. Identify the likely causes and ask me about any important unclear requirements before making broad changes.

The skill is behavioral guidance for an agent. The included `scripts/audit-ui.py` is a heuristic static scanner, not a runtime guarantee or a substitute for browser testing and profiling. Examples are starting points, not drop-in production modules.

## Acknowledgments

This project draws inspiration from [desktop-agent-ui by Ludi-Herry](https://github.com/Ludi-Herry/desktop-agent-ui), particularly its desktop interaction patterns, visual design principles, and engineering practices.

AI Frontend Quality expands the scope to responsive web applications, component selection, rendering stability, state management, non-blocking asynchronous UX, and automated testing. It is independently maintained and is not a fork of the original repository.

The upstream project is licensed under MIT. This repository does not include its original audit script; see the upstream [README](https://github.com/Ludi-Herry/desktop-agent-ui) and [license](https://github.com/Ludi-Herry/desktop-agent-ui/blob/main/LICENSE). Any directly reused upstream material must retain its applicable copyright and license notices.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
