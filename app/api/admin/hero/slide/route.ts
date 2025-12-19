import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

  // 只删 upload-img1 下的
  if (target?.src?.startsWith("/upload-img1/")) {
    const abs = path.join(process.cwd(), "public", target.src);
    await fs.unlink(abs).catch(() => {});
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
