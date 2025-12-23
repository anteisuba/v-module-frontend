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

