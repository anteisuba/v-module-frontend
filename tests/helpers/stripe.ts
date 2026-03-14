export function createStripeCheckoutSessionEvent(options?: {
  type?:
    | "checkout.session.completed"
    | "checkout.session.async_payment_succeeded"
    | "checkout.session.async_payment_failed"
    | "checkout.session.expired";
  session?: Record<string, unknown>;
}) {
  const type = options?.type || "checkout.session.completed";

  return {
    type,
    data: {
      object: {
        object: "checkout.session",
        id: "cs_test_123",
        payment_status:
          type === "checkout.session.async_payment_failed" ||
          type === "checkout.session.expired"
            ? "unpaid"
            : "paid",
        payment_intent:
          type === "checkout.session.async_payment_failed" ||
          type === "checkout.session.expired"
            ? null
            : "pi_123",
        ...options?.session,
      },
    },
  };
}

export function createStripeDisputeEvent(options?: {
  type?:
    | "charge.dispute.created"
    | "charge.dispute.updated"
    | "charge.dispute.closed"
    | "charge.dispute.funds_withdrawn"
    | "charge.dispute.funds_reinstated";
  dispute?: Record<string, unknown>;
}) {
  return {
    type: options?.type || "charge.dispute.created",
    data: {
      object: {
        object: "dispute",
        id: "du_test_123",
        amount: 5000,
        currency: "jpy",
        status: "needs_response",
        reason: "fraudulent",
        charge: "ch_test_123",
        ...options?.dispute,
      },
    },
  };
}

export function createStripeConnectAccountEvent(options?: {
  type?:
    | "account.updated"
    | "account.external_account.created"
    | "account.external_account.updated"
    | "account.external_account.deleted";
  account?: string;
  object?: Record<string, unknown>;
}) {
  const type = options?.type || "account.updated";

  if (type === "account.updated") {
    return {
      type,
      data: {
        object: {
          object: "account",
          id: options?.account || "acct_test_123",
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
          requirements: {
            currently_due: [],
            eventually_due: [],
            past_due: [],
            disabled_reason: null,
          },
          ...options?.object,
        },
      },
    };
  }

  return {
    type,
    account: options?.account || "acct_test_456",
    data: {
      object: {
        object: "bank_account",
        id: "ba_test_123",
        ...options?.object,
      },
    },
  };
}
