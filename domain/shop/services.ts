// domain/shop/services.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const ORDER_STATUS_PENDING = "PENDING" as const;
export const ORDER_STATUS_AWAITING_PAYMENT = "AWAITING_PAYMENT" as const;
export const ORDER_STATUS_PAID = "PAID" as const;
export const ORDER_STATUS_SHIPPED = "SHIPPED" as const;
export const ORDER_STATUS_DELIVERED = "DELIVERED" as const;
export const ORDER_STATUS_CANCELLED = "CANCELLED" as const;

export const ORDER_PAYMENT_PROVIDER_STRIPE = "STRIPE" as const;

export const ORDER_PAYMENT_STATUS_OPEN = "OPEN" as const;
export const ORDER_PAYMENT_STATUS_PAID = "PAID" as const;
export const ORDER_PAYMENT_STATUS_FAILED = "FAILED" as const;
export const ORDER_PAYMENT_STATUS_EXPIRED = "EXPIRED" as const;
export const ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED =
  "PARTIALLY_REFUNDED" as const;
export const ORDER_PAYMENT_STATUS_REFUNDED = "REFUNDED" as const;

export const ORDER_REFUND_STATUS_PENDING = "PENDING" as const;
export const ORDER_REFUND_STATUS_SUCCEEDED = "SUCCEEDED" as const;
export const ORDER_REFUND_STATUS_FAILED = "FAILED" as const;
export const ORDER_REFUND_STATUS_CANCELED = "CANCELED" as const;

export const ORDER_DISPUTE_STATUS_WARNING_NEEDS_RESPONSE =
  "warning_needs_response" as const;
export const ORDER_DISPUTE_STATUS_WARNING_UNDER_REVIEW =
  "warning_under_review" as const;
export const ORDER_DISPUTE_STATUS_WARNING_CLOSED =
  "warning_closed" as const;
export const ORDER_DISPUTE_STATUS_NEEDS_RESPONSE = "needs_response" as const;
export const ORDER_DISPUTE_STATUS_UNDER_REVIEW = "under_review" as const;
export const ORDER_DISPUTE_STATUS_WON = "won" as const;
export const ORDER_DISPUTE_STATUS_LOST = "lost" as const;

