// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { userSessionOptions, type UserSession } from "@/lib/session/userSession";

// 公开路由（不需要登录）
const publicRoutes = [
  "/admin", // 登录页面
  "/admin/register", // 注册页面
  "/admin/forgot-password", // 忘记密码
  "/admin/reset-password", // 重置密码
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只处理 /admin/* 路由
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // 如果是公开路由，直接通过
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 对于需要保护的路由，验证 session
  try {
    // 检查 SESSION_PASSWORD 是否配置
    if (!process.env.SESSION_PASSWORD) {
      console.error("[Middleware] SESSION_PASSWORD is not configured");
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // 创建一个兼容 iron-session 的 cookie store
    const cookieMap = new Map<string, string>();
    request.cookies.getAll().forEach((cookie) => {
      cookieMap.set(cookie.name, cookie.value);
    });

    const cookieStore = {
      get: (name: string) => cookieMap.get(name),
      set: () => {}, // middleware 中不需要设置
      delete: () => {}, // middleware 中不需要删除
      has: (name: string) => cookieMap.has(name),
      getAll: () => request.cookies.getAll(),
    };

    // 尝试解析 session
    const session = await getIronSession<UserSession>(cookieStore as any, userSessionOptions);

    // 检查 session 是否有有效的用户数据
    if (!session?.user?.id) {
      // 没有有效的 session，重定向到登录页面
      console.log(`[Middleware] No valid session for ${pathname}, redirecting to login`);
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Session 有效，继续访问
    console.log(`[Middleware] Valid session for ${pathname}, user: ${session.user.email}`);
    return NextResponse.next();
  } catch (error) {
    // Session 解析失败（可能是无效的 cookie），重定向到登录页面
    console.error(`[Middleware] Session verification error for ${pathname}:`, error);
    const loginUrl = new URL("/admin", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// 配置匹配路径
export const config = {
  matcher: ["/admin/:path*"],
};

