# Page Config Notes

## Scope

- Primary files: `domain/page-config/*`
- Related files:
  - `lib/validation/pageConfigSchema.ts`
  - `features/page-renderer/registry.tsx`
  - `app/api/page/*`
  - CMS editors under `components/ui/`

## Current behavior

- `Page` stores both `draftConfig` and `publishedConfig`
- Admin editing writes draft data; public `/u/[slug]` rendering reads published data
- `ensureUserPage()` seeds both configs with an empty baseline for first-time users
- `SectionType` still includes `links`, but `features/page-renderer/registry.tsx` currently returns `null` for that type

## Editing rules

- Treat section changes as cross-cutting changes
- If you add, remove, or rename a section type, sync at least:
  - `domain/page-config/types.ts`
  - `lib/validation/pageConfigSchema.ts`
  - `features/page-renderer/registry.tsx`
  - corresponding CMS editor components
  - docs describing current capabilities or known gaps
- Preserve the distinction between draft and published semantics unless the task explicitly changes product behavior
- Re-check `themeColor`, `fontFamily`, and metadata handling if you touch page-level config shape

## Verification

- Run `pnpm check`
- Smoke-check public rendering assumptions after section-shape changes
- Update `docs/zh-CN/overview/current-status.md` when product behavior changes