export const ORDER_WITH_ITEMS_QUERY =
  Prisma.validator<Prisma.OrderDefaultArgs>()({
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      },
      paymentAttempts: {
        orderBy: { createdAt: "asc" },
      },
      refunds: {
        orderBy: { createdAt: "desc" },
      },
      disputes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

export interface Product {
  id: string;
  userId: string;
  userSlug: string | null;
  userDisplayName: string | null;
  name: string;
  description: string | null;
  price: number; // Decimal 转换为 number
  stock: number;
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateInput {
  userId: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number;
  images: string[];
  status?: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  images?: string[];
  status?: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string; // DRAFT, PUBLISHED, ARCHIVED
}

export interface ProductListResult {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface PublicOrderCreateInput {
  buyerEmail: string;
  buyerName?: string | null;
  shippingAddress?: Record<string, unknown> | null;
  shippingMethod?: string | null;
  items: OrderItemInput[];
}

export interface SerializedOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    images: string[];
  } | null;
}

export interface SerializedOrderPaymentAttempt {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  connectedAccountId?: string | null;
  externalChargeId?: string | null;
  externalTransferId?: string | null;
  applicationFeeAmount?: number | null;
  externalSessionId: string | null;
  externalPaymentIntentId: string | null;
  failureReason: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  failedAt: string | null;
  expiredAt: string | null;
}

export interface SerializedOrderRefund {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  reason: string | null;
  failureReason: string | null;
  connectedAccountId?: string | null;
  externalChargeId?: string | null;
  externalRefundId: string | null;
  externalPaymentIntentId: string | null;
  externalTransferReversalId?: string | null;
  applicationFeeRefundedAmount?: number | null;
  requestedByUserId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
  refundedAt: string | null;
}

export interface SerializedOrderDispute {
  id: string;
  userId: string | null;
  orderId: string | null;
  provider: string;
  status: string;
  reason: string | null;
  amount: number;
  currency: string;
  externalDisputeId: string;
  externalPaymentIntentId: string | null;
  externalChargeId: string | null;
  connectedAccountId?: string | null;
  externalTransferReversalId?: string | null;
  dueBy: string | null;
  closedAt: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedOrder {
  id: string;
  userId: string;
  payoutAccountId?: string | null;
  paymentRoutingMode?: "PLATFORM" | "STRIPE_CONNECT_DESTINATION";
  connectedAccountId?: string | null;
  externalChargeId?: string | null;
  externalTransferId?: string | null;
  platformFeeAmount?: number | null;
  sellerGrossAmount?: number | null;
  sellerNetExpectedAmount?: number | null;
  buyerEmail: string;
  buyerName: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  paymentProvider: string | null;
  paymentStatus: string | null;
  paymentSessionId: string | null;
  paymentIntentId: string | null;
  paymentExpiresAt: string | null;
  paymentFailedAt: string | null;
  paymentFailureReason: string | null;
  shippingAddress: Prisma.JsonValue | null;
  shippingMethod: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  refundedAmount: number;
  pendingRefundAmount: number;
  refundableAmount: number;
  items: SerializedOrderItem[];
  paymentAttempts: SerializedOrderPaymentAttempt[];
  refunds: SerializedOrderRefund[];
  disputes: SerializedOrderDispute[];
}

export interface CheckoutSessionResult {
  orderId: string;
  provider: string;
  checkoutUrl: string;
  expiresAt: string | null;
}

export type OrderWithItemsRecord = Prisma.OrderGetPayload<
  typeof ORDER_WITH_ITEMS_QUERY
>;

type SerializablePaymentAttemptRecord = Parameters<
  typeof serializeOrderPaymentAttempt
>[0];
type SerializableRefundRecord = Parameters<typeof serializeOrderRefund>[0];
type SerializableDisputeRecord = Parameters<typeof serializeOrderDispute>[0];

function normalizeImageList(images: Prisma.JsonValue): string[] {
  if (images && typeof images === "object" && Array.isArray(images)) {
    return images.filter((image): image is string => typeof image === "string");
  }

  return [];
}

function normalizeOrderItems(items: OrderItemInput[]): OrderItemInput[] {
  const quantities = new Map<string, number>();

  for (const item of items) {
    if (!item?.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Each item must have productId and quantity > 0");
    }

    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function toIsoStringOrNull(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function serializeOrderPaymentAttempt(
  attempt: {
    id: string;
    orderId: string;
    provider: string;
    status: string;
    amount: Prisma.Decimal;
    currency: string;
    connectedAccountId?: string | null;
    externalChargeId?: string | null;
    externalTransferId?: string | null;
    applicationFeeAmount?: Prisma.Decimal | null;
    externalSessionId: string | null;
    externalPaymentIntentId: string | null;
    failureReason: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    paidAt: Date | null;
    failedAt: Date | null;
    expiredAt: Date | null;
  }
): SerializedOrderPaymentAttempt {
  return {
    id: attempt.id,
    orderId: attempt.orderId,
    provider: attempt.provider,
    status: attempt.status,
    amount: Number(attempt.amount),
    currency: attempt.currency,
    connectedAccountId: attempt.connectedAccountId,
    externalChargeId: attempt.externalChargeId,
    externalTransferId: attempt.externalTransferId,
    applicationFeeAmount:
      attempt.applicationFeeAmount == null
        ? null
        : Number(attempt.applicationFeeAmount),
    externalSessionId: attempt.externalSessionId,
    externalPaymentIntentId: attempt.externalPaymentIntentId,
    failureReason: attempt.failureReason,
    metadata: attempt.metadata ?? null,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
    paidAt: toIsoStringOrNull(attempt.paidAt),
    failedAt: toIsoStringOrNull(attempt.failedAt),
    expiredAt: toIsoStringOrNull(attempt.expiredAt),
  };
}

function serializeOrderRefund(
  refund: {
    id: string;
    orderId: string;
    provider: string;
    status: string;
    amount: Prisma.Decimal;
    currency: string;
    reason: string | null;
    failureReason: string | null;
    connectedAccountId?: string | null;
    externalChargeId?: string | null;
    externalRefundId: string | null;
    externalPaymentIntentId: string | null;
    externalTransferReversalId?: string | null;
    applicationFeeRefundedAmount?: Prisma.Decimal | null;
    requestedByUserId: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    refundedAt: Date | null;
  }
): SerializedOrderRefund {
  return {
    id: refund.id,
    orderId: refund.orderId,
    provider: refund.provider,
    status: refund.status,
    amount: Number(refund.amount),
    currency: refund.currency,
    reason: refund.reason,
    failureReason: refund.failureReason,
    connectedAccountId: refund.connectedAccountId,
    externalChargeId: refund.externalChargeId,
    externalRefundId: refund.externalRefundId,
    externalPaymentIntentId: refund.externalPaymentIntentId,
    externalTransferReversalId: refund.externalTransferReversalId,
    applicationFeeRefundedAmount:
      refund.applicationFeeRefundedAmount == null
        ? null
        : Number(refund.applicationFeeRefundedAmount),
    requestedByUserId: refund.requestedByUserId,
    metadata: refund.metadata ?? null,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
    refundedAt: toIsoStringOrNull(refund.refundedAt),
  };
}

function serializeOrderDispute(
  dispute: {
    id: string;
    userId: string | null;
    orderId: string | null;
    provider: string;
    status: string;
    reason: string | null;
    amount: Prisma.Decimal;
    currency: string;
    externalDisputeId: string;
    externalPaymentIntentId: string | null;
    externalChargeId: string | null;
    connectedAccountId?: string | null;
    externalTransferReversalId?: string | null;
    dueBy: Date | null;
    closedAt: Date | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }
): SerializedOrderDispute {
  return {
    id: dispute.id,
    userId: dispute.userId,
    orderId: dispute.orderId,
    provider: dispute.provider,
    status: dispute.status,
    reason: dispute.reason,
    amount: Number(dispute.amount),
    currency: dispute.currency,
    externalDisputeId: dispute.externalDisputeId,
    externalPaymentIntentId: dispute.externalPaymentIntentId,
    externalChargeId: dispute.externalChargeId,
    connectedAccountId: dispute.connectedAccountId,
    externalTransferReversalId: dispute.externalTransferReversalId,
    dueBy: toIsoStringOrNull(dispute.dueBy),
    closedAt: toIsoStringOrNull(dispute.closedAt),
    metadata: dispute.metadata ?? null,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
  };
}

function getSuccessfulRefundAmount(refunds: SerializedOrderRefund[]) {
  return refunds
    .filter((refund) => refund.status === ORDER_REFUND_STATUS_SUCCEEDED)
    .reduce((sum, refund) => sum + refund.amount, 0);
}

function getPendingRefundAmount(refunds: SerializedOrderRefund[]) {
  return refunds
    .filter((refund) => refund.status === ORDER_REFUND_STATUS_PENDING)
    .reduce((sum, refund) => sum + refund.amount, 0);
}

export function serializeOrderWithItems(order: OrderWithItemsRecord): SerializedOrder {
  const paymentAttempts = Array.isArray((order as { paymentAttempts?: unknown }).paymentAttempts)
    ? ((order as { paymentAttempts: SerializablePaymentAttemptRecord[] })
        .paymentAttempts.map(serializeOrderPaymentAttempt))
    : [];
  const refunds = Array.isArray((order as { refunds?: unknown }).refunds)
    ? ((order as { refunds: SerializableRefundRecord[] }).refunds.map(
        serializeOrderRefund
      ))
    : [];
  const disputes = Array.isArray((order as { disputes?: unknown }).disputes)
    ? ((order as { disputes: SerializableDisputeRecord[] }).disputes.map(
        serializeOrderDispute
      ))
    : [];
  const refundedAmount = getSuccessfulRefundAmount(refunds);
  const pendingRefundAmount = getPendingRefundAmount(refunds);
  const refundableAmount = Math.max(
    Number(order.totalAmount) - refundedAmount - pendingRefundAmount,
    0
  );

  return {
    id: order.id,
    userId: order.userId,
    payoutAccountId: order.payoutAccountId || null,
    paymentRoutingMode: order.paymentRoutingMode,
    connectedAccountId: order.connectedAccountId || null,
    externalChargeId: order.externalChargeId || null,
    externalTransferId: order.externalTransferId || null,
    platformFeeAmount:
      order.platformFeeAmount == null ? null : Number(order.platformFeeAmount),
    sellerGrossAmount:
      order.sellerGrossAmount == null ? null : Number(order.sellerGrossAmount),
    sellerNetExpectedAmount:
      order.sellerNetExpectedAmount == null
        ? null
        : Number(order.sellerNetExpectedAmount),
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    status: order.status,
    paymentProvider: order.paymentProvider || null,
    paymentStatus: order.paymentStatus || null,
    paymentSessionId: order.paymentSessionId || null,
    paymentIntentId: order.paymentIntentId || null,
    paymentExpiresAt: order.paymentExpiresAt
      ? order.paymentExpiresAt.toISOString()
      : null,
    paymentFailedAt: order.paymentFailedAt
      ? order.paymentFailedAt.toISOString()
      : null,
    paymentFailureReason: order.paymentFailureReason || null,
    shippingAddress: order.shippingAddress ?? null,
    shippingMethod: order.shippingMethod,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: toIsoStringOrNull(order.paidAt),
    shippedAt: toIsoStringOrNull(order.shippedAt),
    deliveredAt: toIsoStringOrNull(order.deliveredAt),
    refundedAmount,
    pendingRefundAmount,
    refundableAmount,
    items: order.items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt.toISOString(),
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            images: normalizeImageList(item.product.images),
          }
        : null,
    })),
    paymentAttempts,
    refunds,
    disputes,
  };
}

/**
 * 获取商品列表（支持状态过滤）
 */
export async function getProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  const { page = 1, limit = 10, userId, status } = params;

  const where: Prisma.ProductWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            slug: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // 转换数据格式
  const formattedProducts: Product[] = products.map(
    ({ user, price, images, createdAt, updatedAt, ...product }) => ({
      ...product,
      userSlug: user?.slug || null,
      userDisplayName: user?.displayName || null,
      price: Number(price), // Decimal 转换为 number
      images:
        images && typeof images === "object" && Array.isArray(images)
          ? (images as string[])
          : [],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
  );

  return {
    products: formattedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 获取单个商品详情
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const { user, price, images, createdAt, updatedAt, ...productData } = product;

  return {
    ...productData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    price: Number(price),
    images:
      images && typeof images === "object" && Array.isArray(images)
        ? (images as string[])
        : [],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/**
 * 创建商品
 */
export async function createProduct(
  input: ProductCreateInput
): Promise<Product> {
  const { userId, stock = 0, status = "DRAFT", images, ...data } = input;

  // 验证 images 是数组
  if (!Array.isArray(images)) {
    throw new Error("images must be an array");
  }

  const product = await prisma.product.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      stock,
      images: images, // JSONB 会自动处理数组
      status,
    },
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
    },
  });

  const { user, price, images: productImages, createdAt, updatedAt, ...productData } =
    product;

  return {
    ...productData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    price: Number(price),
    images:
      productImages && typeof productImages === "object" && Array.isArray(productImages)
        ? (productImages as string[])
        : [],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/**
 * 更新商品
 */
export async function updateProduct(
  id: string,
  userId: string,
  input: ProductUpdateInput
): Promise<Product> {
  // 验证所有权
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.userId !== userId) {
    throw new Error("Forbidden: You can only update your own products");
  }

  const updateData: Prisma.ProductUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.images !== undefined) {
    // 验证 images 是数组
    if (!Array.isArray(input.images)) {
      throw new Error("images must be an array");
    }
    updateData.images = input.images;
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
    },
  });

  const { user, price, images: productImages, createdAt, updatedAt, ...productData } =
    product;

  return {
    ...productData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    price: Number(price),
    images:
      productImages && typeof productImages === "object" && Array.isArray(productImages)
        ? (productImages as string[])
        : [],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/**
 * 更新商品库存（用于下单时增减库存）
 */
export async function updateProductStock(
  productId: string,
  quantity: number // 正数增加库存，负数减少库存
): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const newStock = product.stock + quantity;

  if (newStock < 0) {
    throw new Error("Insufficient stock");
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
    },
  });

  const { user, price, images, createdAt, updatedAt, ...productData } = updated;

  return {
    ...productData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    price: Number(price),
    images:
      images && typeof images === "object" && Array.isArray(images)
        ? (images as string[])
        : [],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/**
 * 删除商品
 */
export async function deleteProduct(id: string, userId: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.userId !== userId) {
    throw new Error("Forbidden: You can only delete your own products");
  }

  await prisma.product.delete({
    where: { id },
  });
}

