// lib/api/endpoints.ts

import { apiClient } from "./client";
import type {
  UserInfo,
  UserMeResponse,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  PageDraftConfigResponse,
  PagePublishResponse,
  PageUpdateResponse,
  UploadResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  NewsArticle,
  NewsArticleListResponse,
  NewsArticleResponse,
} from "./types";
import type { PageConfig } from "@/domain/page-config/types";

/**
 * 用户相关 API
 */
export const userApi = {
  /**
   * 获取当前用户信息
   */
  async getMe(): Promise<UserInfo> {
    const response = await apiClient.get<UserMeResponse>("/api/user/me");
    // API 返回 { ok: true, user: {...} }
    if ('user' in response && response.user) {
      return response.user;
    }
    // 如果直接返回 user 对象（不应该发生，但为了兼容性）
    return response as unknown as UserInfo;
  },

  /**
   * 用户登录
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(
      "/api/user/login",
      { email, password },
      { skipAuth: true }
    );
  },

  /**
   * 用户注册
   */
  async register(data: {
    email: string;
    password: string;
    displayName?: string;
    slug?: string;
  }): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>(
      "/api/user/register",
      {
        email: data.email.trim(),
        password: data.password,
        displayName: data.displayName?.trim() || undefined,
        slug: data.slug?.trim() || undefined,
      },
      { skipAuth: true }
    );
  },

  /**
   * 用户登出
   */
  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>("/api/user/logout", undefined, {
      skipAuth: true, // 登出接口即使未登录也可以调用
    });
  },

  /**
   * 忘记密码（请求重置链接）
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>(
      "/api/user/forgot-password",
      { email: email.trim() },
      { skipAuth: true }
    );
  },

  /**
   * 重置密码
   */
  async resetPassword(
    token: string,
    password: string
  ): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>(
      "/api/user/reset-password",
      { token, password },
      { skipAuth: true }
    );
  },
};

/**
 * 页面配置相关 API
 */
export const pageApi = {
  /**
   * 获取当前用户的草稿配置
   */
  async getDraftConfig(): Promise<PageConfig> {
    const response = await apiClient.get<PageDraftConfigResponse>(
      "/api/page/me"
    );
    // API 返回 { draftConfig: {...} }
    if ('draftConfig' in response) {
      return response.draftConfig;
    }
    // 如果直接返回配置对象（不应该发生，但为了兼容性）
    return response as unknown as PageConfig;
  },

  /**
   * 更新当前用户的草稿配置
   */
  async updateDraftConfig(
    draftConfig: PageConfig
  ): Promise<PageUpdateResponse> {
    return apiClient.put<PageUpdateResponse>("/api/page/me", {
      draftConfig,
    });
  },

  /**
   * 发布草稿配置
   */
  async publish(): Promise<PagePublishResponse> {
    return apiClient.post<PagePublishResponse>("/api/page/me/publish");
  },

  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload<UploadResponse>("/api/page/me/upload", formData);
  },

  /**
   * 获取用户的公开页面配置（无需认证）
   */
  async getPublishedConfig(slug: string): Promise<PageConfig> {
    // API 返回 { slug, displayName, config }
    const response = await apiClient.get<{ config: PageConfig }>(
      `/api/page/${slug}`,
      { skipAuth: true }
    );
    if ('config' in response) {
      return response.config;
    }
    return response as unknown as PageConfig;
  },
};

/**
 * 新闻轮播相关 API（图片导航）
 */
export const newsApi = {
  /**
   * 获取新闻图片列表（从 public/upload-img2/ 目录读取）
   */
  async getNewsItems(): Promise<Array<{
    id: string;
    src: string;
    alt: string;
    href: string;
  }>> {
    const response = await apiClient.get<{ items: Array<{
      id: string;
      src: string;
      alt: string;
      href: string;
    }> }>("/api/news", { skipAuth: true });
    return response.items || [];
  },
};

/**
 * 新闻文章相关 API
 */
export const newsArticleApi = {
  /**
   * 获取新闻文章列表
   */
  async getArticles(params?: {
    page?: number;
    limit?: number;
    category?: string;
    published?: boolean | null;
  }): Promise<NewsArticleListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.category) searchParams.set("category", params.category);
    if (params?.published !== undefined) {
      searchParams.set("published", params.published === null ? "null" : params.published.toString());
    }
    const query = searchParams.toString();
    return apiClient.get<NewsArticleListResponse>(
      `/api/news/articles${query ? `?${query}` : ""}`
    );
  },

  /**
   * 获取单篇文章
   */
  async getArticle(id: string): Promise<NewsArticle> {
    const response = await apiClient.get<NewsArticleResponse>(
      `/api/news/articles/${id}`,
      { skipAuth: true } // 公开文章无需认证
    );
    return response.article;
  },

  /**
   * 创建新文章
   */
  async createArticle(data: {
    title: string;
    content: string;
    category: string;
    tag?: string;
    shareUrl?: string;
    shareChannels?: Array<{ platform: string; enabled: boolean }>;
    backgroundType?: string;
    backgroundValue?: string;
    published?: boolean;
  }): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticleResponse>(
      "/api/news/articles",
      data
    );
    return response.article;
  },

  /**
   * 更新文章
   */
  async updateArticle(
    id: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      tag?: string;
      shareUrl?: string;
      shareChannels?: Array<{ platform: string; enabled: boolean }>;
      backgroundType?: string;
      backgroundValue?: string;
      published?: boolean;
    }
  ): Promise<NewsArticle> {
    const response = await apiClient.put<NewsArticleResponse>(
      `/api/news/articles/${id}`,
      data
    );
    return response.article;
  },

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<void> {
    await apiClient.delete(`/api/news/articles/${id}`);
  },
};

