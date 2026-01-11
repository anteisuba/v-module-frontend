// domain/shop/services.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface Product {
  id: string;
  userId: string;
  userSlug: string | null;
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

export interface OrderCreateInput {
  userId: string; // 卖家用户 ID
  buyerEmail: string;
  buyerName?: string | null;
  shippingAddress?: Record<string, any> | null;
  shippingMethod?: string | null;
  items: OrderItemInput[];
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
        },
      },
    },
  });

  const { user, price, images: productImages, createdAt, updatedAt, ...productData } =
    product;

  return {
    ...productData,
    userSlug: user?.slug || null,
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
        },
      },
    },
  });

  const { user, price, images: productImages, createdAt, updatedAt, ...productData } =
    product;

  return {
    ...productData,
    userSlug: user?.slug || null,
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
        },
      },
    },
  });

  const { user, price, images, createdAt, updatedAt, ...productData } = updated;

  return {
    ...productData,
    userSlug: user?.slug || null,
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
 * 创建订单
 * 在一个 Prisma 事务中完成：创建 Order、创建 OrderItems、扣减对应 Product 的库存
 */
export async function createOrder(input: OrderCreateInput) {
  const { userId, buyerEmail, buyerName, shippingAddress, shippingMethod, items } =
    input;

  if (!items || items.length === 0) {
    throw new Error("Order must have at least one item");
  }

  // 在事务中执行所有操作
  return await prisma.$transaction(async (tx) => {
    // 1. 验证所有商品存在且属于当前卖家，并获取价格
    const productIds = items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        userId, // 确保商品属于当前卖家
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("Some products not found or do not belong to you");
    }

    // 2. 检查库存并计算总金额
    let totalAmount = 0;
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
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

    // 3. 创建订单
    const order = await tx.order.create({
      data: {
        userId,
        buyerEmail,
        buyerName: buyerName || null,
        totalAmount,
        status: "PENDING",
        shippingAddress: shippingAddress ? (shippingAddress as Prisma.InputJsonValue) : Prisma.JsonNull,
        shippingMethod: shippingMethod || null,
      },
    });

    // 4. 创建订单项并扣减库存
    const orderItems = [];
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const price = Number(product.price);
      const subtotal = price * item.quantity;

      // 创建订单项
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          price,
          quantity: item.quantity,
          subtotal,
        },
      });

      orderItems.push(orderItem);

      // 扣减库存
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return {
      order,
      items: orderItems,
    };
  });
}
