// lib/api/types.ts

import type { PageConfig } from "@/domain/page-config/types";
import type { MediaAssetReference } from "@/domain/media/references";
import type {
  MediaAssetUsageContext,
  MediaAssetUsageFilter,
} from "@/domain/media/usage";

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
  themeColor?: string;
  fontFamily?: string;
}

export interface PagePublishResponse {
  ok: boolean;
  publishedConfig: PageConfig;
  themeColor?: string;
  fontFamily?: string;
}

export interface PageUpdateResponse {
  ok: boolean;
  pageConfig: PageConfig;
  themeColor?: string;
  fontFamily?: string;
}

/**
 * 文件上传响应
 */
export interface UploadResponse {
  src: string;
  mimeType: string;
  size: number;
  asset?: MediaAssetSummary;
}

export interface MediaAssetSummary {
  id: string;
  src: string;
  mimeType: string;
  size: number;
  originalName: string | null;
  usageContexts: MediaAssetUsageContext[];
  isInUse: boolean;
  referenceCount: number;
  references: MediaAssetReference[];
  createdAt: string;
}

export interface MediaAssetListResponse {
  assets: MediaAssetSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadImageOptions {
  usageContext?: MediaAssetUsageContext;
}

export interface MediaAssetListParams {
  page?: number;
  limit?: number;
  query?: string;
  usageContext?: MediaAssetUsageFilter;
}

export interface MediaAssetUsageResponse {
  ok: boolean;
  assets: MediaAssetSummary[];
}

export interface DeleteMediaAssetsResponse {
  ok: boolean;
  deletedIds: string[];
  deletedCount: number;
}

export interface ReplaceMediaAssetReferencesResponse {
  ok: boolean;
  replacedReferenceCount: number;
  updatedEntityCount: number;
}

export interface SellerPayoutAccountSummary {
  id: string;
  provider: string;
  providerAccountId: string;
  status: string;
  accountType: string;
  country: string | null;
  defaultCurrency: string | null;
  businessType: string | null;
  displayNameSnapshot: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsCurrentlyDue: string[];
  requirementsEventuallyDue: string[];
  requirementsPastDue: string[];
  disabledReason: string | null;
  bankNameMasked: string | null;
  bankLast4Masked: string | null;
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
  lastSyncedAt: string | null;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayoutAccountResponse {
  account: SellerPayoutAccountSummary | null;
}

export interface StripeConnectOnboardingLinkResponse {
  account: SellerPayoutAccountSummary;
  url: string;
  expiresAt: string | null;
}

export interface StripeConnectDashboardLinkResponse {
  account: SellerPayoutAccountSummary;
  url: string;
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
  userSlug?: string | null; // 用户 slug，用于加载页面配置
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

