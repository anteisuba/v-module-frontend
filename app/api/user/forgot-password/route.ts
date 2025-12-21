// app/api/user/forgot-password/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken, hashToken, checkRateLimitForUser, sendPasswordResetEmail } from "@/lib/userPasswordReset";

export const runtime = "nodejs";

type Body = {
  email?: string;
};

export async function POST(req: Request) {
  const { email } = (await req.json()) as Body;

  if (!email) {
    return NextResponse.json(
      { message: "邮箱必填" },
      { status: 400 }
    );
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 如果用户不存在，返回错误信息
  if (!user) {
    return NextResponse.json({
      message: "该邮箱未注册",
      emailExists: false,
    }, { status: 404 });
  }

  // 检查速率限制（1 分钟内只能请求一次）
  const canRequest = await checkRateLimitForUser(user.email);
  if (!canRequest) {
    return NextResponse.json({
      message: "请求过于频繁，请 1 分钟后再试",
    }, { status: 429 });
  }

  // 生成 token
  const token = generateResetToken();
  const tokenHash = hashToken(token);

  // 保存到数据库（24 小时过期）
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.userPasswordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
      used: false,
    },
  });

  // 发送邮件
  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (error) {
    console.error("[忘记密码] 邮件发送失败:", error);
    return NextResponse.json({
      message: "邮件发送失败，请稍后重试",
    }, { status: 500 });
  }

  return NextResponse.json({
    message: "我们已发送重置密码链接到您的邮箱",
    emailExists: true,
  });
}

