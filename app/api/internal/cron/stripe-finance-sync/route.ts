import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ORDER_PAYMENT_PROVIDER_STRIPE,
  getPaymentReconciliationReport,
  getPaymentSettlementReport,
  hasStripeFinanceAlertDestinations,
  sendStripeFinanceAnomalyAlerts,
  syncStripeDisputesForUser,
  syncStripeSettlementLedger,
  checkConnectAccountHealth,
} from "@/domain/shop";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("CRON_SECRET is not configured");
  }

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");

  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

function getDefaultStartDate(lookbackDays: number) {
  const date = new Date();
  date.setDate(date.getDate() - (lookbackDays - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

async function handle(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lookbackDays = Number(process.env.STRIPE_FINANCE_SYNC_LOOKBACK_DAYS || 30);
    const start = searchParams.get("start") || getDefaultStartDate(lookbackDays);
    const end = searchParams.get("end") || new Date().toISOString().slice(0, 10);
    const targetUserId = searchParams.get("userId");

    const sellers = targetUserId
      ? [{ userId: targetUserId }]
      : await prisma.order.findMany({
          where: {
            paymentProvider: ORDER_PAYMENT_PROVIDER_STRIPE,
          },
          distinct: ["userId"],
          select: {
            userId: true,
          },
        });
    const sellerProfiles = await prisma.user.findMany({
      where: {
        id: {
          in: sellers.map((seller) => seller.userId),
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        slug: true,
      },
    });
    const sellerProfileMap = new Map(
      sellerProfiles.map((seller) => [seller.id, seller])
    );
    const shouldSendAlerts = hasStripeFinanceAlertDestinations();

    let syncedEntries = 0;
    let syncedPayouts = 0;
    let matchedOrders = 0;
    let matchedRefunds = 0;
    let matchedPayoutEntries = 0;
    let syncedDisputes = 0;
    let matchedDisputeOrders = 0;
    let unmatchedDisputes = 0;
    const users: Array<{
      userId: string;
      settlements: Awaited<ReturnType<typeof syncStripeSettlementLedger>>;
      disputes: Awaited<ReturnType<typeof syncStripeDisputesForUser>>;
      alerts?: {
        paymentAnomalyCount: number;
        settlementAnomalyCount: number;
      };
    }> = [];
    const sellersForAlerts: Array<{
      userId: string;
      email: string | null;
      displayName: string | null;
      slug: string | null;
      paymentAnomalies: Awaited<
        ReturnType<typeof getPaymentReconciliationReport>
      >["anomalies"];
      settlementAnomalies: Awaited<
        ReturnType<typeof getPaymentSettlementReport>
      >["anomalies"];
    }> = [];

    for (const seller of sellers) {
      const settlements = await syncStripeSettlementLedger(seller.userId, {
        start,
        end,
      });
      const disputes = await syncStripeDisputesForUser(seller.userId, {
        start,
        end,
      });
      let paymentAnomalyCount = 0;
      let settlementAnomalyCount = 0;

      if (shouldSendAlerts) {
        const [paymentReport, settlementReport] = await Promise.all([
          getPaymentReconciliationReport(seller.userId, {
            start,
            end,
            eventLimit: 20,
          }),
          getPaymentSettlementReport(seller.userId, {
            start,
            end,
            entryLimit: 20,
          }),
        ]);
        paymentAnomalyCount = paymentReport.anomalies.length;
        settlementAnomalyCount = settlementReport.anomalies.length;

        sellersForAlerts.push({
          userId: seller.userId,
          email: sellerProfileMap.get(seller.userId)?.email || null,
          displayName: sellerProfileMap.get(seller.userId)?.displayName || null,
          slug: sellerProfileMap.get(seller.userId)?.slug || null,
          paymentAnomalies: paymentReport.anomalies,
          settlementAnomalies: settlementReport.anomalies,
        });
      }

      users.push({
        userId: seller.userId,
        settlements,
        disputes,
        ...(shouldSendAlerts
          ? {
              alerts: {
                paymentAnomalyCount,
                settlementAnomalyCount,
              },
            }
          : {}),
      });

      syncedEntries += settlements.syncedEntries;
      syncedPayouts += settlements.syncedPayouts;
      matchedOrders += settlements.matchedOrders;
      matchedRefunds += settlements.matchedRefunds;
      matchedPayoutEntries += settlements.matchedPayoutEntries;
      syncedDisputes += disputes.syncedDisputes;
      matchedDisputeOrders += disputes.matchedDisputeOrders;
      unmatchedDisputes += disputes.unmatchedDisputes;
    }
    const alerts = shouldSendAlerts
      ? await sendStripeFinanceAnomalyAlerts({
          start,
          end,
          sellers: sellersForAlerts,
        })
      : {
          enabled: false,
          alertedUserCount: 0,
          paymentAnomalyCount: 0,
          settlementAnomalyCount: 0,
          sellerEmailsSent: 0,
          slackSent: false,
          errors: [],
        };

    // Connect 账户健康检查：对比本地与 Stripe 远端状态，自动修复漂移
    const connectHealth = await checkConnectAccountHealth({ autoResync: true });

    if (alerts.errors.length > 0) {
      console.error("Stripe finance alerts completed with errors:", alerts.errors);
    }

    return NextResponse.json({
      ok: true,
      window: {
        start,
        end,
      },
      processedUsers: users.length,
      totals: {
        syncedEntries,
        syncedPayouts,
        matchedOrders,
        matchedRefunds,
        matchedPayoutEntries,
        syncedDisputes,
        matchedDisputeOrders,
        unmatchedDisputes,
      },
      connectHealth: {
        checked: connectHealth.checked,
        drifted: connectHealth.drifted,
        resynced: connectHealth.resynced,
        errors: connectHealth.errors,
      },
      alerts,
      users,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run Stripe finance sync";

    return NextResponse.json(
      { error: message },
      { status: message.includes("CRON_SECRET") ? 500 : 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
