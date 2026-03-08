# Shop API Notes

## Scope

- Primary files:
  - `app/api/shop/checkout/route.ts`
  - `app/api/shop/orders/route.ts`
  - `app/api/shop/orders/[id]/route.ts`
  - `app/api/shop/products/route.ts`
  - `app/api/shop/products/[id]/route.ts`
- Related files:
  - `domain/shop/services.ts`
  - public shop routes under `app/u/[slug]/shop/`

## Current behavior

- `GET /api/shop/orders` is seller-only, filters by the logged-in user's `userId`, and now supports `status` / `query` filtering plus `export=csv`
- `GET /api/shop/orders/[id]` supports seller session lookup and public buyer lookup via `buyerEmail`
- `POST /api/shop/checkout` is the public visitor checkout entry and derives the seller from published products
- `POST /api/shop/orders` no longer creates orders; it returns `405` to keep seller admin semantics explicit
- `PUT /api/shop/orders/[id]` is seller-only and stamps status timestamps
- Order creation sends buyer confirmation + seller new-order notifications when mail is configured
- Order status changes send buyer notification emails when mail is configured
- `domain/shop/services.ts` treats `userId` on orders as the seller owner, not the buyer
- Order creation runs inside a Prisma transaction and decrements stock immediately

## Editing rules

- Distinguish seller admin behavior from visitor checkout behavior before changing any order logic
- Public order-detail lookup must keep an explicit buyer proof such as `buyerEmail`; do not make order IDs alone publicly readable
- Keep seller-side search / filter / export semantics on `GET /api/shop/orders`; do not move visitor checkout behavior back onto that route
- Mail delivery must not roll back successful order creation or status updates; log failures and keep the main action successful
- If you change order creation semantics, inspect both the public checkout path and the dedicated checkout API contract
- Keep ownership checks explicit on product and order mutations
- Serialize `Decimal`, `Date`, and nested order item data before returning API responses
- Re-check status transitions when editing `PAID`, `SHIPPED`, or `DELIVERED` handling

## Verification

- Run `pnpm check`
- Re-check route and service behavior together, not in isolation
- If the change affects checkout or order-management semantics, sync `docs/zh-CN/overview/current-status.md`, `docs/zh-CN/overview/backlog.md`, and `docs/zh-CN/development/routes-and-api.md`
