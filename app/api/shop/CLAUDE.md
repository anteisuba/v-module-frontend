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
  - `docs/zh-CN/development/payment-gateway-plan.md`

## Current behavior

- `GET /api/shop/orders` is seller-only, filters by the logged-in user's `userId`, and supports `status` / `query` filtering plus `export=csv`; exported CSV now includes Stripe Connect routing snapshot fields such as `paymentRoutingMode`, `connectedAccountId`, charge / transfer IDs, and fee / seller net amounts
- `GET /api/shop/orders/[id]` supports seller session lookup and public buyer lookup via `buyerEmail`
- `POST /api/shop/checkout` is the public visitor checkout entry, derives the seller from published products, reserves stock, and creates a Stripe Checkout Session
- `POST /api/payments/stripe/webhook` confirms Stripe payment outcomes and updates order/payment state
- `POST /api/shop/orders` no longer creates orders; it returns `405` to keep seller admin semantics explicit
- `PUT /api/shop/orders/[id]` is seller-only, stamps status timestamps, and blocks manually marking Stripe awaiting-payment orders as paid
- Buyer confirmation + seller new-order notifications are sent after Stripe payment is confirmed; order status changes still send buyer notification emails when mail is configured
- `domain/shop/services.ts` treats `userId` on orders as the seller owner, not the buyer
- Order creation runs inside a Prisma transaction and decrements stock immediately

## Editing rules

- Distinguish seller admin behavior from visitor checkout behavior before changing any order logic
- Public order-detail lookup must keep an explicit buyer proof such as `buyerEmail`; do not make order IDs alone publicly readable
- Keep seller-side search / filter / export semantics on `GET /api/shop/orders`; do not move visitor checkout behavior back onto that route
- Mail delivery must not roll back successful order creation or status updates; log failures and keep the main action successful
- If you change order creation semantics, inspect both the public checkout path and the dedicated checkout API contract
- Keep seller/admin semantics separate from payment-provider state, and treat Stripe webhook events as the only source of truth for moving Stripe orders into `PAID`
- Keep ownership checks explicit on product and order mutations
- Serialize `Decimal`, `Date`, and nested order item data before returning API responses
- Re-check status transitions when editing `AWAITING_PAYMENT`, `PAID`, `SHIPPED`, or `DELIVERED` handling

## Verification

- Run `pnpm check`
- Re-check route and service behavior together, not in isolation
- If the change affects checkout or order-management semantics, sync `docs/zh-CN/overview/current-status.md`, `docs/zh-CN/overview/backlog.md`, and `docs/zh-CN/development/routes-and-api.md`
