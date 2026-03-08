---
name: change-playbook
description: Implement or refactor changes in this repository while following the local documentation, risk boundaries, and verification rules. Use when editing application code, API routes, Prisma schema, or project docs and you need the repo-specific workflow instead of a generic coding prompt.
---

# Change Playbook

Use this playbook to implement repo changes with the correct local context. Read [`../../../CLAUDE.md`](../../../CLAUDE.md) first, then load the relevant local `CLAUDE.md` before editing.

## Before editing

1. Identify the subsystem:
   - Auth / session
   - Page config / rendering
   - Shop / order API
   - Prisma / persistence
   - Documentation only
2. Read the matching local guide:
   - `lib/session/CLAUDE.md`
   - `domain/page-config/CLAUDE.md`
   - `app/api/shop/CLAUDE.md`
   - `prisma/CLAUDE.md`
3. Read [`../../../docs/zh-CN/agent/workflows.md`](../../../docs/zh-CN/agent/workflows.md) if the task spans multiple layers.

## Implementation rules

### Auth and session

- Keep `middleware.ts` and `lib/session/userSession.ts` aligned.
- Treat `/admin/*` protection and API authentication as separate concerns.
- Preserve intentional redirect behavior unless the task explicitly changes product semantics.

### Page config

- Keep section types, validation, editors, and renderers in sync.
- Preserve the distinction between `draftConfig` and `publishedConfig`.
- Re-check public page rendering whenever section structure changes.

### Shop and orders

- Do not conflate seller-side order management with visitor-side checkout.
- Keep ownership checks, status transitions, stock updates, and response serialization explicit.
- Revisit the public checkout gap if the task changes order creation semantics.

### Prisma

- Add new migrations; do not rewrite historical migration files.
- Audit `Decimal`, `Date`, and `Json` handling in any route that returns Prisma data.
- Re-check `seed.ts` and supporting SQL only when the schema change makes them stale.

### Documentation

- Keep root `CLAUDE.md` short and navigational.
- Keep `docs/zh-CN/agent/*` as AI quick context, not as a second canonical backlog.
- Update long-form docs when product behavior, current status, or priorities changed.

## Verification

- TypeScript / React / API changes: run `pnpm check`
- Prisma changes: run `pnpm check` and perform migration-context review
- Documentation-only changes: perform link and path self-check
- `pnpm lint` is advisory only until the repository baseline is repaired

## Handoff

- Summarize what changed, which docs were synced, and which checks ran.
- If a check was skipped, state that explicitly.
