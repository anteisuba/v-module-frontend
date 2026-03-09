import { Prisma } from "@prisma/client";
import {
  normalizeMediaAssetUsageContexts,
  type MediaAssetUsageContext,
} from "./usage";

export const MEDIA_ASSET_SELECT = {
  id: true,
  src: true,
  mimeType: true,
  size: true,
  originalName: true,
  usageContexts: true,
  createdAt: true,
} satisfies Prisma.MediaAssetSelect;

type MediaAssetRecord = Prisma.MediaAssetGetPayload<{
  select: typeof MEDIA_ASSET_SELECT;
}>;

export type SelectedMediaAssetRecord = MediaAssetRecord;

export interface SerializedMediaAsset {
  id: string;
  src: string;
  mimeType: string;
  size: number;
  originalName: string | null;
  usageContexts: MediaAssetUsageContext[];
  createdAt: string;
}

export function serializeMediaAsset(
  asset: MediaAssetRecord
): SerializedMediaAsset {
  return {
    id: asset.id,
    src: asset.src,
    mimeType: asset.mimeType,
    size: asset.size,
    originalName: asset.originalName || null,
    usageContexts: normalizeMediaAssetUsageContexts(asset.usageContexts),
    createdAt: asset.createdAt.toISOString(),
  };
}