/**
 * 加载订单（含订单项）
 */
async function loadOrderWithItems(
  client: Prisma.TransactionClient | typeof prisma,
  orderId: string
) {
  return client.order.findUnique({
    where: { id: orderId },
    ...ORDER_WITH_ITEMS_QUERY,
  });
}

async function upsertPaymentAttemptForOrder(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    provider: string;
    status: string;
    amount: Prisma.Decimal | number;
    currency: string;
    connectedAccountId?: string | null;
    externalChargeId?: string | null;
    externalTransferId?: string | null;
    applicationFeeAmount?: Prisma.Decimal | number | null;
    externalSessionId?: string | null;
    externalPaymentIntentId?: string | null;
    failureReason?: string | null;
    metadata?: Prisma.InputJsonValue | null;
    paidAt?: Date | null;
    failedAt?: Date | null;
    expiredAt?: Date | null;
  }
) {
  const existingAttempt = input.externalSessionId
    ? await tx.orderPaymentAttempt.findFirst({
        where: {
          orderId: input.orderId,
          provider: input.provider,
          externalSessionId: input.externalSessionId,
        },
        select: {
          id: true,
        },
      })
    : null;

  const data = {
    provider: input.provider,
    status: input.status,
    amount: input.amount,
    currency: input.currency,
    connectedAccountId: input.connectedAccountId || null,
    externalChargeId: input.externalChargeId || null,
    externalTransferId: input.externalTransferId || null,
    applicationFeeAmount: input.applicationFeeAmount ?? null,
    externalSessionId: input.externalSessionId || null,
    externalPaymentIntentId: input.externalPaymentIntentId || null,
    failureReason: input.failureReason || null,
    paidAt: input.paidAt || null,
    failedAt: input.failedAt || null,
    expiredAt: input.expiredAt || null,
    ...(input.metadata !== undefined
      ? {
          metadata: input.metadata === null ? Prisma.JsonNull : input.metadata,
        }
      : {}),
  };

  if (existingAttempt) {
    return tx.orderPaymentAttempt.update({
      where: { id: existingAttempt.id },
      data,
    });
  }

  return tx.orderPaymentAttempt.create({
    data: {
      orderId: input.orderId,
      ...data,
    },
  });
}

