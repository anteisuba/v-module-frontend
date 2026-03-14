import { NextResponse } from "next/server";
import {
  ApiRouteError,
  createApiErrorResponse,
  readJsonBody,
} from "@/lib/api/server";
import {
  deleteNewsArticle,
  getNewsArticleById,
  updateNewsArticle,
  updateNewsArticleInputSchema,
} from "@/domain/news";
import { getServerSession } from "@/lib/session/userSession";

export const runtime = "nodejs";

// GET: 获取单篇文章
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const article = await getNewsArticleById({
      id,
      viewerUserId: session?.user?.id ?? null,
    });

    return NextResponse.json({ article });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "NEWS_ARTICLE_FETCH_FAILED",
      message: "Failed to fetch news article",
      status: 500,
      logMessage: `Failed to fetch news article ${request.url}`,
    });
  }
}

// PUT: 更新文章
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const { id } = await params;
    const input = await readJsonBody(request, updateNewsArticleInputSchema, {
      code: "INVALID_NEWS_ARTICLE_INPUT",
      message: "Invalid news article payload",
    });
    const article = await updateNewsArticle({
      id,
      userId: session.user.id,
      input,
    });

    return NextResponse.json({ article });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "NEWS_ARTICLE_UPDATE_FAILED",
      message: "Failed to update news article",
      status: 500,
      logMessage: "Failed to update news article",
    });
  }
}

// DELETE: 删除文章
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const { id } = await params;
    await deleteNewsArticle({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "NEWS_ARTICLE_DELETE_FAILED",
      message: "Failed to delete news article",
      status: 500,
      logMessage: "Failed to delete news article",
    });
  }
}
