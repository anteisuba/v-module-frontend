// app/api/admin/reset-password/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken, verifyToken } from "@/lib/passwordReset";

type Body = {
  token?: string;
  password?: string;
};

export async function POST(req: Request) {
  const { token, password } = (await req.json()) as Body;

  if (!token || typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ message: "重置 token 必填" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json({ message: "新密码必填" }, { status: 400 });
  }

  // 验证密码长度
  if (password.length < 8) {
    return NextResponse.json({ message: "密码至少 8 位" }, { status: 400 });
  }

  // 计算 token 哈希
  const tokenHash = hashToken(token);

  // 查找 token 记录（使用 tokenHash 作为唯一标识）
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord) {
    return NextResponse.json(
      { message: "重置链接无效或已过期" },
      { status: 400 }
    );
  }

  // 检查是否已使用
  if (tokenRecord.used) {
    return NextResponse.json(
      { message: "该重置链接已被使用，请重新申请" },
      { status: 400 }
    );
  }

  // 检查是否过期
  if (tokenRecord.expiresAt < new Date()) {
    return NextResponse.json(
      { message: "重置链接已过期，请重新申请" },
      { status: 400 }
    );
  }

  // 更新密码
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    // 更新用户密码
    prisma.adminUser.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    }),
    // 标记 token 为已使用
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    }),
  ]);

  // 可选：删除该用户的所有其他未使用的重置 token（安全措施）
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: tokenRecord.userId,
      used: false,
      id: { not: tokenRecord.id },
    },
  });

  return NextResponse.json({
    message: "密码重置成功，请使用新密码登录",
  });
}