export async function syncOrderPaymentStatusFromRefunds(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      paymentStatus: true,
      refunds: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found while syncing refund state");
  }

  const refundedAmount = order.refunds
    .filter((refund) => refund.status === ORDER_REFUND_STATUS_SUCCEEDED)
    .reduce((sum, refund) => sum + Number(refund.amount), 0);

  let nextPaymentStatus = order.paymentStatus;

  if (refundedAmount <= 0) {
    return order.paymentStatus;
  }

  if (refundedAmount >= Number(order.totalAmount)) {
    nextPaymentStatus = ORDER_PAYMENT_STATUS_REFUNDED;
  } else {
    nextPaymentStatus = ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED;
  }

  if (nextPaymentStatus !== order.paymentStatus) {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: nextPaymentStatus,
        ...(nextPaymentStatus === ORDER_PAYMENT_STATUS_REFUNDED &&
        order.status === ORDER_STATUS_PAID
          ? {
              status: ORDER_STATUS_CANCELLED,
            }
          : {}),
      },
    });
  }

  return nextPaymentStatus;
}

async function restoreOrderInventory(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: {
      productId: true,
      quantity: true,
    },
  });

  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });
  }
}

export async function getOrderWithItemsById(
  orderId: string
): Promise<SerializedOrder | null> {
  const order = await loadOrderWithItems(prisma, orderId);
  return order ? serializeOrderWithItems(order) : null;
}

