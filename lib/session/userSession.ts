// lib/session/userSession.ts

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type UserSession = {
  user?: {
    id: string;
    slug: string;
    email: string;
    displayName?: string | null;
  };
};

export const userSessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string, // 复用现有的 SESSION_PASSWORD
  cookieName: "vtuber_user_session", // 与 admin session 区分
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

// ✅ App Router：cookies() 在你这个版本是 async 的，要 await
export async function getUserSession() {
  const cookieStore = await cookies();
  return getIronSession<UserSession>(cookieStore, userSessionOptions);
}

export async function getServerSession() {
  const session = await getUserSession();
  return session;
}

