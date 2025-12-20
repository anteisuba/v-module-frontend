// app/api/admin/forgot-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateResetToken,
  hashToken,
  checkRateLimit,
} from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

type Body = {
  email?: string;
};

export async function POST(req: Request) {
  const { email } = (await req.json()) as Body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ message: "邮箱必填" }, { status: 400 });
  }

  const emailLower = email.trim().toLowerCase();

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
  }

  // 检查速率限制（15 分钟内只能请求一次）
  const canRequest = await checkRateLimit(emailLower);
  if (!canRequest) {
    // 即使被限制，也返回相同的成功消息（防止用户枚举）
    return NextResponse.json({
      message: "如果该邮箱存在，重置链接已发送到您的邮箱",
    });
  }

  // 查找用户（无论是否存在，都返回相同的成功消息，防止用户枚举）
  const user = await prisma.adminUser.findUnique({
    where: { email: emailLower },
  });

  if (user) {
    // 生成 token
    const token = generateResetToken();
    const tokenHash = hashToken(token);

    // 设置过期时间（24 小时后）
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 保存 token 到数据库（只存储哈希，不存储原始 token）
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // 发送邮件
    try {
      await sendPasswordResetEmail(emailLower, token);
    } catch (error) {
      // 如果邮件发送失败，删除已创建的 token
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });

      console.error("[忘记密码] 邮件发送失败:", error);
      return NextResponse.json(
        { message: "邮件发送失败，请稍后重试" },
        { status: 500 }
      );
    }
  } else {
    // 开发环境：提示用户不存在（仅用于调试）
    if (process.env.NODE_ENV === "development") {
      console.log(
        `\n⚠️  [忘记密码] 邮箱 ${emailLower} 不存在（开发环境提示）\n`
      );
    }
  }

  // 无论用户是否存在，都返回相同的成功消息（防止用户枚举）
  return NextResponse.json({
    message: "如果该邮箱存在，重置链接已发送到您的邮箱",
  });
}
