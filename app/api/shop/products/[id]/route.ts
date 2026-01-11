// app/api/shop/products/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  type ProductUpdateInput,
} from "@/domain/shop/services";

export const runtime = "nodejs";

// GET: 获取单个商品详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 如果商品是草稿或已归档，需要验证权限
    if (product.status === "DRAFT" || product.status === "ARCHIVED") {
      const session = await getServerSession();
      if (!session?.user?.id || session.user.id !== product.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to get product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT: 更新商品
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;

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

  try {
    const input: ProductUpdateInput = {};
    if (name !== undefined) input.name = name;
    if (description !== undefined) input.description = description;
    if (price !== undefined) input.price = Number(price);
    if (stock !== undefined) input.stock = Number(stock);
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return NextResponse.json(
          { error: "images must be an array" },
          { status: 400 }
        );
      }
      input.images = images;
    }
    if (status !== undefined) input.status = status;

    const product = await updateProduct(id, userId, input);
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to update product:", error);
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status }
    );
  }
}

// DELETE: 删除商品
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;

  try {
    await deleteProduct(id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("Forbidden")
        ? 403
        : error instanceof Error && error.message.includes("RESTRICT")
        ? 409 // Conflict - 商品有订单关联
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete product" },
      { status }
    );
  }
}
