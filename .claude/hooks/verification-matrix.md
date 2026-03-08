# Verification Matrix

| Change type | Minimum check | Optional check | Notes |
| --- | --- | --- | --- |
| TypeScript / React / API | `pnpm check` | `pnpm build`, targeted manual path test | Use this for `app/`, `features/`, `components/`, `domain/`, `lib/` changes |
| Prisma / schema / migration | `pnpm check` + migration context review | Targeted Prisma command or local smoke test | Do not edit historical migrations in place |
| Session / auth | `pnpm check` + manual redirect / auth-path reasoning | Targeted admin login smoke test | Re-check `middleware.ts` and `lib/session/` together |
| Upload / env | `pnpm check` + env/path review | Targeted upload smoke test | Confirm local and R2 branches both still make sense |
| Documentation only | Link and path self-check | None | Ensure short-entry docs do not duplicate canonical long docs |

## Current non-gates

- `pnpm lint` is reference-only for now because the repository baseline is already failing.
- There is no mandatory automated test command yet because test files are currently absent.
