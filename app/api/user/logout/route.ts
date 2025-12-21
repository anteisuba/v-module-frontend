// app/api/user/logout/route.ts

import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/session/userSession";

export const runtime = "nodejs";

export async function POST() {
  const session = await getUserSession();
  // 清除 session 数据
  delete session.user;
  // 保存空的 session（会清除 cookie）
  await session.save();
  return NextResponse.json({ ok: true });
}

