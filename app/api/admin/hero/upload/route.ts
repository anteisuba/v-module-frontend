import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { deleteUploadedFile } from "@/lib/fileUtils";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "upload-img1");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

type HeroSlide = {
  slot: 1 | 2 | 3;
  src: string;
  alt?: string | null;
};

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.admin) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const form = await req.formData();

  const slotRaw = String(form.get("slot") ?? "");
  const slotNum = Number(slotRaw);
  if (![1, 2, 3].includes(slotNum)) {
    return NextResponse.json({ message: "slot 必须是 1/2/3" }, { status: 400 });
  }
  const slot = slotNum as 1 | 2 | 3;

  const altRaw = form.get("alt");
  const alt =
    typeof altRaw === "string" && altRaw.trim() ? altRaw.trim() : undefined;

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "file 必填" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { message: "仅支持 jpg/png/webp" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "图片不能超过 5MB" }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
      ? "webp"
      : "jpg";

  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const absPath = path.join(UPLOAD_DIR, name);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, bytes);

  const publicPath = `/upload-img1/${name}`;
  const adminUserId = session.admin.id;

  // upsert 保证有一条 SiteConfig
  const existing = await prisma.siteConfig.upsert({
    where: { adminUserId },
    create: { adminUserId, heroSlides: [] },
    update: {},
    select: { heroSlides: true },
  });

  const slides = (existing.heroSlides ?? []) as unknown as HeroSlide[];

  // ✅ 替换同 slot：使用工具函数安全删除旧文件
  const old = slides.find((s) => s.slot === slot);
  if (old?.src) {
    await deleteUploadedFile(old.src);
  }

  const nextSlides = [
    ...slides.filter((s) => s.slot !== slot),
    { slot, src: publicPath, ...(alt ? { alt } : {}) },
  ].sort((a, b) => a.slot - b.slot);

  await prisma.siteConfig.update({
    where: { adminUserId },
    data: {
      heroSlides: nextSlides as unknown as Prisma.JsonArray,
    },
  });

  return NextResponse.json({ ok: true, slide: { slot, src: publicPath, alt } });
}
