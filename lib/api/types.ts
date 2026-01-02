// lib/api/types.ts

import type { PageConfig } from "@/domain/page-config/types";

/**
 * API 响应基础类型
 */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 用户信息类型
 */
export interface UserInfo {
  id: string;
  slug: string;
  email: string;
  displayName?: string | null;
}

/**
 * 用户相关 API 响应
 */
export interface UserMeResponse {
  ok: boolean;
  user: UserInfo;
}

export interface LoginResponse {
  ok: boolean;
}

export interface RegisterResponse {
  ok: boolean;
}

export interface LogoutResponse {
  ok: boolean;
}

/**
 * 页面配置相关 API 响应
 */
export interface PageDraftConfigResponse {
  draftConfig: PageConfig;
}

export interface PagePublishResponse {
  ok: boolean;
  publishedConfig: PageConfig;
}

export interface PageUpdateResponse {
  ok: boolean;
  pageConfig: PageConfig;
}

/**
 * 文件上传响应
 */
export interface UploadResponse {
  src: string;
  mimeType: string;
  size: number;
}

/**
 * 密码重置相关响应
 */
export interface ForgotPasswordResponse {
  ok: boolean;
  message?: string;
}

export interface ResetPasswordResponse {
  ok: boolean;
  message?: string;
}

/**
 * 新闻文章类型
 */
export interface NewsArticle {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tag?: string | null;
  shareUrl?: string | null;
  shareChannels?: Array<{ platform: string; enabled: boolean }> | null;
  backgroundType?: string | null; // "color" | "image"
  backgroundValue?: string | null; // 颜色值或图片 URL
  published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface NewsArticleListResponse {
  articles: NewsArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NewsArticleResponse {
  article: NewsArticle;
}

