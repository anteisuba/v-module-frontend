import { NextResponse } from "next/server";
import {
  createApiErrorResponse,
  readJsonBody,
  parseApiInput,
  ApiRouteError,
} from "@/lib/api/server";
import {
  createNewsArticle,
  createNewsArticleInputSchema,
  listNewsArticles,
  newsArticleListQuerySchema,
} from "@/domain/news";
import { getServerSession } from "@/lib/session/userSession";

export const runtime = "nodejs";

// GET: 获取新闻列表（支持分页和过滤）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseApiInput(
      newsArticleListQuerySchema,
      {
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        published: searchParams.get("published") ?? undefined,
      },
      {
        code: "INVALID_NEWS_ARTICLE_QUERY",
        message: "Invalid query parameters",
      }
    );
    const session = await getServerSession();
    const result = await listNewsArticles({
      ...query,
      viewerUserId: session?.user?.id ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "NEWS_ARTICLE_LIST_FAILED",
      message: "Failed to fetch news articles",
      status: 500,
      logMessage: "Failed to fetch news articles",
    });
  }
}

// POST: 创建新文章
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const input = await readJsonBody(request, createNewsArticleInputSchema, {
      code: "INVALID_NEWS_ARTICLE_INPUT",
      message: "Invalid news article payload",
    });
    const article = await createNewsArticle({
      userId: session.user.id,
      input,
    });

    return NextResponse.json({ article });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "NEWS_ARTICLE_CREATE_FAILED",
      message: "Failed to create news article",
      status: 500,
      logMessage: "Failed to create news article",
    });
  }
}
