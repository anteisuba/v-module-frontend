import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type Body = {
  email?: string;
  password?: string;
  displayName?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const displayName = (body.displayName ?? "").trim() || null;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "email / password 必填" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "密码至少 8 位" },
        { status: 400 }
      );
    }

    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { ok: false, message: "该邮箱已注册" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.create({
      data: { email, passwordHash, displayName },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
