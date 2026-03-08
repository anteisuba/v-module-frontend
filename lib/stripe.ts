import Stripe from "stripe";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe Checkout is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured");
  }

  return webhookSecret;
}

export function getStripeCurrency() {
  return (process.env.STRIPE_CURRENCY || "JPY").toLowerCase();
}

export function toStripeAmount(amount: number, currency: string) {
  const normalizedCurrency = currency.toLowerCase();

  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    const rounded = Math.round(amount);

    if (Math.abs(rounded - amount) > 0.000001) {
      throw new Error(`${currency.toUpperCase()} checkout requires whole-number prices`);
    }

    return rounded;
  }

  return Math.round(amount * 100);
}

export function getStripeId(
  value:
    | string
    | Stripe.PaymentIntent
    | Stripe.Response<Stripe.PaymentIntent>
    | null
) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}
