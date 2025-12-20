// app/api/user/reset-password/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken, verifyToken } from "@/lib/userPasswordReset";

export const runtime = "nodejs";

type Body = {
  token?: string;
  password?: string;
};

export async function POST(req: Request) {
  const { token, password } = (await req.json()) as Body;

  if (!token || !password) {
    return NextResponse.json(
      { message: "token 和 password 必填" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "密码至少 6 位" },
      { status: 400 }
    );
  }

  // 查找 token
  const tokenHash = hashToken(token);
  const resetToken = await prisma.userPasswordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken) {
    return NextResponse.json(
      { message: "无效的重置链接" },
      { status: 400 }
    );
  }

  // 检查是否已使用
  if (resetToken.used) {
    return NextResponse.json(
      { message: "此重置链接已被使用" },
      { status: 400 }
    );
  }

  // 检查是否过期
  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { message: "重置链接已过期" },
      { status: 400 }
    );
  }

  // 验证 token（额外的安全检查）
  if (!verifyToken(token, resetToken.tokenHash)) {
    return NextResponse.json(
      { message: "无效的重置链接" },
      { status: 400 }
    );
  }

  // 更新密码
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  // 标记 token 为已使用
  await prisma.userPasswordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  return NextResponse.json({
    message: "密码重置成功",
  });
}

