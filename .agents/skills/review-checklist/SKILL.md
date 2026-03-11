---
name: review-checklist
description: Review code changes in this repository with project-specific risk checks. Use when reviewing pull requests, diffs, or local edits that touch authentication, shop or order flows, page configuration, Prisma models, upload logic, or API route serialization.
---

# Review Checklist

Review repository changes with the local risk model, not with a generic web-app checklist. Start from [`../../../AGENTS.md`](../../../AGENTS.md), then read the relevant local `AGENTS.md` before judging a diff.

## Review flow

1. Map the touched files to one of the risky areas:
   - Auth and session: `middleware.ts`, `lib/session/`, `app/api/user/`
   - Page config: `domain/page-config/`, `features/page-renderer/`, `components/ui/*Editor*`, `app/api/page/`
   - Shop and orders: `app/api/shop/`, `domain/shop/`, `app/u/[slug]/shop/`
   - Prisma and persistence: `prisma/`, `lib/prisma.ts`
   - Upload and env: `app/api/page/me/upload/route.ts`, `lib/env.ts`
2. Read the corresponding local guide:
   - `lib/session/AGENTS.md`
   - `domain/page-config/AGENTS.md`
   - `app/api/shop/AGENTS.md`
   - `prisma/AGENTS.md`
3. Check behavior regressions first, then missing verification, then missing documentation sync.

## Repository-specific review checks

### Auth and session

- Confirm `/admin/*` protection still matches the explicit public exceptions in `middleware.ts`.
- Confirm API auth still uses `getServerSession()` intentionally; middleware does not protect `/api/*`.
- Confirm redirect behavior, cookie semantics, and unauthorized responses remain coherent.

### Page config and rendering

- Confirm section changes stay synchronized across `types.ts`, `pageConfigSchema.ts`, CMS editors, and `features/page-renderer/registry.tsx`.
- Flag any diff that changes `draftConfig` or `publishedConfig` semantics without updating both admin and public paths.
- Treat `links` support as a known sharp edge because the type exists while the renderer currently returns `null`.

### Shop and orders

- Distinguish seller-side admin flows from visitor-side checkout flows.
- Check ownership validation, stock updates, transaction boundaries, and order-status timestamps.
- Check API responses for `Decimal`, `Date`, and nested item serialization before they leave Prisma objects.

### Prisma and persistence

- Reject edits that rewrite historical migrations unless the task explicitly requires it.
- Check `Json` fields and relation ownership carefully, especially `Page`, `Order`, `Product`, `MediaAsset`, and upload-related data.
- Confirm any schema-shape change is reflected in seed assumptions and route handlers.

### Upload and env

- Confirm local filesystem and R2 branches still have valid behavior and explicit failure modes.
- Confirm new environment variables are validated or documented when required.

## Review output

- Lead with concrete findings and file references.
- Prioritize bugs, regressions, missing edge-case handling, and missing tests over style comments.
- Call out missing doc sync when behavior, priorities, or operational assumptions changed.
