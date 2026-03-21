// app/api/shop/products/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { getProducts, createProduct } from "@/domain/shop/services";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { createProductInputSchema } from "@/domain/shop/schemas";

export const runtime = "nodejs";

// GET: 获取商品列表（支持分页和状态过滤）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;

    let userId: string | undefined;
    const session = await getServerSession();
    if (session?.user?.id) {
      userId = session.user.id;
    }

    if ((status === "DRAFT" || status === "ARCHIVED") && !userId) {
      return NextResponse.json({
        products: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const finalUserId = userId && status !== "PUBLISHED" ? userId : undefined;

    const result = await getProducts({ page, limit, userId: finalUserId, status });
    return NextResponse.json(result);
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "PRODUCTS_LIST_FAILED",
      message: "获取商品列表失败",
      status: 500,
      logMessage: "Failed to get products",
    });
  }
}

// POST: 创建新商品
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const input = await readJsonBody(request, createProductInputSchema, {
      code: "INVALID_PRODUCT_INPUT",
      message: "商品信息格式不正确",
    });

    const product = await createProduct({ userId: session.user.id, ...input });
    return NextResponse.json({ product });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "PRODUCT_CREATE_FAILED",
      message: "创建商品失败",
      status: 500,
      logMessage: "Failed to create product",
    });
  }
}