/**
 * 公开结账预留订单
 * 在一个 Prisma 事务中完成：校验公开商品、创建待支付订单、创建订单项、扣减库存
 */
export async function createPublicOrder(
  input: PublicOrderCreateInput
): Promise<SerializedOrder> {
  const { buyerEmail, buyerName, shippingAddress, shippingMethod, items } = input;
  const normalizedItems = normalizeOrderItems(items);
  const normalizedBuyerEmail = buyerEmail.trim();
  const normalizedBuyerName = buyerName?.trim() || null;
  const normalizedShippingMethod = shippingMethod?.trim() || null;

  if (!normalizedBuyerEmail) {
    throw new Error("buyerEmail is required");
  }

  if (normalizedItems.length === 0) {
    throw new Error("Order must have at least one item");
  }

  return await prisma.$transaction(async (tx) => {
    const productIds = normalizedItems.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        status: "PUBLISHED",
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("Some products are unavailable for checkout");
    }

    const sellerIds = new Set(products.map((product) => product.userId));
    if (sellerIds.size !== 1) {
      throw new Error("Public checkout only supports products from one seller");
    }

    const sellerId = products[0].userId;
    let totalAmount = 0;
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const price = Number(product.price);
      totalAmount += price * item.quantity;
    }

    const order = await tx.order.create({
      data: {
        userId: sellerId,
        buyerEmail: normalizedBuyerEmail,
        buyerName: normalizedBuyerName,
        totalAmount,
        currency: "JPY",
        status: ORDER_STATUS_AWAITING_PAYMENT,
        paymentProvider: ORDER_PAYMENT_PROVIDER_STRIPE,
        paymentStatus: ORDER_PAYMENT_STATUS_OPEN,
        shippingAddress: shippingAddress
          ? (shippingAddress as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        shippingMethod: normalizedShippingMethod,
      },
    });

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)!;
      const price = Number(product.price);
      const subtotal = price * item.quantity;

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          price,
          quantity: item.quantity,
          subtotal,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    const createdOrder = await loadOrderWithItems(tx, order.id);

    if (!createdOrder) {
      throw new Error("Failed to load created order");
    }

    return serializeOrderWithItems(createdOrder);
  });
}

