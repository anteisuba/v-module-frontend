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
export const ORDER_PAYMENT_STATUS_REFUNDED = "REFUNDED" as const;

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

export interface SerializedOrder {
  id: string;
  userId: string;
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
  items: SerializedOrderItem[];
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

export function serializeOrderWithItems(order: OrderWithItemsRecord): SerializedOrder {
  return {
    id: order.id,
    userId: order.userId,
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
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
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
  };
}

/**
 * 获取商品列表（支持状态过滤）
 */
export async function getProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  const { page = 1, limit = 10, userId, status } = params;

  const where: any = {};

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

  const updateData: any = {};

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
  }
): Promise<SerializedOrder> {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentSessionId: input.sessionId,
      paymentIntentId: input.paymentIntentId || null,
      paymentExpiresAt: input.expiresAt || null,
      paymentFailureReason: null,
      paymentFailedAt: null,
    },
    ...ORDER_WITH_ITEMS_QUERY,
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
      select: { id: true },
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
