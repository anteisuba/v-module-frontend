import type { MediaAssetReference } from "./references";

export interface MediaAssetReferenceTarget {
  href: string;
}

function buildHref(
  pathname: string,
  params: Record<string, string | null | undefined> = {}
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getPageConfigTarget(field: string): MediaAssetReferenceTarget {
  if (field.startsWith("background.")) {
    return {
      href: buildHref("/admin/cms", {
        tab: "page",
        panel: "background",
        focus: "page-background",
      }),
    };
  }

  if (field.startsWith("logo.")) {
    return {
      href: buildHref("/admin/cms", {
        tab: "page",
        panel: "hero",
        focus: "hero-logo",
      }),
    };
  }

  if (field.startsWith("newsBackground.")) {
    return {
      href: buildHref("/admin/cms", {
        tab: "content",
        panel: "articles",
        focus: "news-background",
      }),
    };
  }

  if (field.startsWith("blogBackground.")) {
    return {
      href: buildHref("/admin/blog", {
        tab: "layout",
        panel: "list-background",
      }),
    };
  }

  if (field.startsWith("blogDetailBackground.")) {
    return {
      href: buildHref("/admin/blog", {
        tab: "layout",
        panel: "detail-background",
      }),
    };
  }

  if (field.startsWith("shopBackground.")) {
    return {
      href: buildHref("/admin/shop", {
        tab: "layout",
        panel: "list-background",
      }),
    };
  }

  if (field.startsWith("shopDetailBackground.")) {
    return {
      href: buildHref("/admin/shop", {
        tab: "layout",
        panel: "detail-background",
      }),
    };
  }

  if (field.includes(".props.slides[")) {
    return {
      href: buildHref("/admin/cms", {
        tab: "page",
        panel: "hero",
        focus: "hero-slides",
      }),
    };
  }

  if (field.includes(".props.items[")) {
    return {
      href: buildHref("/admin/cms", {
        tab: "content",
        panel: "news",
        focus: "news-items",
      }),
    };
  }

  return {
    href: buildHref("/admin/cms"),
  };
}

export function getMediaAssetReferenceTarget(
  reference: MediaAssetReference
): MediaAssetReferenceTarget | null {
  switch (reference.kind) {
    case "PAGE_DRAFT_CONFIG":
    case "PAGE_PUBLISHED_CONFIG":
      return getPageConfigTarget(reference.field);
    case "BLOG_POST_COVER":
      return {
        href: buildHref(`/admin/blog/${reference.entityId}`, {
          focus: "cover-image",
        }),
      };
    case "PRODUCT_IMAGE":
      return {
        href: buildHref(`/admin/shop/${reference.entityId}`, {
          focus: "product-images",
        }),
      };
    case "NEWS_ARTICLE_BACKGROUND":
      return {
        href: buildHref("/admin/cms", {
          tab: "content",
          panel: "articles",
          articleId: reference.entityId,
          focus: "news-article-background",
        }),
      };
    default:
      return null;
  }
}