export async function attachStripePaymentSessionToOrder(
  orderId: string,
  input: {
    sessionId: string;
    paymentIntentId?: string | null;
    expiresAt?: Date | null;
    payoutAccountId?: string | null;
    paymentRoutingMode?: "PLATFORM" | "STRIPE_CONNECT_DESTINATION";
    connectedAccountId?: string | null;
    platformFeeAmount?: Prisma.Decimal | number | null;
    sellerGrossAmount?: Prisma.Decimal | number | null;
    sellerNetExpectedAmount?: Prisma.Decimal | number | null;
    applicationFeeAmount?: Prisma.Decimal | number | null;
  }
): Promise<SerializedOrder> {
  const order = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentSessionId: input.sessionId,
        paymentIntentId: input.paymentIntentId || null,
        paymentExpiresAt: input.expiresAt || null,
        paymentFailureReason: null,
        paymentFailedAt: null,
        payoutAccountId: input.payoutAccountId,
        paymentRoutingMode: input.paymentRoutingMode,
        connectedAccountId: input.connectedAccountId,
        platformFeeAmount: input.platformFeeAmount,
        sellerGrossAmount: input.sellerGrossAmount,
        sellerNetExpectedAmount: input.sellerNetExpectedAmount,
      },
      ...ORDER_WITH_ITEMS_QUERY,
    });

    await upsertPaymentAttemptForOrder(tx, {
      orderId: updatedOrder.id,
      provider: updatedOrder.paymentProvider || ORDER_PAYMENT_PROVIDER_STRIPE,
      status: ORDER_PAYMENT_STATUS_OPEN,
      amount: updatedOrder.totalAmount,
      currency: updatedOrder.currency,
      connectedAccountId: input.connectedAccountId || null,
      applicationFeeAmount: input.applicationFeeAmount ?? null,
      externalSessionId: input.sessionId,
      externalPaymentIntentId: input.paymentIntentId || null,
      failureReason: null,
      metadata: {
        source: "checkout-session",
      },
      paidAt: null,
      failedAt: null,
      expiredAt: null,
    });

    const refreshedOrder = await loadOrderWithItems(tx, orderId);

    if (!refreshedOrder) {
      throw new Error("Failed to load order after attaching payment session");
    }

    return refreshedOrder;
  });

  return serializeOrderWithItems(order);
}

