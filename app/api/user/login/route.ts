// app/api/user/login/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/session/userSession";
import { ensureUserPage } from "@/domain/page-config";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { loginInputSchema } from "@/domain/user/schemas";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

export async function POST(req: Request) {
  try {
    const body = await req.clone().json().catch(() => ({}));
    await verifyTurnstileToken(body.turnstileToken);

    const { email, password } = await readJsonBody(req, loginInputSchema, {
      code: "INVALID_LOGIN_INPUT",
      message: "邮箱和密码格式不正确",
    });

    const normalizedEmail = email.trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throw new ApiRouteError("USER_NOT_FOUND", "该邮箱未注册", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new ApiRouteError("INVALID_PASSWORD", "密码不正确", 401);
    }

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
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "LOGIN_FAILED",
      message: "登录失败，请稍后重试",
      status: 500,
      logMessage: "Login failed",
    });
  }
}
