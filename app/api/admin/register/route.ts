import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

type Body = {
  email?: string;
  password?: string;
  displayName?: string;
};

export async function POST(req: Request) {
  const { email, password, displayName } = (await req.json()) as Body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "email / password 必填" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ message: "密码至少 8 位" }, { status: 400 });
  }

  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ message: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      displayName: displayName?.trim() || null,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
