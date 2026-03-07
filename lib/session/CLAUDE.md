# Session Notes

## Scope

- Primary files: `lib/session/userSession.ts`, `middleware.ts`
- Related paths: `app/api/user/`, `/admin/*`

## Current behavior

- `userSessionOptions` uses `iron-session` with cookie name `vtuber_user_session`
- `getUserSession()` awaits `cookies()` because the current Next.js version exposes async cookies
- `middleware.ts` protects all `/admin/*` routes except:
  - `/admin`
  - `/admin/register`
  - `/admin/forgot-password`
  - `/admin/reset-password`
- Middleware does not protect `/api/*`; API handlers must call `getServerSession()` explicitly when they need auth

## Editing rules

- Keep `UserSession` shape, middleware checks, and API-side session reads aligned
- If you change login or protection semantics, inspect:
  - `middleware.ts`
  - `lib/session/userSession.ts`
  - relevant `app/api/user/*` routes
  - admin page redirect behavior
- Do not silently change cookie name or options without checking logout and redirect behavior
- Missing `SESSION_PASSWORD` currently degrades into redirect behavior in middleware; treat that as intentional until the product decision changes

## Verification

- Confirm protected `/admin/*` pages still redirect as intended
- Confirm public admin exceptions still remain reachable without auth
- Run `pnpm check` for code changes here
