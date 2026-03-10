import { cookies } from "next/headers";
import type { PageConfig } from "@/domain/page-config/types";
import { normalizePageConfig } from "@/utils/pageConfig";

export const E2E_PUBLIC_PAGE_STATE_COOKIE = "vtuber_e2e_public_page_state";

export interface E2EPublicBlogComment {
  id: string;
  blogPostId: string;
  userName: string;
  userEmail: string | null;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  moderatedAt: string | null;
  user: {
    id: string;
    slug: string;
    displayName: string | null;
  } | null;
}

export interface E2EPublicBlogPost {
  id: string;
  userSlug: string | null;
  userDisplayName: string | null;
  title: string;
  content: string;
  coverImage: string | null;
  createdAt: string;
  publishedAt: string | null;
  published: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  videoUrl: string | null;
  externalLinks: Array<{ url: string; label: string }> | null;
  comments: E2EPublicBlogComment[];
}

export interface E2EPublicProduct {
  id: string;
  userSlug: string | null;
  userDisplayName: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  status: string;
}

export interface E2EPublicPageState {
  slug: string;
  displayName: string | null;
  themeColor: string;
  fontFamily: string;
  publishedConfig: PageConfig;
  blogPosts: E2EPublicBlogPost[];
  products: E2EPublicProduct[];
}

export interface E2EPublicSiteState {
  pages: E2EPublicPageState[];
  blogFeed: E2EPublicBlogPost[];
  shopCatalog: E2EPublicProduct[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeExternalLinks(
  value: unknown
): Array<{ url: string; label: string }> | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const links = value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const url = readString(entry.url);

      if (!url) {
        return null;
      }

      return {
        url,
        label: readString(entry.label, url),
      };
    })
    .filter((entry): entry is { url: string; label: string } => entry !== null);

  return links.length > 0 ? links : null;
}

function normalizeBlogComment(value: unknown): E2EPublicBlogComment | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const blogPostId = readString(value.blogPostId);
  const userName = readString(value.userName);
  const content = readString(value.content);

  if (!id || !blogPostId || !userName || !content) {
    return null;
  }

  const user = isRecord(value.user)
    ? {
        id: readString(value.user.id),
        slug: readString(value.user.slug),
        displayName: readNullableString(value.user.displayName),
      }
    : null;

  return {
    id,
    blogPostId,
    userName,
    userEmail: readNullableString(value.userEmail),
    content,
    status:
      value.status === "PENDING" ||
      value.status === "APPROVED" ||
      value.status === "REJECTED"
        ? value.status
        : "APPROVED",
    createdAt: readString(value.createdAt, new Date(0).toISOString()),
    moderatedAt: readNullableString(value.moderatedAt),
    user:
      user && user.id && user.slug
        ? user
        : null,
  };
}

function normalizeBlogPost(value: unknown): E2EPublicBlogPost | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const title = readString(value.title);
  const content = readString(value.content);

  if (!id || !title || !content) {
    return null;
  }

  return {
    id,
    userSlug: readNullableString(value.userSlug),
    userDisplayName: readNullableString(value.userDisplayName),
    title,
    content,
    coverImage: readNullableString(value.coverImage),
    createdAt: readString(value.createdAt, new Date(0).toISOString()),
    publishedAt: readNullableString(value.publishedAt),
    published: readBoolean(value.published, true),
    likeCount: readNumber(value.likeCount),
    commentCount: readNumber(value.commentCount),
    isLiked: readBoolean(value.isLiked),
    videoUrl: readNullableString(value.videoUrl),
    externalLinks: normalizeExternalLinks(value.externalLinks),
    comments: Array.isArray(value.comments)
      ? value.comments
          .map(normalizeBlogComment)
          .filter((comment): comment is E2EPublicBlogComment => comment !== null)
      : [],
  };
}

function normalizeProduct(value: unknown): E2EPublicProduct | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const name = readString(value.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    userSlug: readNullableString(value.userSlug),
    userDisplayName: readNullableString(value.userDisplayName),
    name,
    description: readNullableString(value.description),
    price: readNumber(value.price),
    stock: readNumber(value.stock),
    images: Array.isArray(value.images)
      ? value.images.filter((item): item is string => typeof item === "string")
      : [],
    status: readString(value.status, "PUBLISHED"),
  };
}

