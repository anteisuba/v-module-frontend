// app/api/user/login/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/session/userSession";
import { ensureUserPage } from "@/domain/page-config";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

type Body = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as Body;
  const normalizedEmail = email?.trim();

  if (!normalizedEmail || !password) {
    return NextResponse.json(
      { message: "email / password 必填" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return NextResponse.json({ message: "该邮箱未注册" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ message: "密码不正确" }, { status: 401 });
  }

  // 确保用户有 Page 记录
  await ensureUserPage(user.id, user.slug);

  const session = await getUserSession();
  session.user = {
    id: user.id,
    slug: user.slug,
    email: user.email,
    displayName: user.displayName ?? null,
  };
  await session.save();

  return NextResponse.json({ ok: true });
}

