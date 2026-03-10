import { prisma } from "@/lib/prisma";
import type { MediaAssetReference, MediaAssetReferenceKind } from "./references";

type MediaAssetReferenceCandidate = {
  id: string;
  src: string;
};

function appendReference(
  target: Map<string, MediaAssetReference[]>,
  assetIds: string[] | undefined,
  reference: MediaAssetReference
) {
  for (const assetId of assetIds || []) {
    const current = target.get(assetId) || [];
    current.push(reference);
    target.set(assetId, current);
  }
}

function walkJsonForAssetMatches(
  value: unknown,
  path: string,
  assetIdsBySrc: Map<string, string[]>,
  target: Map<string, MediaAssetReference[]>,
  referenceMeta: Omit<MediaAssetReference, "field">
) {
  if (typeof value === "string") {
    appendReference(target, assetIdsBySrc.get(value), {
      ...referenceMeta,
      field: path || "$",
    });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextPath = `${path}[${index}]`;
      walkJsonForAssetMatches(
        item,
        nextPath,
        assetIdsBySrc,
        target,
        referenceMeta
      );
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    const nextPath = path ? `${path}.${key}` : key;
    walkJsonForAssetMatches(
      nestedValue,
      nextPath,
      assetIdsBySrc,
      target,
      referenceMeta
    );
  }
}

function createReference(
  kind: MediaAssetReferenceKind,
  entityId: string,
  entityLabel: string,
  field: string
): MediaAssetReference {
  return {
    kind,
    entityId,
    entityLabel,
    field,
  };
}

export async function buildMediaAssetReferenceMap(
  userId: string,
  assets: MediaAssetReferenceCandidate[]
) {
  const referencesByAssetId = new Map<string, MediaAssetReference[]>();

  if (assets.length === 0) {
    return referencesByAssetId;
  }

  const assetIdsBySrc = new Map<string, string[]>();

  for (const asset of assets) {
    const ids = assetIdsBySrc.get(asset.src) || [];
    ids.push(asset.id);
    assetIdsBySrc.set(asset.src, ids);
    referencesByAssetId.set(asset.id, []);
  }

  const [pages, blogPosts, products, newsArticles] = await Promise.all([
    prisma.page.findMany({
      where: { userId },
      select: {
        id: true,
        slug: true,
        draftConfig: true,
        publishedConfig: true,
      },
    }),
    prisma.blogPost.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        coverImage: true,
      },
    }),
    prisma.product.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        images: true,
      },
    }),
    prisma.newsArticle.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        backgroundType: true,
        backgroundValue: true,
      },
    }),
  ]);

  for (const page of pages) {
    if (page.draftConfig) {
      walkJsonForAssetMatches(
        page.draftConfig,
        "",
        assetIdsBySrc,
        referencesByAssetId,
        {
          kind: "PAGE_DRAFT_CONFIG",
          entityId: page.id,
          entityLabel: page.slug,
        }
      );
    }

    if (page.publishedConfig) {
      walkJsonForAssetMatches(
        page.publishedConfig,
        "",
        assetIdsBySrc,
        referencesByAssetId,
        {
          kind: "PAGE_PUBLISHED_CONFIG",
          entityId: page.id,
          entityLabel: page.slug,
        }
      );
    }
  }

  for (const post of blogPosts) {
    if (!post.coverImage) {
      continue;
    }

    appendReference(
      referencesByAssetId,
      assetIdsBySrc.get(post.coverImage),
      createReference("BLOG_POST_COVER", post.id, post.title, "coverImage")
    );
  }

  for (const product of products) {
    if (!Array.isArray(product.images)) {
      continue;
    }

    product.images.forEach((image, index) => {
      if (typeof image !== "string") {
        return;
      }

      appendReference(
        referencesByAssetId,
        assetIdsBySrc.get(image),
        createReference(
          "PRODUCT_IMAGE",
          product.id,
          product.name,
          `images[${index}]`
        )
      );
    });
  }

  for (const article of newsArticles) {
    if (
      article.backgroundType !== "image" ||
      !article.backgroundValue ||
      typeof article.backgroundValue !== "string"
    ) {
      continue;
    }

    appendReference(
      referencesByAssetId,
      assetIdsBySrc.get(article.backgroundValue),
      createReference(
        "NEWS_ARTICLE_BACKGROUND",
        article.id,
        article.title,
        "backgroundValue"
      )
    );
  }

  return referencesByAssetId;
}
