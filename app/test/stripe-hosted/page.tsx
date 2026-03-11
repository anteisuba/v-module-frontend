import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StripeHostedCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    cancel?: string;
    session_id?: string;
  }>;
}) {
  if (process.env.E2E_BYPASS_AUTH !== "1") {
    notFound();
  }

  const params = await searchParams;
  const successUrl = params.success;
  const cancelUrl = params.cancel;
  const sessionId = params.session_id ?? "cs_e2e_local";

  if (!successUrl || !cancelUrl) {
    notFound();
  }

  return (
    <main
      data-testid="stripe-hosted-checkout-page"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
          Stripe Hosted Checkout
        </p>
        <h1 className="mt-4 text-4xl font-semibold">E2E payment redirect simulator</h1>
        <p className="mt-4 text-sm text-white/70">
          This page exists only for Playwright. It simulates Stripe&apos;s hosted
          checkout return flow and keeps the redirect on the same origin so
          browser storage survives.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
          <div>
            Session: <span data-testid="stripe-hosted-session-id">{sessionId}</span>
          </div>
          <div className="mt-2 break-all">Success: {successUrl}</div>
          <div className="mt-1 break-all">Cancel: {cancelUrl}</div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href={successUrl}
            data-testid="stripe-hosted-success"
            className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Simulate success return
          </Link>
          <Link
            href={cancelUrl}
            data-testid="stripe-hosted-cancel"
            className="flex-1 rounded-2xl border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Simulate cancel return
          </Link>
        </div>
      </div>
    </main>
  );
}
