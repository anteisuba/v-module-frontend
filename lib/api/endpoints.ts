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
  UploadImageOptions,
  MediaAssetListResponse,
  MediaAssetListParams,
  MediaAssetUsageResponse,
  DeleteMediaAssetsResponse,
  ReplaceMediaAssetReferencesResponse,
  SellerPayoutAccountResponse,
  StripeConnectDashboardLinkResponse,
  StripeConnectOnboardingLinkResponse,
  SellerPayoutAccountSummary,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  NewsArticle,
  NewsArticleListResponse,
  NewsArticleResponse,
} from "./types";
import type { PageConfig } from "@/domain/page-config/types";
import type {
  CheckoutSessionResult,
  PaymentReconciliationReport,
  PaymentSettlementReport,
  PaymentSettlementSyncResult,
  SerializedOrder,
  SerializedOrderRefund,
} from "@/domain/shop";
import type {
  MediaAssetUsageContext,
  MediaAssetUsageFilter,
} from "@/domain/media/usage";

type BlogCommentStatus = "PENDING" | "APPROVED" | "REJECTED";

type ApiBlogComment = {
  id: string;
  blogPostId: string;
  userName: string;
  userEmail: string | null;
  content: string;
  status: BlogCommentStatus;
  createdAt: string;
  moderatedAt: string | null;
  user: {
    id: string;
    slug: string;
    displayName: string | null;
  } | null;
};

