import type { BrowserContext, Page, Route } from "@playwright/test";
import type { PageConfig } from "../../../domain/page-config/types";
import type { SerializedOrder } from "../../../domain/shop";
import { localeCookieName } from "../../../i18n/config";
import type { MediaAssetSummary } from "../../../lib/api/types";
import type { NewsArticle } from "../../../lib/api/types";
import type {
  E2EPublicBlogPost,
  E2EPublicPageState,
  E2EPublicProduct,
  E2EPublicSiteState,
} from "../../../lib/e2e/publicPageState";

const ADMIN_BYPASS_COOKIE = {
  name: "vtuber_e2e_bypass",
  value: "1",
  domain: "127.0.0.1",
  path: "/",
};

const LOCALE_COOKIE = {
  name: localeCookieName,
  value: "zh",
  domain: "127.0.0.1",
  path: "/",
};

const PUBLIC_PAGE_STATE_COOKIE = "vtuber_e2e_public_page_state";

function serializeCookieValue(value: unknown) {
  return encodeURIComponent(JSON.stringify(value));
}

export async function bootstrapAdminE2E(
  context: BrowserContext,
  page: Page
) {
  await context.addCookies([ADMIN_BYPASS_COOKIE, LOCALE_COOKIE]);
  await page.addInitScript((locale) => {
    window.localStorage.setItem("locale", locale);
  }, LOCALE_COOKIE.value);
}

export async function fulfillJson(
  route: Route,
  payload: unknown,
  status = 200
) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

export function createPublicPageStateCookie(state: {
  slug: string;
  displayName?: string | null;
  themeColor?: string;
  fontFamily?: string;
  publishedConfig: PageConfig;
  blogPosts?: E2EPublicBlogPost[];
  products?: E2EPublicProduct[];
}) {
  return createPublicSiteStateCookie({
    pages: [
      {
        slug: state.slug,
        displayName: state.displayName ?? state.slug,
        themeColor: state.themeColor ?? "#000000",
        fontFamily: state.fontFamily ?? "Inter",
        publishedConfig: state.publishedConfig,
        blogPosts: state.blogPosts ?? [],
        products: state.products ?? [],
      },
    ],
    blogFeed: state.blogPosts ?? [],
    shopCatalog: state.products ?? [],
  });
}

export function createPublicSiteStateCookie(state: E2EPublicSiteState) {
  return `${PUBLIC_PAGE_STATE_COOKIE}=${serializeCookieValue(
    state
  )}; Path=/; SameSite=Lax`;
}

