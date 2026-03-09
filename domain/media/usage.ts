export const PAGE_BACKGROUND = "PAGE_BACKGROUND";
export const BLOG_LIST_BACKGROUND = "BLOG_LIST_BACKGROUND";
export const BLOG_DETAIL_BACKGROUND = "BLOG_DETAIL_BACKGROUND";
export const BLOG_COVER = "BLOG_COVER";
export const SHOP_LIST_BACKGROUND = "SHOP_LIST_BACKGROUND";
export const SHOP_DETAIL_BACKGROUND = "SHOP_DETAIL_BACKGROUND";
export const PRODUCT_IMAGE = "PRODUCT_IMAGE";
export const NEWS_PAGE_BACKGROUND = "NEWS_PAGE_BACKGROUND";
export const NEWS_ARTICLE_BACKGROUND = "NEWS_ARTICLE_BACKGROUND";
export const HERO_LOGO = "HERO_LOGO";
export const HERO_SLIDE = "HERO_SLIDE";
export const NEWS_ITEM = "NEWS_ITEM";

export const MEDIA_ASSET_USAGE_CONTEXTS = [
  PAGE_BACKGROUND,
  BLOG_LIST_BACKGROUND,
  BLOG_DETAIL_BACKGROUND,
  BLOG_COVER,
  SHOP_LIST_BACKGROUND,
  SHOP_DETAIL_BACKGROUND,
  PRODUCT_IMAGE,
  NEWS_PAGE_BACKGROUND,
  NEWS_ARTICLE_BACKGROUND,
  HERO_LOGO,
  HERO_SLIDE,
  NEWS_ITEM,
] as const;

export type MediaAssetUsageContext =
  (typeof MEDIA_ASSET_USAGE_CONTEXTS)[number];

export const MEDIA_ASSET_USAGE_FILTERS = [
  "ALL",
  "UNSPECIFIED",
  ...MEDIA_ASSET_USAGE_CONTEXTS,
] as const;

export type MediaAssetUsageFilter =
  (typeof MEDIA_ASSET_USAGE_FILTERS)[number];

export const MEDIA_ASSET_USAGE_LABEL_KEYS: Record<
  MediaAssetUsageContext,
  string
> = {
  PAGE_BACKGROUND: "mediaLibrary.usage.pageBackground",
  BLOG_LIST_BACKGROUND: "mediaLibrary.usage.blogListBackground",
  BLOG_DETAIL_BACKGROUND: "mediaLibrary.usage.blogDetailBackground",
  BLOG_COVER: "mediaLibrary.usage.blogCover",
  SHOP_LIST_BACKGROUND: "mediaLibrary.usage.shopListBackground",
  SHOP_DETAIL_BACKGROUND: "mediaLibrary.usage.shopDetailBackground",
  PRODUCT_IMAGE: "mediaLibrary.usage.productImage",
  NEWS_PAGE_BACKGROUND: "mediaLibrary.usage.newsPageBackground",
  NEWS_ARTICLE_BACKGROUND: "mediaLibrary.usage.newsArticleBackground",
  HERO_LOGO: "mediaLibrary.usage.heroLogo",
  HERO_SLIDE: "mediaLibrary.usage.heroSlide",
  NEWS_ITEM: "mediaLibrary.usage.newsItem",
};

export function isMediaAssetUsageContext(
  value: string | null | undefined
): value is MediaAssetUsageContext {
  return Boolean(
    value &&
      (MEDIA_ASSET_USAGE_CONTEXTS as readonly string[]).includes(value)
  );
}

export function isMediaAssetUsageFilter(
  value: string | null | undefined
): value is MediaAssetUsageFilter {
  return Boolean(
    value && (MEDIA_ASSET_USAGE_FILTERS as readonly string[]).includes(value)
  );
}

export function normalizeMediaAssetUsageContexts(
  values: readonly string[] | null | undefined
): MediaAssetUsageContext[] {
  const normalized = new Set<MediaAssetUsageContext>();

  for (const value of values || []) {
    if (isMediaAssetUsageContext(value)) {
      normalized.add(value);
    }
  }

  return Array.from(normalized);
}

export function appendMediaAssetUsageContext(
  values: readonly string[] | null | undefined,
  usageContext: MediaAssetUsageContext
): MediaAssetUsageContext[] {
  return normalizeMediaAssetUsageContexts([...(values || []), usageContext]);
}
