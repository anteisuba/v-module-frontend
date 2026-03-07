# Hooks Policy

## Current stance

- This repository documents hook policy before enabling executable hooks.
- The reason is operational, not philosophical: `pnpm lint` is currently not a stable gate and there is no automated test baseline yet.
- Until those two conditions improve, `.claude/hooks/` acts as deterministic guidance for humans and agents instead of auto-running enforcement.

## What this means

- Do not assume a formatter, test runner, or path guard will fire automatically.
- Read [`./protected-paths.md`](./protected-paths.md) before editing sensitive areas.
- Read [`./verification-matrix.md`](./verification-matrix.md) to choose the minimum required checks.

## Exit criteria for real hooks

- `pnpm lint` becomes a low-noise signal that can block changes.
- Core flows gain repeatable automated tests.
- Sensitive path rules are stable enough to enforce without generating constant false positives.
