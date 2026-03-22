// app/api/user/reset-password/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken, verifyToken } from "@/lib/userPasswordReset";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { resetPasswordInputSchema } from "@/domain/user/schemas";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.clone().json().catch(() => ({}));
    await verifyTurnstileToken(body.turnstileToken);

    const { token, password } = await readJsonBody(req, resetPasswordInputSchema, {
      code: "INVALID_RESET_INPUT",
      message: "token 和密码格式不正确",
    });

    const tokenHash = hashToken(token);
    const resetToken = await prisma.userPasswordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new ApiRouteError("INVALID_TOKEN", "无效的重置链接", 400);
    }

    if (resetToken.used) {
      throw new ApiRouteError("TOKEN_USED", "此重置链接已被使用", 400);
    }

    if (resetToken.expiresAt < new Date()) {
      throw new ApiRouteError("TOKEN_EXPIRED", "重置链接已过期", 400);
    }

    if (!verifyToken(token, resetToken.tokenHash)) {
      throw new ApiRouteError("INVALID_TOKEN", "无效的重置链接", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.userPasswordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return NextResponse.json({ ok: true, message: "密码重置成功" });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "RESET_PASSWORD_FAILED",
      message: "密码重置失败，请稍后重试",
      status: 500,
      logMessage: "Reset password failed",
    });
  }
}
