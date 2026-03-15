---
name: repo-handoff
description: Continue unfinished work in this repository using the latest root `*-handoff.md`, or create/update a handoff file for the next AI agent. Use when resuming prior work, asking for current status or next steps, or requesting a handoff summary for a new session.
---

# Repo Handoff

Use this skill to keep session continuity cheap and concrete.

## Before continuing existing work

1. Read [`../../../AGENTS.md`](../../../AGENTS.md).
2. If the repo root contains one or more `*-handoff.md` files, read the newest one first.
3. Verify the handoff against current repo state with:
   - `git status --short`
   - `git diff --stat`
4. If the handoff conflicts with the current tree, trust the tree and note the mismatch.

## When writing a handoff

- Write to `./{yymmdd}-handoff.md` in the repo root.
- Overwrite the same-day handoff instead of creating multiple same-day variants.
- Base the summary on concrete artifacts already visible in the repo or verified in this session:
  - changed files
  - tests or checks actually run
  - docs or TODO items already updated
  - open questions that still block completion
- Keep the structure fixed:
  - `## 1. 当前任务目标`
  - `## 2. 当前进展`
  - `## 3. 关键上下文`
  - `## 4. 关键发现`
  - `## 5. 未完成事项`
  - `## 6. 建议接手路径`
  - `## 7. 风险与注意事项`
  - `## 下一位 Agent 的第一步建议`

## Content rules

- Optimize for the next agent's execution speed, not for storytelling.
- Prefer exact file paths, route names, functions, commands, test names, statuses, and decisions.
- Separate confirmed facts from inference.
- Call out verification precisely:
  - If a command ran, record the result.
  - If a command did not run, say `未复核`.
- Do not dump stale project history if it does not change the next step.

## Repo-specific reminders

- Keep root docs short; use the handoff for transient session state, not as a new canonical doc layer.
- If behavior or priorities changed, sync canonical docs such as `docs/zh-CN/overview/current-status.md` and `docs/zh-CN/overview/backlog.md`.
- For shop or order work, keep seller admin semantics separate from public checkout semantics.
