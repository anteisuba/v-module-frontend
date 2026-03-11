import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SelectedMediaAssetRecord } from "./assets";
import { buildMediaAssetReferenceMap } from "./reference-map";
import type { MediaAssetReference } from "./references";

export interface MediaAssetReplacementResult {
  references: MediaAssetReference[];
  replacedReferenceCount: number;
  updatedEntityCount: number;
}

function replaceJsonStringMatches(
  value: unknown,
  sourceSrc: string,
  targetSrc: string
): {
  value: unknown;
  replacedCount: number;
} {
  if (typeof value === "string") {
    return {
      value: value === sourceSrc ? targetSrc : value,
      replacedCount: value === sourceSrc ? 1 : 0,
    };
  }

  if (Array.isArray(value)) {
    let replacedCount = 0;
    const nextArray = value.map((item) => {
      const next = replaceJsonStringMatches(item, sourceSrc, targetSrc);
      replacedCount += next.replacedCount;
      return next.value;
    });

    return {
      value: nextArray,
      replacedCount,
    };
  }

  if (!value || typeof value !== "object") {
    return {
      value,
      replacedCount: 0,
    };
  }

  let replacedCount = 0;
  const nextObject: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    const next = replaceJsonStringMatches(nestedValue, sourceSrc, targetSrc);
    replacedCount += next.replacedCount;
    nextObject[key] = next.value;
  }

  return {
    value: nextObject,
    replacedCount,
  };
}

function replaceStringArrayMatches(
  values: string[],
  sourceSrc: string,
  targetSrc: string
) {
  let replacedCount = 0;
  const nextValues = values.map((value) => {
    if (value !== sourceSrc) {
      return value;
    }

    replacedCount += 1;
    return targetSrc;
  });

  return {
    values: nextValues,
    replacedCount,
  };
}

function uniqueEntityIds(
  references: MediaAssetReference[],
  kind: MediaAssetReference["kind"]
) {
  return Array.from(
    new Set(
      references
        .filter((reference) => reference.kind === kind)
        .map((reference) => reference.entityId)
    )
  );
}

export async function replaceMediaAssetReferences(
  userId: string,
  sourceAsset: SelectedMediaAssetRecord,
  targetAsset: SelectedMediaAssetRecord
): Promise<MediaAssetReplacementResult> {
  const referencesByAssetId = await buildMediaAssetReferenceMap(userId, [
    sourceAsset,
  ]);
  const references = referencesByAssetId.get(sourceAsset.id) || [];

  if (references.length === 0) {
    return {
      references: [],
      replacedReferenceCount: 0,
      updatedEntityCount: 0,
    };
  }

  const pageIds = Array.from(
    new Set(
      references
        .filter(
          (reference) =>
            reference.kind === "PAGE_DRAFT_CONFIG" ||
            reference.kind === "PAGE_PUBLISHED_CONFIG"
        )
        .map((reference) => reference.entityId)
    )
  );
  const blogPostIds = uniqueEntityIds(references, "BLOG_POST_COVER");
  const productIds = uniqueEntityIds(references, "PRODUCT_IMAGE");
  const newsArticleIds = uniqueEntityIds(references, "NEWS_ARTICLE_BACKGROUND");

  let replacedReferenceCount = 0;
  let updatedEntityCount = 0;

  await prisma.$transaction(async (tx) => {
    if (pageIds.length > 0) {
      const pages = await tx.page.findMany({
        where: {
          userId,
          id: {
            in: pageIds,
          },
        },
        select: {
          id: true,
          draftConfig: true,
          publishedConfig: true,
        },
      });

      for (const page of pages) {
        const nextData: Prisma.PageUpdateInput = {};
        let pageUpdated = false;

        if (page.draftConfig) {
          const nextDraftConfig = replaceJsonStringMatches(
            page.draftConfig,
            sourceAsset.src,
            targetAsset.src
          );

          if (nextDraftConfig.replacedCount > 0) {
            nextData.draftConfig = nextDraftConfig.value as Prisma.InputJsonValue;
            replacedReferenceCount += nextDraftConfig.replacedCount;
            pageUpdated = true;
          }
        }

        if (page.publishedConfig) {
          const nextPublishedConfig = replaceJsonStringMatches(
            page.publishedConfig,
            sourceAsset.src,
            targetAsset.src
          );

          if (nextPublishedConfig.replacedCount > 0) {
            nextData.publishedConfig =
              nextPublishedConfig.value as Prisma.InputJsonValue;
            replacedReferenceCount += nextPublishedConfig.replacedCount;
            pageUpdated = true;
          }
        }

        if (!pageUpdated) {
          continue;
        }

        await tx.page.update({
          where: { id: page.id },
          data: nextData,
        });
        updatedEntityCount += 1;
      }
    }

    if (blogPostIds.length > 0) {
      const result = await tx.blogPost.updateMany({
        where: {
          userId,
          id: {
            in: blogPostIds,
          },
          coverImage: sourceAsset.src,
        },
        data: {
          coverImage: targetAsset.src,
        },
      });

      replacedReferenceCount += result.count;
      updatedEntityCount += result.count;
    }

    if (productIds.length > 0) {
      const products = await tx.product.findMany({
        where: {
          userId,
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          images: true,
        },
      });

      for (const product of products) {
        const nextImages = replaceStringArrayMatches(
          Array.isArray(product.images)
            ? product.images.filter((image): image is string => typeof image === "string")
            : [],
          sourceAsset.src,
          targetAsset.src
        );

        if (nextImages.replacedCount === 0) {
          continue;
        }

        await tx.product.update({
          where: { id: product.id },
          data: {
            images: nextImages.values,
          },
        });
        replacedReferenceCount += nextImages.replacedCount;
        updatedEntityCount += 1;
      }
    }

    if (newsArticleIds.length > 0) {
      const result = await tx.newsArticle.updateMany({
        where: {
          userId,
          id: {
            in: newsArticleIds,
          },
          backgroundType: "image",
          backgroundValue: sourceAsset.src,
        },
        data: {
          backgroundValue: targetAsset.src,
        },
      });

      replacedReferenceCount += result.count;
      updatedEntityCount += result.count;
    }

    const nextUsageContexts = Array.from(
      new Set([
        ...targetAsset.usageContexts,
        ...sourceAsset.usageContexts,
      ])
    );

    if (
      nextUsageContexts.length !== targetAsset.usageContexts.length ||
      nextUsageContexts.some(
        (usageContext, index) => targetAsset.usageContexts[index] !== usageContext
      )
    ) {
      await tx.mediaAsset.update({
        where: { id: targetAsset.id },
        data: {
          usageContexts: nextUsageContexts,
        },
      });
    }
  });

  return {
    references,
    replacedReferenceCount,
    updatedEntityCount,
  };
}