export async function setPublicSiteState(
  context: BrowserContext,
  state: E2EPublicSiteState
) {
  await context.addCookies([
    {
      name: PUBLIC_PAGE_STATE_COOKIE,
      value: serializeCookieValue(state),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}

export async function mockCurrentUser(page: Page) {
  await page.route("**/api/user/me", async (route) => {
    await fulfillJson(route, {
      ok: true,
      user: {
        id: "user-1",
        slug: "creator",
        email: "creator@example.com",
        displayName: "Creator",
      },
    });
  });
}

export function createPageConfig(
  overrides: Partial<PageConfig> = {}
): PageConfig {
  return {
    background: {
      type: "color",
      value: "#112233",
    },
    newsBackground: {
      type: "color",
      value: "#000000",
    },
    blogBackground: {
      type: "color",
      value: "#000000",
    },
    blogDetailBackground: {
      type: "color",
      value: "#000000",
    },
    shopBackground: {
      type: "color",
      value: "#000000",
    },
    shopDetailBackground: {
      type: "color",
      value: "#000000",
    },
    sections: [
      {
        id: "hero-1",
        type: "hero",
        enabled: true,
        order: 0,
        props: {
          slides: [
            {
              src: "/hero/nakajima.jpeg",
              alt: "Hero",
            },
          ],
          title: "Original title",
          subtitle: "Original subtitle",
        },
      },
    ],
    logo: {
      src: "/hero/2.jpeg",
      alt: "Logo",
      opacity: 1,
    },
    socialLinks: [],
    showHeroThumbStrip: true,
    showLogo: true,
    showSocialLinks: true,
    ...overrides,
  };
}

export function createPublicPageState(
  overrides: Partial<E2EPublicPageState> = {}
): E2EPublicPageState {
  return {
    slug: "creator",
    displayName: "Creator",
    themeColor: "#445566",
    fontFamily: "Noto Sans JP",
    publishedConfig: createPageConfig(),
    blogPosts: [],
    products: [],
    ...overrides,
  };
}

export function createBlogPost(
  overrides: Partial<E2EPublicBlogPost> = {}
): E2EPublicBlogPost {
  return {
    id: "post-1",
    userSlug: "creator",
    userDisplayName: "Creator",
    title: "New Original Song",
    content: "A full behind-the-scenes write-up for the new release.",
    coverImage: "/hero/3.jpeg",
    createdAt: "2026-03-10T00:00:00.000Z",
    publishedAt: "2026-03-10T00:00:00.000Z",
    published: true,
    likeCount: 12,
    commentCount: 1,
    isLiked: false,
    videoUrl: null,
    externalLinks: null,
    comments: [],
    ...overrides,
  };
}

export function createProduct(
  overrides: Partial<E2EPublicProduct> = {}
): E2EPublicProduct {
  return {
    id: "product-1",
    userSlug: "creator",
    userDisplayName: "Creator",
    name: "Creator Lightstick",
    description: "Limited tour lightstick with updated logo.",
    price: 4900,
    stock: 8,
    images: ["/hero/2.jpeg"],
    status: "PUBLISHED",
    ...overrides,
  };
}

export function createNewsArticle(
  overrides: Partial<NewsArticle> = {}
): NewsArticle {
  return {
    id: "article-1",
    userId: "author-1",
    userSlug: "creator",
    title: "Spring live announced",
    content: "Ticket information and venue details are now available.",
    category: "MEDIA",
    tag: "LIVE",
    shareUrl: "https://example.com/news/article-1",
    shareChannels: [],
    backgroundType: "color",
    backgroundValue: "#111111",
    published: true,
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
    publishedAt: "2026-03-10T00:00:00.000Z",
    ...overrides,
  };
}

export function createMediaAsset(
  overrides: Partial<MediaAssetSummary> = {}
): MediaAssetSummary {
  return {
    id: "asset-1",
    src: "/uploads/asset.jpg",
    mimeType: "image/jpeg",
    size: 1024,
    originalName: "asset.jpg",
    usageContexts: [],
    isInUse: false,
    referenceCount: 0,
    references: [],
    createdAt: "2026-03-10T00:00:00.000Z",
    ...overrides,
  };
}

export function createSerializedOrder(
  overrides: Partial<SerializedOrder> = {}
): SerializedOrder {
  return {
    id: "order-1",
    userId: "user-1",
    payoutAccountId: "payout-1",
    paymentRoutingMode: "PLATFORM",
    connectedAccountId: null,
    externalChargeId: "ch_test_123",
    externalTransferId: null,
    platformFeeAmount: null,
    sellerGrossAmount: null,
    sellerNetExpectedAmount: null,
    buyerEmail: "buyer@example.com",
    buyerName: "Buyer",
    totalAmount: 4900,
    currency: "JPY",
    status: "PAID",
    paymentProvider: "STRIPE",
    paymentStatus: "PAID",
    paymentSessionId: "cs_test_123",
    paymentIntentId: "pi_test_123",
    paymentExpiresAt: null,
    paymentFailedAt: null,
    paymentFailureReason: null,
    shippingAddress: {
      country: "JP",
      city: "Tokyo",
      line1: "1-2-3",
    },
    shippingMethod: "EMS",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
    paidAt: "2026-03-10T00:10:00.000Z",
    shippedAt: null,
    deliveredAt: null,
    refundedAmount: 0,
    pendingRefundAmount: 0,
    refundableAmount: 4900,
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 1,
        price: 4900,
        subtotal: 4900,
        createdAt: "2026-03-10T00:00:00.000Z",
        product: {
          id: "product-1",
          name: "Creator Lightstick",
          images: ["/hero/2.jpeg"],
        },
      },
    ],
    paymentAttempts: [
      {
        id: "attempt-1",
        orderId: "order-1",
        provider: "STRIPE",
        status: "PAID",
        amount: 4900,
        currency: "JPY",
        connectedAccountId: null,
        externalChargeId: "ch_test_123",
        externalTransferId: null,
        applicationFeeAmount: null,
        externalSessionId: "cs_test_123",
        externalPaymentIntentId: "pi_test_123",
        failureReason: null,
        metadata: null,
        createdAt: "2026-03-10T00:00:00.000Z",
        updatedAt: "2026-03-10T00:10:00.000Z",
        paidAt: "2026-03-10T00:10:00.000Z",
        failedAt: null,
        expiredAt: null,
      },
    ],
    refunds: [],
    disputes: [],
    ...overrides,
  };
}
