export const MEDIA_ASSET_REFERENCE_KINDS = [
  "PAGE_DRAFT_CONFIG",
  "PAGE_PUBLISHED_CONFIG",
  "BLOG_POST_COVER",
  "PRODUCT_IMAGE",
  "NEWS_ARTICLE_BACKGROUND",
] as const;

export type MediaAssetReferenceKind =
  (typeof MEDIA_ASSET_REFERENCE_KINDS)[number];

export interface MediaAssetReference {
  kind: MediaAssetReferenceKind;
  entityId: string;
  entityLabel: string;
  field: string;
}
