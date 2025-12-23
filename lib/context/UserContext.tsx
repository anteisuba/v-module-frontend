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
  useEffect(() => {
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

