// app/api/user/forgot-password/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken, hashToken, checkRateLimitForUser, sendPasswordResetEmail } from "@/lib/userPasswordReset";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { forgotPasswordInputSchema } from "@/domain/user/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await readJsonBody(req, forgotPasswordInputSchema, {
      code: "INVALID_EMAIL",
      message: "邮箱格式不正确",
    });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiRouteError("USER_NOT_FOUND", "该邮箱未注册", 404);
    }

    const canRequest = await checkRateLimitForUser(user.email);
    if (!canRequest) {
      throw new ApiRouteError("RATE_LIMITED", "请求过于频繁，请 1 分钟后再试", 429);
    }

    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.userPasswordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt, used: false },
    });

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error("[忘记密码] 邮件发送失败:", error);
      throw new ApiRouteError("EMAIL_SEND_FAILED", "邮件发送失败，请稍后重试", 500);
    }

    return NextResponse.json({ ok: true, message: "我们已发送重置密码链接到您的邮箱" });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "FORGOT_PASSWORD_FAILED",
      message: "处理请求失败，请稍后重试",
      status: 500,
      logMessage: "Forgot password failed",
    });
  }
}
