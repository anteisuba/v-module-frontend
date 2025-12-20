import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { deleteUploadedFile } from "@/lib/fileUtils";

export const runtime = "nodejs";

type HeroSlide = {
  slot: 1 | 2 | 3;
  src: string;
  alt?: string | null;
};

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session.admin) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const url = new URL(req.url);
  const slotNum = Number(url.searchParams.get("slot"));

  if (![1, 2, 3].includes(slotNum)) {
    return NextResponse.json({ message: "slot 必须是 1/2/3" }, { status: 400 });
  }
  const slot = slotNum as 1 | 2 | 3;

  const adminUserId = session.admin.id;

  const cfg = await prisma.siteConfig.findUnique({
    where: { adminUserId },
    select: { heroSlides: true },
  });

  const slides = (cfg?.heroSlides ?? []) as unknown as HeroSlide[];
  const target = slides.find((s) => s.slot === slot);

  // ✅ 使用工具函数安全删除文件
  if (target?.src) {
    await deleteUploadedFile(target.src);
  }

  const nextSlides = slides
    .filter((s) => s.slot !== slot)
    .sort((a, b) => a.slot - b.slot);

  await prisma.siteConfig.upsert({
    where: { adminUserId },
    create: {
      adminUserId,
      heroSlides: nextSlides as unknown as Prisma.JsonArray,
    },
    update: { heroSlides: nextSlides as unknown as Prisma.JsonArray },
  });

  return NextResponse.json({ ok: true, slot });
}
