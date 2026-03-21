// app/api/user/me/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { ApiRouteError, createApiErrorResponse } from "@/lib/api/server";

export const runtime = "nodejs"; // Session requires Node.js runtime

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "请先登录", 401);
    }

    return NextResponse.json({ ok: true, user: session.user });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "ME_FAILED",
      message: "获取用户信息失败",
      status: 500,
    });
  }
}
