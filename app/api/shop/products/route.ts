// app/api/shop/products/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  getProducts,
  createProduct,
  type ProductCreateInput,
} from "@/domain/shop/services";

export const runtime = "nodejs";

// GET: 获取商品列表（支持分页和状态过滤）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status") || undefined;

  // 检查是否需要认证（如果查询未发布的商品）
  let userId: string | undefined;
  const session = await getServerSession();
  if (session?.user?.id) {
    userId = session.user.id;
  }

  // 如果查询草稿或已归档商品，需要认证且只能查看自己的
  if ((status === "DRAFT" || status === "ARCHIVED") && userId) {
    // 只显示当前用户的商品
  } else if (status === "DRAFT" || status === "ARCHIVED") {
    // 未登录用户不能查看草稿或已归档商品
    return NextResponse.json({
      products: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  // 如果用户已登录且没有传递 status，或者 status 不是 PUBLISHED，只显示当前用户的商品
  const finalUserId = (userId && (status !== "PUBLISHED" || !status)) ? userId : undefined;

  try {
    const result = await getProducts({
      page,
      limit,
      userId: finalUserId, // 如果已登录且不是查询公开商品，只显示自己的商品
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to get products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST: 创建新商品
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { name, description, price, stock, images, status } = body;

  if (!name || price === undefined) {
    return NextResponse.json(
      { error: "name and price are required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(images)) {
    return NextResponse.json(
      { error: "images must be an array" },
      { status: 400 }
    );
  }

  try {
    const input: ProductCreateInput = {
      userId,
      name,
      description: description || null,
      price: Number(price),
      stock: stock !== undefined ? Number(stock) : 0,
      images,
      status: status || "DRAFT",
    };

    const product = await createProduct(input);
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
