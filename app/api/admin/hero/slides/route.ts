// app/api/admin/hero/slides/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export const runtime = "nodejs"; // 不必须，但和你上传保持一致也行

export async function GET() {
  const session = await getAdminSession();
  if (!session.admin) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const adminUserId = session.admin.id;

  const config = await prisma.siteConfig.findUnique({
    where: { adminUserId },
    select: { heroSlides: true },
  });

  return NextResponse.json({
    slides: config?.heroSlides ?? [],
  });
}