type ApiModerationBlogComment = ApiBlogComment & {
  blogPost: {
    id: string;
    title: string;
    published: boolean;
  };
};

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
    if ("user" in response && response.user) {
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
   * 获取当前用户的草稿配置（包含主题设置）
   */
  async getDraftConfig(): Promise<PageConfig> {
    const response = await apiClient.get<PageDraftConfigResponse>(
      "/api/page/me"
    );
    // API 返回 { draftConfig: {...} }
    if ("draftConfig" in response) {
      return response.draftConfig;
    }
    // 如果直接返回配置对象（不应该发生，但为了兼容性）
    return response as unknown as PageConfig;
  },

  /**
   * 获取当前用户的完整页面数据（包含主题设置）
   */
  async getFullPageData(): Promise<PageDraftConfigResponse> {
    return apiClient.get<PageDraftConfigResponse>("/api/page/me");
  },

  /**
   * 更新当前用户的草稿配置
   */
  async updateDraftConfig(
    draftConfig: PageConfig,
    options?: { themeColor?: string; fontFamily?: string }
  ): Promise<PageUpdateResponse> {
    return apiClient.put<PageUpdateResponse>("/api/page/me", {
      draftConfig,
      ...options,
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
  async uploadImage(
    file: File,
    options?: UploadImageOptions
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.usageContext) {
      formData.append("usageContext", options.usageContext);
    }
    return apiClient.upload<UploadResponse>("/api/page/me/upload", formData);
  },

  /**
   * 获取当前用户的媒体资产
   */
  async getMediaAssets(
    params?: MediaAssetListParams
  ): Promise<MediaAssetListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.query) searchParams.set("query", params.query);
    if (params?.usageContext) {
      searchParams.set("usageContext", params.usageContext);
    }
    const query = searchParams.toString();
    return apiClient.get<MediaAssetListResponse>(
      `/api/media-assets${query ? `?${query}` : ""}`
    );
  },

  /**
   * 为媒体资产补充使用场景
   */
  async addMediaAssetUsage(
    ids: string[],
    usageContext: MediaAssetUsageContext
  ): Promise<MediaAssetUsageResponse> {
    return apiClient.patch<MediaAssetUsageResponse>("/api/media-assets", {
      ids,
      usageContext,
      action: "ADD",
    });
  },

  /**
   * 批量移除媒体资产使用场景
   */
  async removeMediaAssetUsage(
    ids: string[],
    usageContext: MediaAssetUsageContext
  ): Promise<MediaAssetUsageResponse> {
    return apiClient.patch<MediaAssetUsageResponse>("/api/media-assets", {
      ids,
      usageContext,
      action: "REMOVE",
    });
  },

  /**
   * 清空媒体资产使用场景
   */
  async clearMediaAssetUsage(ids: string[]): Promise<MediaAssetUsageResponse> {
    return apiClient.patch<MediaAssetUsageResponse>("/api/media-assets", {
      ids,
      action: "CLEAR",
    });
  },

  /**
   * 删除媒体资产
   */
  async deleteMediaAssets(
    ids: string[]
  ): Promise<DeleteMediaAssetsResponse> {
    return apiClient.deleteJson<DeleteMediaAssetsResponse>(
      "/api/media-assets",
      { ids }
    );
  },

  /**
   * 直接替换媒体资产引用
   */
  async replaceMediaAssetReferences(
    sourceAssetId: string,
    targetAssetId: string
  ): Promise<ReplaceMediaAssetReferencesResponse> {
    return apiClient.post<ReplaceMediaAssetReferencesResponse>(
      "/api/media-assets/replace",
      {
        sourceAssetId,
        targetAssetId,
      }
    );
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
    if ("config" in response) {
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
  async getNewsItems(): Promise<
    Array<{
      id: string;
      src: string;
      alt: string;
      href: string;
    }>
  > {
    const response = await apiClient.get<{
      items: Array<{
        id: string;
        src: string;
        alt: string;
        href: string;
      }>;
    }>("/api/news", { skipAuth: true });
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
      searchParams.set(
        "published",
        params.published === null ? "null" : params.published.toString()
      );
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

/**
 * 博客相关 API
 */
export const blogApi = {
  /**
   * 获取博客文章列表
   */
  async getPosts(params?: {
    page?: number;
    limit?: number;
    userSlug?: string;
    published?: boolean | null;
  }): Promise<{
    posts: Array<{
      id: string;
      userId: string;
      userSlug: string | null;
      title: string;
      content: string;
      coverImage: string | null;
      videoUrl: string | null;
      externalLinks: Array<{ url: string; label: string }> | null;
      published: boolean;
      createdAt: string;
      updatedAt: string;
      publishedAt: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.userSlug) searchParams.set("userSlug", params.userSlug);
    if (params?.published !== undefined) {
      searchParams.set(
        "published",
        params.published === null ? "null" : params.published.toString()
      );
    }
    const query = searchParams.toString();
    return apiClient.get(`/api/blog/posts${query ? `?${query}` : ""}`);
  },

  /**
   * 获取单篇博客文章
   */
  async getPost(id: string): Promise<{
    id: string;
    userId: string;
    userSlug: string | null;
    title: string;
    content: string;
    coverImage: string | null;
    videoUrl: string | null;
    externalLinks: Array<{ url: string; label: string }> | null;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
  }> {
    const response = await apiClient.get<{ post: any }>(
      `/api/blog/posts/${id}`
    );
    return response.post;
  },

  /**
   * 创建博客文章
   */
  async createPost(data: {
    title: string;
    content: string;
    coverImage?: string | null;
    videoUrl?: string | null;
    externalLinks?: Array<{ url: string; label: string }> | null;
    published?: boolean;
  }): Promise<any> {
    const response = await apiClient.post<{ post: any }>(
      "/api/blog/posts",
      data
    );
    return response.post;
  },

  /**
   * 更新博客文章
   */
  async updatePost(
    id: string,
    data: {
      title?: string;
      content?: string;
      coverImage?: string | null;
      videoUrl?: string | null;
      externalLinks?: Array<{ url: string; label: string }> | null;
      published?: boolean;
    }
  ): Promise<any> {
    const response = await apiClient.put<{ post: any }>(
      `/api/blog/posts/${id}`,
      data
    );
    return response.post;
  },

  /**
   * 删除博客文章
   */
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/api/blog/posts/${id}`);
  },

  /**
   * 点赞/取消点赞博客
   */
  async toggleLike(id: string, userEmail?: string): Promise<{ liked: boolean }> {
    return apiClient.post(`/api/blog/posts/${id}/like`, { userEmail });
  },

  /**
   * 获取点赞状态和数量
   */
  async getLikeStatus(id: string, userEmail?: string): Promise<{
    likeCount: number;
    isLiked: boolean;
  }> {
    const params = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : "";
    return apiClient.get(`/api/blog/posts/${id}/like${params}`);
  },

  /**
   * 创建评论
   */
  async createComment(
    id: string,
    data: { userName: string; userEmail?: string; content: string }
  ): Promise<ApiBlogComment> {
    return apiClient.post(`/api/blog/posts/${id}/comments`, data);
  },

  /**
   * 获取评论列表
   */
  async getComments(
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    comments: ApiBlogComment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    const query = searchParams.toString();
    return apiClient.get(`/api/blog/posts/${id}/comments${query ? `?${query}` : ""}`);
  },

  /**
   * 获取评论审核列表
   */
  async getModerationComments(params?: {
    page?: number;
    limit?: number;
    status?: BlogCommentStatus;
    query?: string;
  }): Promise<{
    comments: ApiModerationBlogComment[];
    summary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    const query = searchParams.toString();
    return apiClient.get(`/api/blog/comments${query ? `?${query}` : ""}`);
  },

  /**
   * 更新评论审核状态
   */
  async updateCommentStatus(
    id: string,
    status: BlogCommentStatus
  ): Promise<ApiModerationBlogComment> {
    const response = await apiClient.put<{ comment: ApiModerationBlogComment }>(
      `/api/blog/comments/${id}`,
      { status }
    );
    return response.comment;
  },

  /**
   * 删除评论
   */
  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/api/blog/comments/${id}`);
  },
};

/**
 * 商店相关 API
 */
export const shopApi = {
  /**
   * 获取商品列表
   */
  async getProducts(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    products: Array<{
      id: string;
      userId: string;
      userSlug: string | null;
      name: string;
      description: string | null;
      price: number;
      stock: number;
      images: string[];
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiClient.get(`/api/shop/products${query ? `?${query}` : ""}`);
  },

  /**
   * 获取单个商品
   */
  async getProduct(id: string): Promise<{
    id: string;
    userId: string;
    userSlug: string | null;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    images: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await apiClient.get<{ product: any }>(
      `/api/shop/products/${id}`
    );
    return response.product;
  },

  /**
   * 创建商品
   */
  async createProduct(data: {
    name: string;
    description?: string | null;
    price: number;
    stock?: number;
    images: string[];
    status?: string;
  }): Promise<any> {
    const response = await apiClient.post<{ product: any }>(
      "/api/shop/products",
      data
    );
    return response.product;
  },

  /**
   * 更新商品
   */
  async updateProduct(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      price?: number;
      stock?: number;
      images?: string[];
      status?: string;
    }
  ): Promise<any> {
    const response = await apiClient.put<{ product: any }>(
      `/api/shop/products/${id}`,
      data
    );
    return response.product;
  },

  /**
   * 删除商品
   */
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/api/shop/products/${id}`);
  },

  /**
   * 获取订单列表（卖家）
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    query?: string;
  }): Promise<{
    orders: SerializedOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    const query = searchParams.toString();
    return apiClient.get(`/api/shop/orders${query ? `?${query}` : ""}`);
  },

  /**
   * 导出订单 CSV（卖家）
   */
  async exportOrdersCsv(params?: {
    status?: string;
    query?: string;
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    searchParams.set("export", "csv");

    const response = await fetch(`/api/shop/orders?${searchParams.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = "导出订单失败";

      try {
        const errorData = (await response.json()) as { error?: string; message?: string };
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // noop
      }

      throw new Error(errorMessage);
    }

    return response.blob();
  },

  /**
   * 获取订单详情（卖家会话）
   */
  async getOrder(id: string): Promise<SerializedOrder> {
    const response = await apiClient.get<{ order: SerializedOrder }>(
      `/api/shop/orders/${id}`
    );
    return response.order;
  },

  /**
   * 获取公开订单详情（访客需提供下单邮箱）
   */
  async getPublicOrder(id: string, buyerEmail: string): Promise<SerializedOrder> {
    const response = await apiClient.get<{ order: SerializedOrder }>(
      `/api/shop/orders/${id}?buyerEmail=${encodeURIComponent(buyerEmail.trim())}`,
      { skipAuth: true }
    );
    return response.order;
  },

  /**
   * 公开确认 Stripe Checkout 成功回流
   */
  async confirmPublicOrder(
    id: string,
    buyerEmail: string,
    sessionId: string
  ): Promise<SerializedOrder> {
    const response = await apiClient.post<{ order: SerializedOrder }>(
      `/api/shop/orders/${id}/confirm`,
      {
        buyerEmail: buyerEmail.trim(),
        sessionId: sessionId.trim(),
      },
      { skipAuth: true }
    );
    return response.order;
  },

  /**
   * 公开结账创建订单
   */
  async createCheckoutOrder(data: {
    buyerEmail: string;
    buyerName?: string | null;
    shippingAddress?: Record<string, unknown> | null;
    shippingMethod?: string | null;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<CheckoutSessionResult> {
    const response = await apiClient.post<{ checkout: CheckoutSessionResult }>(
      "/api/shop/checkout",
      data,
      { skipAuth: true }
    );
    return response.checkout;
  },

  /**
   * 更新订单状态
   */
  async updateOrderStatus(
    id: string,
    status: string
  ): Promise<SerializedOrder> {
    const response = await apiClient.put<{ order: SerializedOrder }>(
      `/api/shop/orders/${id}`,
      { status }
    );
    return response.order;
  },

  /**
   * 创建订单退款（卖家）
   */
  async createOrderRefund(
    id: string,
    data?: { amount?: number | null; reason?: string | null }
  ): Promise<{ order: SerializedOrder; refund: SerializedOrderRefund }> {
    return apiClient.post<{ order: SerializedOrder; refund: SerializedOrderRefund }>(
      `/api/shop/orders/${id}/refunds`,
      data || {}
    );
  },

  /**
   * 获取 Stripe 对账报表
   */
  async getPaymentReconciliationReport(params?: {
    start?: string;
    end?: string;
  }): Promise<PaymentReconciliationReport> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    const query = searchParams.toString();

    return apiClient.get(
      `/api/shop/payments/reconciliation${query ? `?${query}` : ""}`
    );
  },

  /**
   * 导出 Stripe 支付事件 CSV
   */
  async exportPaymentEventsCsv(params?: {
    start?: string;
    end?: string;
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    searchParams.set("export", "events");

    const response = await fetch(
      `/api/shop/payments/reconciliation?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let errorMessage = "导出支付事件失败";

      try {
        const errorData = (await response.json()) as {
          error?: string;
          message?: string;
        };
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // noop
      }

      throw new Error(errorMessage);
    }

    return response.blob();
  },

  /**
   * 导出对账异常 CSV
   */
  async exportPaymentAnomaliesCsv(params?: {
    start?: string;
    end?: string;
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    searchParams.set("export", "anomalies");

    const response = await fetch(
      `/api/shop/payments/reconciliation?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let errorMessage = "导出对账异常失败";

      try {
        const errorData = (await response.json()) as {
          error?: string;
          message?: string;
        };
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // noop
      }

      throw new Error(errorMessage);
    }

    return response.blob();
  },

  /**
   * 获取 Stripe 结算核销报表
   */
  async getPaymentSettlementReport(params?: {
    start?: string;
    end?: string;
  }): Promise<PaymentSettlementReport> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    const query = searchParams.toString();

    return apiClient.get(
      `/api/shop/payments/settlements${query ? `?${query}` : ""}`
    );
  },

  /**
   * 同步 Stripe 结算流水和 payout
   */
  async syncPaymentSettlementLedger(params?: {
    start?: string | null;
    end?: string | null;
  }): Promise<{
    sync: PaymentSettlementSyncResult;
    report: PaymentSettlementReport;
  }> {
    return apiClient.post("/api/shop/payments/settlements", {
      start: params?.start || null,
      end: params?.end || null,
    });
  },

  /**
   * 批量更新结算流水核销状态
   */
  async updatePaymentSettlementEntries(data: {
    ids: string[];
    reconciliationStatus: "OPEN" | "RECONCILED" | "IGNORED";
    note?: string | null;
    start?: string | null;
    end?: string | null;
  }): Promise<{
    updated: {
      updatedCount: number;
    };
    report: PaymentSettlementReport;
  }> {
    return apiClient.patch("/api/shop/payments/settlements", {
      ids: data.ids,
      reconciliationStatus: data.reconciliationStatus,
      note: data.note || null,
      start: data.start || null,
      end: data.end || null,
    });
  },
};

export const connectApi = {
  async getMyPayoutAccount(): Promise<SellerPayoutAccountSummary | null> {
    const response = await apiClient.get<SellerPayoutAccountResponse>(
      "/api/payments/connect/accounts/me"
    );
    return response.account;
  },

  async createPayoutAccount(): Promise<SellerPayoutAccountSummary> {
    const response = await apiClient.post<SellerPayoutAccountResponse>(
      "/api/payments/connect/accounts"
    );

    if (!response.account) {
      throw new Error("Stripe payout account was not created");
    }

    return response.account;
  },

  async syncPayoutAccount(): Promise<SellerPayoutAccountSummary | null> {
    const response = await apiClient.post<SellerPayoutAccountResponse>(
      "/api/payments/connect/accounts/sync"
    );
    return response.account;
  },

  async createOnboardingLink(): Promise<StripeConnectOnboardingLinkResponse> {
    return apiClient.post<StripeConnectOnboardingLinkResponse>(
      "/api/payments/connect/accounts/onboarding-link"
    );
  },

  async createDashboardLink(): Promise<StripeConnectDashboardLinkResponse> {
    return apiClient.post<StripeConnectDashboardLinkResponse>(
      "/api/payments/connect/accounts/dashboard-link"
    );
  },
};
