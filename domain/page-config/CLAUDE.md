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
- `SectionType` currently only includes `hero` / `gallery` / `news` / `video`
- Legacy `links` sections are sanitized out in load/save/public rendering paths; do not reintroduce the type unless schema, editor, renderer, and docs all land together
- `cleanPageConfig` for `news` section items: only strips items where `src` is empty or blank; `href` is allowed to be empty (user may choose an image first and fill in the link later). The Zod schema in `lib/validation/pageConfigSchema.ts` also reflects this — `href` is `z.string().default("")` (optional). **Do not tighten this back to require `href` without a deliberate product decision.**
- `saveDraft` / `publish` in `hooks/usePageConfigActions.ts` uses a `configRef` pattern (useRef + useEffect sync) to always read the latest config at call time, avoiding stale closure bugs. Do not revert this to a direct `config` dependency in `useCallback`.

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
