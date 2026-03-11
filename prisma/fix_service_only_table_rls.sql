-- Resolve Supabase `rls_disabled_in_public` warnings for internal tables.
--
-- Project-specific decision:
-- - This codebase uses Prisma + iron-session for these records.
-- - The flagged tables are not consumed directly from Supabase browser clients.
-- - Therefore they should remain service-only, even if they stay in the
--   `public` schema for Prisma compatibility.
--
-- Tables covered here:
-- - public.app_migrations
-- - public."AdminUser"
-- - public."SiteConfig"
-- - public."OrderPaymentAttempt"
-- - public."OrderRefund"
-- - public."PaymentSettlementEntry"
-- - public."PaymentSettlementPayout"
-- - public."OrderDispute"
--
-- Notes:
-- - RLS is enabled, but there are intentionally no anon/authenticated policies.
-- - `service_role` gets an explicit allow-all policy as a safe server-side path.
-- - Prisma/direct database connections owned by the table owner are not expected
--   to break because this script does not use FORCE ROW LEVEL SECURITY.

BEGIN;

-- ============================================================================
-- app_migrations
-- Internal migration bookkeeping used by scripts/apply-migrations.ts.
-- ============================================================================
ALTER TABLE public.app_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_migrations FROM anon, authenticated;
GRANT ALL ON TABLE public.app_migrations TO service_role;
DROP POLICY IF EXISTS "app_migrations service_role_all" ON public.app_migrations;
CREATE POLICY "app_migrations service_role_all"
ON public.app_migrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- AdminUser
-- Legacy/internal admin-auth table. No current browser-side access path.
-- ============================================================================
ALTER TABLE public."AdminUser" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AdminUser" FROM anon, authenticated;
GRANT ALL ON TABLE public."AdminUser" TO service_role;
DROP POLICY IF EXISTS "AdminUser service_role_all" ON public."AdminUser";
CREATE POLICY "AdminUser service_role_all"
ON public."AdminUser"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SiteConfig
-- Legacy/internal site configuration table. Current runtime reads hero defaults
-- from code, not directly from this table.
-- ============================================================================
ALTER TABLE public."SiteConfig" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."SiteConfig" FROM anon, authenticated;
GRANT ALL ON TABLE public."SiteConfig" TO service_role;
DROP POLICY IF EXISTS "SiteConfig service_role_all" ON public."SiteConfig";
CREATE POLICY "SiteConfig service_role_all"
ON public."SiteConfig"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- OrderPaymentAttempt
-- Payment internals are returned only through app-owned API routes after custom
-- session checks. Clients should not hit the base table directly.
-- ============================================================================
ALTER TABLE public."OrderPaymentAttempt" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."OrderPaymentAttempt" FROM anon, authenticated;
GRANT ALL ON TABLE public."OrderPaymentAttempt" TO service_role;
DROP POLICY IF EXISTS "OrderPaymentAttempt service_role_all" ON public."OrderPaymentAttempt";
CREATE POLICY "OrderPaymentAttempt service_role_all"
ON public."OrderPaymentAttempt"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- OrderRefund
-- Refund records are seller-scoped and exposed only through application routes.
-- ============================================================================
ALTER TABLE public."OrderRefund" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."OrderRefund" FROM anon, authenticated;
GRANT ALL ON TABLE public."OrderRefund" TO service_role;
DROP POLICY IF EXISTS "OrderRefund service_role_all" ON public."OrderRefund";
CREATE POLICY "OrderRefund service_role_all"
ON public."OrderRefund"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PaymentSettlementEntry
-- Stripe settlement ledger entries are seller-scoped and loaded via server APIs.
-- ============================================================================
ALTER TABLE public."PaymentSettlementEntry" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PaymentSettlementEntry" FROM anon, authenticated;
GRANT ALL ON TABLE public."PaymentSettlementEntry" TO service_role;
DROP POLICY IF EXISTS "PaymentSettlementEntry service_role_all" ON public."PaymentSettlementEntry";
CREATE POLICY "PaymentSettlementEntry service_role_all"
ON public."PaymentSettlementEntry"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PaymentSettlementPayout
-- Payout summaries are seller-scoped and loaded via server APIs.
-- ============================================================================
ALTER TABLE public."PaymentSettlementPayout" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PaymentSettlementPayout" FROM anon, authenticated;
GRANT ALL ON TABLE public."PaymentSettlementPayout" TO service_role;
DROP POLICY IF EXISTS "PaymentSettlementPayout service_role_all" ON public."PaymentSettlementPayout";
CREATE POLICY "PaymentSettlementPayout service_role_all"
ON public."PaymentSettlementPayout"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- OrderDispute
-- Chargeback/dispute data is operational back-office data, not client data.
-- ============================================================================
ALTER TABLE public."OrderDispute" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."OrderDispute" FROM anon, authenticated;
GRANT ALL ON TABLE public."OrderDispute" TO service_role;
DROP POLICY IF EXISTS "OrderDispute service_role_all" ON public."OrderDispute";
CREATE POLICY "OrderDispute service_role_all"
ON public."OrderDispute"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verification:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'app_migrations',
--     'AdminUser',
--     'SiteConfig',
--     'OrderPaymentAttempt',
--     'OrderRefund',
--     'PaymentSettlementEntry',
--     'PaymentSettlementPayout',
--     'OrderDispute'
--   )
-- ORDER BY tablename;
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'app_migrations',
--     'AdminUser',
--     'SiteConfig',
--     'OrderPaymentAttempt',
--     'OrderRefund',
--     'PaymentSettlementEntry',
--     'PaymentSettlementPayout',
--     'OrderDispute'
--   )
-- ORDER BY tablename, policyname;
