import { prisma } from "@/lib/prisma";
import { sendEmailMessage } from "@/lib/email";
import type { SerializedOrder } from "./services";

type SellerInfo = {
  email: string;
  displayName: string | null;
  slug: string;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

function getShortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

function formatPrice(amount: number) {
  return `¥${amount.toFixed(2)}`;
}

function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "待处理",
    PAID: "已支付",
    SHIPPED: "已发货",
    DELIVERED: "已送达",
    CANCELLED: "已取消",
  };

  return labels[status] || status;
}

function formatOrderItems(order: SerializedOrder) {
  return order.items
    .map((item) => `${item.product?.name || item.productId} x ${item.quantity} (${formatPrice(item.subtotal)})`)
    .join("\n");
}

function formatShippingAddress(shippingAddress: SerializedOrder["shippingAddress"]) {
  if (!shippingAddress || typeof shippingAddress !== "object" || Array.isArray(shippingAddress)) {
    return "未提供";
  }

  const parts = Object.values(shippingAddress)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length > 0 ? parts.join(" / ") : "未提供";
}

async function getSellerInfo(userId: string): Promise<SellerInfo | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      displayName: true,
      slug: true,
    },
  });
}

async function sendBuyerOrderCreatedEmail(order: SerializedOrder, seller: SellerInfo | null) {
  const orderUrl = seller?.slug
    ? `${getBaseUrl()}/u/${seller.slug}/shop/order-success/${order.id}`
    : null;

  await sendEmailMessage({
    to: order.buyerEmail,
    subject: `订单已提交 #${getShortOrderId(order.id)} - VTuber Site`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">订单已提交</h2>
        <p>您好${order.buyerName ? `，${order.buyerName}` : ""}：</p>
        <p>我们已经收到您的订单，卖家会继续处理后续的支付与配送流程。</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p><strong>订单号：</strong>#${getShortOrderId(order.id)}</p>
          <p><strong>订单状态：</strong>${formatStatusLabel(order.status)}</p>
          <p><strong>订单总额：</strong>${formatPrice(order.totalAmount)}</p>
          <p><strong>配送方式：</strong>${order.shippingMethod || "未提供"}</p>
          <p><strong>配送地址：</strong>${formatShippingAddress(order.shippingAddress)}</p>
        </div>
        <p><strong>商品明细</strong></p>
        <pre style="background: #fafafa; border-radius: 12px; padding: 16px; white-space: pre-wrap;">${formatOrderItems(order)}</pre>
        ${
          orderUrl
            ? `<p>如需查看订单详情，可打开：<a href="${orderUrl}">${orderUrl}</a></p>`
            : ""
        }
        <p style="margin-top: 24px; color: #666;">如您并未提交此订单，请直接回复本邮件联系卖家。</p>
      </div>
    `,
    text: [
      `订单已提交 #${getShortOrderId(order.id)}`,
      "",
      `订单状态：${formatStatusLabel(order.status)}`,
      `订单总额：${formatPrice(order.totalAmount)}`,
      `配送方式：${order.shippingMethod || "未提供"}`,
      `配送地址：${formatShippingAddress(order.shippingAddress)}`,
      "",
      "商品明细：",
      formatOrderItems(order),
      orderUrl ? `订单详情：${orderUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

async function sendSellerNewOrderEmail(order: SerializedOrder, seller: SellerInfo) {
  const adminOrdersUrl = `${getBaseUrl()}/admin/orders`;

  await sendEmailMessage({
    to: seller.email,
    subject: `新订单 #${getShortOrderId(order.id)} - VTuber Site`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">收到新订单</h2>
        <p>${seller.displayName || seller.slug}，您有一笔新的待处理订单。</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p><strong>订单号：</strong>#${getShortOrderId(order.id)}</p>
          <p><strong>买家邮箱：</strong>${order.buyerEmail}</p>
          <p><strong>买家姓名：</strong>${order.buyerName || "未提供"}</p>
          <p><strong>订单总额：</strong>${formatPrice(order.totalAmount)}</p>
        </div>
        <p><strong>商品明细</strong></p>
        <pre style="background: #fafafa; border-radius: 12px; padding: 16px; white-space: pre-wrap;">${formatOrderItems(order)}</pre>
        <p>请前往后台处理订单：<a href="${adminOrdersUrl}">${adminOrdersUrl}</a></p>
      </div>
    `,
    text: [
      `新订单 #${getShortOrderId(order.id)}`,
      "",
      `买家邮箱：${order.buyerEmail}`,
      `买家姓名：${order.buyerName || "未提供"}`,
      `订单总额：${formatPrice(order.totalAmount)}`,
      "",
      "商品明细：",
      formatOrderItems(order),
      "",
      `后台处理地址：${adminOrdersUrl}`,
    ].join("\n"),
  });
}

async function sendBuyerStatusChangedEmail(
  order: SerializedOrder,
  seller: SellerInfo | null,
  previousStatus: string
) {
  const orderUrl = seller?.slug
    ? `${getBaseUrl()}/u/${seller.slug}/shop/order-success/${order.id}`
    : null;

  await sendEmailMessage({
    to: order.buyerEmail,
    subject: `订单状态更新 #${getShortOrderId(order.id)} - ${formatStatusLabel(order.status)}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">订单状态已更新</h2>
        <p>您好${order.buyerName ? `，${order.buyerName}` : ""}：</p>
        <p>您的订单状态已从 <strong>${formatStatusLabel(previousStatus)}</strong> 更新为 <strong>${formatStatusLabel(order.status)}</strong>。</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p><strong>订单号：</strong>#${getShortOrderId(order.id)}</p>
          <p><strong>订单总额：</strong>${formatPrice(order.totalAmount)}</p>
          <p><strong>当前状态：</strong>${formatStatusLabel(order.status)}</p>
        </div>
        ${
          orderUrl
            ? `<p>您可以打开订单详情页面查看最新信息：<a href="${orderUrl}">${orderUrl}</a></p>`
            : ""
        }
      </div>
    `,
    text: [
      `订单状态更新 #${getShortOrderId(order.id)}`,
      "",
      `状态变更：${formatStatusLabel(previousStatus)} -> ${formatStatusLabel(order.status)}`,
      `订单总额：${formatPrice(order.totalAmount)}`,
      orderUrl ? `订单详情：${orderUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendOrderCreatedNotifications(order: SerializedOrder) {
  const seller = await getSellerInfo(order.userId);

  await Promise.all([
    sendBuyerOrderCreatedEmail(order, seller),
    seller ? sendSellerNewOrderEmail(order, seller) : Promise.resolve(),
  ]);
}

export async function sendOrderStatusChangedNotifications(
  order: SerializedOrder,
  previousStatus: string
) {
  const seller = await getSellerInfo(order.userId);
  await sendBuyerStatusChangedEmail(order, seller, previousStatus);
}
