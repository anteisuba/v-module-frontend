# Prisma Notes

## Scope

- Primary files:
  - `prisma/schema.prisma`
  - `prisma/migrations/`
  - `prisma/seed.ts`
  - helper SQL files in `prisma/`

## Current behavior

- The project uses PostgreSQL via Prisma
- `datasource db` uses `DATABASE_URL` and `DIRECT_URL`
- `Page` is a 1:1 extension of `User` and stores `draftConfig` / `publishedConfig` as `Json`
- `Product.images`, `Order.shippingAddress`, `NewsArticle.shareChannels`, and multiple page config fields are `Json`
- `Product.price`, `Order.totalAmount`, `OrderItem.price`, and `OrderItem.subtotal` are `Decimal`
- `MediaAsset`, `Order`, and `Page` are all user-owned in different ways; do not collapse those ownership semantics

## Editing rules

- Add new migrations for schema changes; do not rewrite historical migrations in place
- When a schema change alters runtime behavior, check whether `seed.ts` or helper SQL files need to move with it
- Audit API serialization for every `Decimal`, `Date`, and `Json` field that crosses a route boundary
- Keep these relationship assumptions explicit:
  - `Order.userId` is the seller owner
  - `Page.userId` is unique and 1:1 with `User`
  - `MediaAsset.userId` is optional but currently intended to point at the uploading user

## Verification

- Run `pnpm check`
- Review the migration plan manually before calling the change complete
- State clearly if a schema update was documented but no migration was executed in the current task
