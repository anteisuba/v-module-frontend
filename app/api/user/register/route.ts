// app/api/user/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureUserPage } from "@/domain/page-config";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

type Body = {
  email?: string;
  password?: string;
  displayName?: string;
  slug?: string;
};

export async function POST(req: Request) {
  const { email, password, displayName, slug } = (await req.json()) as Body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "email / password 必填" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "密码至少 6 位" },
      { status: 400 }
    );
  }

  // 生成 slug（如果没有提供）
  let finalSlug = slug?.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
  if (!finalSlug) {
    // 从 email 生成：取 @ 前的部分
    finalSlug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }

  // 检查 email 和 slug 是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { slug: finalSlug }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return NextResponse.json({ message: "邮箱已被使用" }, { status: 400 });
    }
    if (existingUser.slug === finalSlug) {
      return NextResponse.json({ message: "用户名已被使用" }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      slug: finalSlug,
      displayName: displayName?.trim() || null,
    },
  });

  // 自动创建 Page 记录
  await ensureUserPage(user.id, user.slug);

  return NextResponse.json({ ok: true, user: { id: user.id, slug: user.slug } });
}

