import { z } from "zod";

export const PRODUCT_STATUS_VALUES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const createProductInputSchema = z.object({
  name: z.string().trim().min(1, "商品名称必填"),
  description: z.string().trim().min(1).nullable().optional(),
  price: z.coerce.number().nonnegative("价格不能为负数"),
  stock: z.coerce.number().int().nonnegative("库存不能为负数").optional().default(0),
  images: z.array(z.string()),
  status: z.enum(PRODUCT_STATUS_VALUES).optional().default("DRAFT"),
});

export const updateProductInputSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(PRODUCT_STATUS_VALUES).optional(),
});

const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive("数量必须为正整数"),
});

export const checkoutInputSchema = z.object({
  buyerEmail: z.string().trim().email("请输入有效的邮箱地址"),
  buyerName: z.string().trim().min(1).nullable().optional(),
  shippingAddress: z.record(z.string(), z.unknown()).nullable().optional(),
  shippingMethod: z.string().trim().min(1).nullable().optional(),
  items: z.array(orderItemInputSchema).min(1, "至少需要一个商品"),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
