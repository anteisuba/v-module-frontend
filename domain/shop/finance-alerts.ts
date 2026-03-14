import { hasEmailDeliveryConfigured, sendEmailMessage } from "@/lib/email";
import { sendSlackWebhookMessage } from "@/lib/slack";
import type { PaymentReconciliationAnomaly } from "./reconciliation";
import type { PaymentSettlementAnomaly } from "./settlements";

type SellerFinanceAlertRecord = {
  userId: string;
  email: string | null;
  displayName: string | null;
  slug: string | null;
  paymentAnomalies: PaymentReconciliationAnomaly[];
  settlementAnomalies: PaymentSettlementAnomaly[];
};

type StripeFinanceAlertInput = {
  start: string;
  end: string;
  sellers: SellerFinanceAlertRecord[];
};

export interface StripeFinanceAlertResult {
  enabled: boolean;
  alertedUserCount: number;
  paymentAnomalyCount: number;
  settlementAnomalyCount: number;
  sellerEmailsSent: number;
  slackSent: boolean;
  errors: string[];
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

function getSlackWebhookUrl() {
  const trimmed = process.env.FINANCE_ALERT_SLACK_WEBHOOK_URL?.trim();
  return trimmed ? trimmed : null;
}

function getSellerLabel(seller: SellerFinanceAlertRecord) {
  return seller.displayName || seller.slug || seller.email || seller.userId;
}

function getSellerAdminLinks() {
  const baseUrl = getBaseUrl();

  return {
    reconciliation: `${baseUrl}/admin/orders/reconciliation`,
    settlements: `${baseUrl}/admin/orders/reconciliation/settlements`,
  };
}

function formatPaymentAnomalyLine(anomaly: PaymentReconciliationAnomaly) {
  return `${anomaly.severity.toUpperCase()} ${anomaly.code} - ${anomaly.title}`;
}

function formatSettlementAnomalyLine(anomaly: PaymentSettlementAnomaly) {
  return `${anomaly.severity.toUpperCase()} ${anomaly.code} - ${anomaly.title}`;
}

function buildSellerAlertEmail(
  seller: SellerFinanceAlertRecord,
  window: { start: string; end: string }
) {
  const links = getSellerAdminLinks();
  const paymentItems = seller.paymentAnomalies.slice(0, 5);
  const settlementItems = seller.settlementAnomalies.slice(0, 5);
  const sellerLabel = getSellerLabel(seller);
  const subject = `Stripe 对账告警：${seller.paymentAnomalies.length} 条支付异常 / ${seller.settlementAnomalies.length} 条结算异常`;

  const htmlSections = [
    `<p><strong>时间窗口：</strong>${window.start} 至 ${window.end}</p>`,
    `<p><strong>支付对账异常：</strong>${seller.paymentAnomalies.length} 条</p>`,
    `<p><strong>结算异常：</strong>${seller.settlementAnomalies.length} 条</p>`,
    paymentItems.length
      ? `
        <h3 style="margin-top: 24px;">支付对账异常（最多显示 5 条）</h3>
        <ul>
          ${paymentItems
            .map(
              (anomaly) =>
                `<li><strong>${anomaly.severity.toUpperCase()}</strong> ${anomaly.code} - ${anomaly.title}<br />${anomaly.description}</li>`
            )
            .join("")}
        </ul>
      `
      : "",
    settlementItems.length
      ? `
        <h3 style="margin-top: 24px;">结算异常（最多显示 5 条）</h3>
        <ul>
          ${settlementItems
            .map(
              (anomaly) =>
                `<li><strong>${anomaly.severity.toUpperCase()}</strong> ${anomaly.code} - ${anomaly.title}<br />${anomaly.description}</li>`
            )
            .join("")}
        </ul>
      `
      : "",
    `
      <p style="margin-top: 24px;">
        处理入口：
        <a href="${links.reconciliation}">支付对账</a>
        /
        <a href="${links.settlements}">结算核销</a>
      </p>
    `,
  ]
    .filter(Boolean)
    .join("");

  const text = [
    `Stripe 对账告警`,
    ``,
    `卖家：${sellerLabel}`,
    `时间窗口：${window.start} 至 ${window.end}`,
    `支付对账异常：${seller.paymentAnomalies.length} 条`,
    ...paymentItems.map((anomaly) => `- ${formatPaymentAnomalyLine(anomaly)}`),
    `结算异常：${seller.settlementAnomalies.length} 条`,
    ...settlementItems.map((anomaly) => `- ${formatSettlementAnomalyLine(anomaly)}`),
    ``,
    `支付对账：${links.reconciliation}`,
    `结算核销：${links.settlements}`,
  ].join("\n");

  return {
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 720px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">Stripe 对账告警</h2>
        <p>${sellerLabel} 在当前窗口检测到需要人工处理的财务异常。</p>
        ${htmlSections}
      </div>
    `,
    text,
  };
}

function buildSlackSummary(input: StripeFinanceAlertInput) {
  const sellersWithAnomalies = input.sellers.filter(
    (seller) =>
      seller.paymentAnomalies.length > 0 || seller.settlementAnomalies.length > 0
  );

  const lines = [
    `Stripe finance alerts`,
    `window: ${input.start} -> ${input.end}`,
  ];

  for (const seller of sellersWithAnomalies.slice(0, 10)) {
    lines.push(
      `- ${getSellerLabel(seller)} | payment=${seller.paymentAnomalies.length} | settlement=${seller.settlementAnomalies.length}`
    );

    const anomalyPreview = [
      ...seller.paymentAnomalies.slice(0, 2).map(formatPaymentAnomalyLine),
      ...seller.settlementAnomalies
        .slice(0, 2)
        .map(formatSettlementAnomalyLine),
    ];

    for (const line of anomalyPreview) {
      lines.push(`  • ${line}`);
    }
  }

  lines.push(`dashboard: ${getSellerAdminLinks().reconciliation}`);
  return lines.join("\n");
}

export function hasStripeFinanceAlertDestinations() {
  return hasEmailDeliveryConfigured() || Boolean(getSlackWebhookUrl());
}

export async function sendStripeFinanceAnomalyAlerts(
  input: StripeFinanceAlertInput
): Promise<StripeFinanceAlertResult> {
  const sellersWithAnomalies = input.sellers.filter(
    (seller) =>
      seller.paymentAnomalies.length > 0 || seller.settlementAnomalies.length > 0
  );
  const paymentAnomalyCount = sellersWithAnomalies.reduce(
    (sum, seller) => sum + seller.paymentAnomalies.length,
    0
  );
  const settlementAnomalyCount = sellersWithAnomalies.reduce(
    (sum, seller) => sum + seller.settlementAnomalies.length,
    0
  );
  const slackWebhookUrl = getSlackWebhookUrl();
  const enabled = hasStripeFinanceAlertDestinations();

  if (!enabled || sellersWithAnomalies.length === 0) {
    return {
      enabled,
      alertedUserCount: sellersWithAnomalies.length,
      paymentAnomalyCount,
      settlementAnomalyCount,
      sellerEmailsSent: 0,
      slackSent: false,
      errors: [],
    };
  }

  let sellerEmailsSent = 0;
  let slackSent = false;
  const errors: string[] = [];

  if (hasEmailDeliveryConfigured()) {
    for (const seller of sellersWithAnomalies) {
      if (!seller.email) {
        continue;
      }

      try {
        const message = buildSellerAlertEmail(seller, {
          start: input.start,
          end: input.end,
        });

        await sendEmailMessage({
          to: seller.email,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
        sellerEmailsSent += 1;
      } catch (error) {
        errors.push(
          `Failed to send finance alert email for ${seller.userId}: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        );
      }
    }
  }

  if (slackWebhookUrl) {
    try {
      await sendSlackWebhookMessage({
        webhookUrl: slackWebhookUrl,
        text: buildSlackSummary(input),
      });
      slackSent = true;
    } catch (error) {
      errors.push(
        `Failed to send finance alert Slack message: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }

  return {
    enabled,
    alertedUserCount: sellersWithAnomalies.length,
    paymentAnomalyCount,
    settlementAnomalyCount,
    sellerEmailsSent,
    slackSent,
    errors,
  };
}
