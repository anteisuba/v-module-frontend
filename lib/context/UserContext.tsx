// lib/context/UserContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";
import type { UserInfo } from "@/lib/api/types";

interface UserContextValue {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
}

/**
 * 用户上下文提供者
 * 管理全局用户状态
 */
export function UserProvider({ children }: UserProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 刷新用户信息
   */
  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await userApi.getMe();
      setUser(userData);
    } catch (err) {
      setUser(null);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("获取用户信息失败");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      router.push("/admin");
    }
  }, [router]);

  // 初始化时加载用户信息
  // 只在需要用户信息的页面（/admin/* 但排除登录页）才自动加载
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const pathname = window.location.pathname;
    
    // 如果是登录页或公开页面（/、/u/* 等），不自动加载用户信息
    // 避免在公开页面因为无效 cookie 导致重定向到登录页
    if (pathname === "/admin" || 
        pathname === "/admin/register" || 
        pathname === "/admin/forgot-password" || 
        pathname === "/admin/reset-password" ||
        !pathname.startsWith("/admin")) {
      // 在登录页或公开页面，设置 loading 为 false，但不加载用户信息
      setLoading(false);
      return;
    }
    
    // 只在需要认证的管理页面才自动加载用户信息
    refreshUser();
  }, [refreshUser]);

  const value: UserContextValue = {
    user,
    loading,
    error,
    refreshUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * 使用用户上下文的 Hook
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

/**
 * 仅获取用户信息的 Hook（不会抛出错误，如果未在 Provider 中使用则返回 null）
 */
export function useUserOptional(): UserContextValue | null {
  const context = useContext(UserContext);
  return context ?? null;
}

