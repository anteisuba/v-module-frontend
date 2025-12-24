// lib/api/client.ts

import { ApiError, NetworkError, parseApiError } from "./errors";
import type { ApiResponse } from "./types";

/**
 * API 客户端配置
 */
interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * 请求选项
 */
interface RequestOptions extends RequestInit {
  skipAuth?: boolean; // 是否跳过认证检查（用于登录、注册等公开接口）
}

/**
 * 统一的 API 客户端
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || "";
    this.timeout = config.timeout || 30000; // 默认 30 秒超时
  }

  /**
   * 发起请求
   */
  private async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
        // 默认包含 credentials，确保 cookie 被发送
        credentials: "include",
      });

      clearTimeout(timeoutId);

      // 尝试解析 JSON
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        // 如果响应不是 JSON，使用空对象
        data = {};
      }

      // 处理未授权错误（401）
      if (response.status === 401 && !skipAuth) {
        // 在客户端环境下重定向到登录页
        // 但如果当前已经在登录页，避免无限循环
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          // 如果当前路径已经是 /admin，不要再次重定向，避免无限循环
          if (!currentPath.startsWith("/admin")) {
            window.location.href = `/admin?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        throw new ApiError("未授权，请先登录", 401, "UNAUTHORIZED");
      }

      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw parseApiError(response, data);
      }

      // 返回数据
      // API 路由可能直接返回数据对象，也可能包装在 { data: ... } 中
      // 如果已经有 ok 字段且为 true，说明是标准响应格式
      const responseData = data as ApiResponse<T> & T;
      if ('data' in responseData && responseData.ok !== false) {
        return responseData.data as T;
      }
      // 直接返回数据（大多数API路由直接返回数据对象）
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // 如果是我们自定义的错误，直接抛出
      if (error instanceof ApiError) {
        throw error;
      }

      // 处理 AbortError（超时）
      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError("请求超时，请稍后再试");
      }

      // 其他网络错误
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new NetworkError("网络连接失败，请检查网络设置");
      }

      // 未知错误
      throw error instanceof Error
        ? error
        : new Error("未知错误，请稍后再试");
    }
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
      cache: options.cache || "no-store", // 默认禁用缓存
    });
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * 文件上传（FormData）
   */
  async upload<T = unknown>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method: "POST",
        body: formData,
        signal: controller.signal,
        credentials: "include",
        // 不设置 Content-Type，让浏览器自动设置（包含 boundary）
      });

      clearTimeout(timeoutId);

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401 && !options.skipAuth) {
        // 如果当前路径已经是 /admin，不要再次重定向，避免无限循环
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith("/admin")) {
            window.location.href = `/admin?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        throw new ApiError("未授权，请先登录", 401, "UNAUTHORIZED");
      }

      if (!response.ok) {
        throw parseApiError(response, data);
      }

      const responseData = data as ApiResponse<T>;
      return (responseData.data ?? responseData) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError("上传超时，请稍后再试");
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new NetworkError("网络连接失败，请检查网络设置");
      }

      throw error instanceof Error
        ? error
        : new Error("上传失败，请稍后再试");
    }
  }
}

// 导出单例实例
export const apiClient = new ApiClient();

// 导出类，以便需要时可以创建新实例
export { ApiClient };

