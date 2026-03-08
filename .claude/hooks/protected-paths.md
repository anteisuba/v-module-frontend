# Protected Paths

## Auth and session

- Paths: `middleware.ts`, `lib/session/`, `app/api/user/`
- Check before editing:
  - Public `/admin` exceptions still match product intent
  - `getServerSession()` and middleware behavior stay aligned
  - Redirect and unauthorized response behavior remain intentional
- Local guide: [`../../lib/session/CLAUDE.md`](../../lib/session/CLAUDE.md)

## Page configuration

- Paths: `domain/page-config/`, `features/page-renderer/`, `components/ui/*Editor*`, `app/api/page/`
- Check before editing:
  - Section types, validation, editors, and renderers remain in sync
  - `draftConfig` and `publishedConfig` semantics are preserved
- Local guide: [`../../domain/page-config/CLAUDE.md`](../../domain/page-config/CLAUDE.md)

## Shop and orders

- Paths: `app/api/shop/`, `domain/shop/`, `app/u/[slug]/shop/`
- Check before editing:
  - Seller-side admin flows and visitor-side checkout flows are not conflated
  - Ownership checks, stock changes, and response serialization stay correct
- Local guide: [`../../app/api/shop/CLAUDE.md`](../../app/api/shop/CLAUDE.md)

## Prisma and persistence

- Paths: `prisma/`, `lib/prisma.ts`
- Check before editing:
  - Existing migrations are not rewritten
  - `Json` and `Decimal` fields are handled intentionally
  - Seed assumptions remain valid
- Local guide: [`../../prisma/CLAUDE.md`](../../prisma/CLAUDE.md)

## Upload and storage

- Paths: `app/api/page/me/upload/route.ts`, `lib/env.ts`, `public/uploads/`
- Check before editing:
  - Local filesystem and R2 branches still make sense
  - Required environment variables and deployment behavior are explicit
