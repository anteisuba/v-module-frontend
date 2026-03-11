import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { userSessionOptions, type UserSession } from "@/lib/session/userSession";

type ProxyCookieStore = {
  get: (name: string) => { name: string; value: string } | undefined;
  set: {
    (name: string, value: string): void;
    (options: { name: string; value: string }): void;
  };
};

const publicRoutes = [
  "/admin",
  "/admin/register",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isE2EBypassEnabled =
    process.env.E2E_BYPASS_AUTH === "1" &&
    request.cookies.get("vtuber_e2e_bypass")?.value === "1";

  if (isE2EBypassEnabled) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    if (!process.env.SESSION_PASSWORD) {
      console.error("[Proxy] SESSION_PASSWORD is not configured");
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const cookieMap = new Map<string, string>();
    request.cookies.getAll().forEach((cookie) => {
      cookieMap.set(cookie.name, cookie.value);
    });

    const cookieStore: ProxyCookieStore = {
      get: (name: string) => {
        const value = cookieMap.get(name);
        return value === undefined ? undefined : { name, value };
      },
      set: () => {},
    };

    const session = await getIronSession<UserSession>(
      cookieStore,
      userSessionOptions
    );

    if (!session?.user?.id) {
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error(`[Proxy] Session verification error for ${pathname}:`, error);
    const loginUrl = new URL("/admin", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