function normalizePageState(value: unknown): E2EPublicPageState | null {
  if (!isRecord(value)) {
    return null;
  }

  const slug = readString(value.slug);

  if (!slug) {
    return null;
  }

  return {
    slug,
    displayName: readNullableString(value.displayName),
    themeColor: readString(value.themeColor, "#000000"),
    fontFamily: readString(value.fontFamily, "Inter"),
    publishedConfig: normalizePageConfig(value.publishedConfig),
    blogPosts: Array.isArray(value.blogPosts)
      ? value.blogPosts
          .map(normalizeBlogPost)
          .filter((post): post is E2EPublicBlogPost => post !== null)
      : [],
    products: Array.isArray(value.products)
      ? value.products
          .map(normalizeProduct)
          .filter((product): product is E2EPublicProduct => product !== null)
      : [],
  };
}

function normalizeSiteState(parsed: unknown): E2EPublicSiteState | null {
  const normalizedLegacyPage = normalizePageState(parsed);

  if (normalizedLegacyPage) {
    return {
      pages: [normalizedLegacyPage],
      blogFeed: normalizedLegacyPage.blogPosts,
      shopCatalog: normalizedLegacyPage.products,
    };
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const pages = Array.isArray(parsed.pages)
    ? parsed.pages
        .map(normalizePageState)
        .filter((page): page is E2EPublicPageState => page !== null)
    : [];

  return {
    pages,
    blogFeed: Array.isArray(parsed.blogFeed)
      ? parsed.blogFeed
          .map(normalizeBlogPost)
          .filter((post): post is E2EPublicBlogPost => post !== null)
      : pages.flatMap((page) => page.blogPosts),
    shopCatalog: Array.isArray(parsed.shopCatalog)
      ? parsed.shopCatalog
          .map(normalizeProduct)
          .filter((product): product is E2EPublicProduct => product !== null)
      : pages.flatMap((page) => page.products),
  };
}

export async function getE2EPublicSiteState(): Promise<E2EPublicSiteState | null> {
  if (process.env.E2E_BYPASS_AUTH !== "1") {
    return null;
  }

  const cookieStore = await cookies();
  const rawValue = cookieStore.get(E2E_PUBLIC_PAGE_STATE_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    return normalizeSiteState(JSON.parse(decodeURIComponent(rawValue)));
  } catch {
    return null;
  }
}

export function findE2EPublicPageState(
  siteState: E2EPublicSiteState | null,
  slug: string
): E2EPublicPageState | null {
  if (!siteState) {
    return null;
  }

  return siteState.pages.find((page) => page.slug === slug) ?? null;
}

export function getE2EPublicBlogFeed(
  siteState: E2EPublicSiteState | null
): E2EPublicBlogPost[] | null {
  return siteState ? siteState.blogFeed : null;
}

export function getE2EPublicShopCatalog(
  siteState: E2EPublicSiteState | null
): E2EPublicProduct[] | null {
  return siteState ? siteState.shopCatalog : null;
}

export function getE2EPublicPageBlogPosts(
  siteState: E2EPublicSiteState | null,
  slug: string
): E2EPublicBlogPost[] | null {
  const pageState = findE2EPublicPageState(siteState, slug);

  return pageState ? pageState.blogPosts : null;
}

export function getE2EPublicPageBlogPost(
  siteState: E2EPublicSiteState | null,
  slug: string,
  id: string
): E2EPublicBlogPost | null {
  const pageState = findE2EPublicPageState(siteState, slug);

  if (!pageState) {
    return null;
  }

  return pageState.blogPosts.find((post) => post.id === id) ?? null;
}

export function getE2EPublicPageProducts(
  siteState: E2EPublicSiteState | null,
  slug: string
): E2EPublicProduct[] | null {
  const pageState = findE2EPublicPageState(siteState, slug);

  return pageState ? pageState.products : null;
}

export function getE2EPublicPageProduct(
  siteState: E2EPublicSiteState | null,
  slug: string,
  id: string
): E2EPublicProduct | null {
  const pageState = findE2EPublicPageState(siteState, slug);

  if (!pageState) {
    return null;
  }

  return pageState.products.find((product) => product.id === id) ?? null;
}

export async function getE2EPublicPageState(
  slug: string
): Promise<E2EPublicPageState | null> {
  return findE2EPublicPageState(await getE2EPublicSiteState(), slug);
}