export async function markOrderPaidByPaymentSession(
  paymentSessionId: string,
  paymentIntentId?: string | null
): Promise<{ order: SerializedOrder; changed: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { paymentSessionId },
      select: {
        id: true,
        totalAmount: true,
        currency: true,
        paymentProvider: true,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await tx.order.updateMany({
      where: {
        id: existing.id,
        paymentStatus: ORDER_PAYMENT_STATUS_OPEN,
      },
      data: {
        status: ORDER_STATUS_PAID,
        paymentStatus: ORDER_PAYMENT_STATUS_PAID,
        paymentIntentId: paymentIntentId || null,
        paidAt: new Date(),
        paymentFailedAt: null,
        paymentFailureReason: null,
      },
    });

    await upsertPaymentAttemptForOrder(tx, {
      orderId: existing.id,
      provider: existing.paymentProvider || ORDER_PAYMENT_PROVIDER_STRIPE,
      status: ORDER_PAYMENT_STATUS_PAID,
      amount: existing.totalAmount,
      currency: existing.currency,
      externalSessionId: paymentSessionId,
      externalPaymentIntentId: paymentIntentId || null,
      failureReason: null,
      metadata: {
        source: "webhook",
      },
      paidAt: new Date(),
      failedAt: null,
      expiredAt: null,
    });

    const order = await loadOrderWithItems(tx, existing.id);

    if (!order) {
      throw new Error("Failed to load paid order");
    }

    return {
      order: serializeOrderWithItems(order),
      changed: updated.count > 0,
    };
  });
}

export async function cancelOpenOrderPayment(
  orderId: string,
  input: {
    paymentStatus: typeof ORDER_PAYMENT_STATUS_FAILED | typeof ORDER_PAYMENT_STATUS_EXPIRED;
    reason: string;
  }
): Promise<{ order: SerializedOrder; changed: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalAmount: true,
        currency: true,
        paymentProvider: true,
        paymentSessionId: true,
        paymentIntentId: true,
      },
    });

    if (!currentOrder) {
      return null;
    }

    const updated = await tx.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: ORDER_PAYMENT_STATUS_OPEN,
      },
      data: {
        status: ORDER_STATUS_CANCELLED,
        paymentStatus: input.paymentStatus,
        paymentFailedAt: new Date(),
        paymentFailureReason: input.reason,
      },
    });

    const failureTimestamp = new Date();

    await upsertPaymentAttemptForOrder(tx, {
      orderId: currentOrder.id,
      provider: currentOrder.paymentProvider || ORDER_PAYMENT_PROVIDER_STRIPE,
      status: input.paymentStatus,
      amount: currentOrder.totalAmount,
      currency: currentOrder.currency,
      externalSessionId: currentOrder.paymentSessionId,
      externalPaymentIntentId: currentOrder.paymentIntentId,
      failureReason: input.reason,
      metadata: {
        source: "payment-cancel",
      },
      paidAt: null,
      failedAt:
        input.paymentStatus === ORDER_PAYMENT_STATUS_FAILED
          ? failureTimestamp
          : null,
      expiredAt:
        input.paymentStatus === ORDER_PAYMENT_STATUS_EXPIRED
          ? failureTimestamp
          : null,
    });

    const order = await loadOrderWithItems(tx, orderId);

    if (!order) {
      return null;
    }

    if (updated.count === 0) {
      return {
        order: serializeOrderWithItems(order),
        changed: false,
      };
    }

    await restoreOrderInventory(tx, orderId);

    const refreshedOrder = await loadOrderWithItems(tx, orderId);

    if (!refreshedOrder) {
      throw new Error("Failed to load cancelled order");
    }

    return {
      order: serializeOrderWithItems(refreshedOrder),
      changed: true,
    };
  });
}

export async function cancelOpenOrderPaymentBySession(
  paymentSessionId: string,
  input: {
    paymentStatus: typeof ORDER_PAYMENT_STATUS_FAILED | typeof ORDER_PAYMENT_STATUS_EXPIRED;
    reason: string;
  }
): Promise<{ order: SerializedOrder; changed: boolean } | null> {
  const order = await prisma.order.findUnique({
    where: { paymentSessionId },
    select: { id: true },
  });

  if (!order) {
    return null;
  }

  return cancelOpenOrderPayment(order.id, input);
}
