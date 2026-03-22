// app/api/user/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureUserPage } from "@/domain/page-config";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { registerInputSchema } from "@/domain/user/schemas";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

export async function POST(req: Request) {
  try {
    const body = await req.clone().json().catch(() => ({}));
    await verifyTurnstileToken(body.turnstileToken);

    const { email, password, displayName, slug } = await readJsonBody(req, registerInputSchema, {
      code: "INVALID_REGISTER_INPUT",
      message: "注册信息格式不正确",
    });

    // 生成 slug（如果没有提供）
    let finalSlug = slug?.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    if (!finalSlug) {
      finalSlug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { slug: finalSlug }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiRouteError("EMAIL_TAKEN", "邮箱已被使用", 400);
      }
      if (existingUser.slug === finalSlug) {
        throw new ApiRouteError("SLUG_TAKEN", "用户名已被使用", 400);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        slug: finalSlug,
        displayName: displayName?.trim() || null,
      },
    });

    await ensureUserPage(user.id, user.slug);

    return NextResponse.json({ ok: true, user: { id: user.id, slug: user.slug } });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "REGISTER_FAILED",
      message: "注册失败，请稍后重试",
      status: 500,
      logMessage: "Register failed",
    });
  }
}
