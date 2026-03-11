import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";
import {
  MEDIA_ASSET_SELECT,
  serializeMediaAsset,
} from "@/domain/media/assets";
import { buildMediaAssetReferenceMap } from "@/domain/media/reference-map";
import {
  appendMediaAssetUsageContext,
  clearMediaAssetUsageContexts,
  isMediaAssetUsageContext,
  isMediaAssetUsageFilter,
  removeMediaAssetUsageContext,
  type MediaAssetUsageContext,
} from "@/domain/media/usage";
import { deleteManagedMediaSource } from "@/lib/mediaStorage";

export const runtime = "nodejs";

function parsePaginationParam(
  value: string | null,
  fallback: number,
  max: number
) {
  const parsed = Number.parseInt(value || "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function parseIdList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    )
  );
}

async function requireUserId() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

type MediaAssetUsageAction = "ADD" | "REMOVE" | "CLEAR";

function isMediaAssetUsageAction(value: unknown): value is MediaAssetUsageAction {
  return value === "ADD" || value === "REMOVE" || value === "CLEAR";
}

export async function GET(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parsePaginationParam(searchParams.get("page"), 1, 1000);
  const limit = parsePaginationParam(searchParams.get("limit"), 24, 100);
  const query = searchParams.get("query")?.trim() || "";
  const usageContextValue = searchParams.get("usageContext")?.trim() || "ALL";

  if (!isMediaAssetUsageFilter(usageContextValue)) {
    return NextResponse.json(
      { error: "Invalid usage context filter" },
      { status: 400 }
    );
  }

  const where: Prisma.MediaAssetWhereInput = {
    userId,
    ...(query
      ? {
          OR: [
            {
              originalName: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              src: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(usageContextValue === "ALL"
      ? {}
      : usageContextValue === "UNSPECIFIED"
        ? {
            usageContexts: {
              isEmpty: true,
            },
          }
        : {
            usageContexts: {
              has: usageContextValue,
            },
          }),
  };

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: MEDIA_ASSET_SELECT,
    }),
    prisma.mediaAsset.count({ where }),
  ]);
  const referencesByAssetId = await buildMediaAssetReferenceMap(userId, assets);

  return NextResponse.json({
    assets: assets.map((asset) =>
      serializeMediaAsset(asset, referencesByAssetId.get(asset.id) || [])
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function PATCH(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { ids?: unknown; usageContext?: unknown; action?: unknown };

  try {
    payload = (await request.json()) as {
      ids?: unknown;
      usageContext?: unknown;
      action?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = parseIdList(payload.ids);
  const action =
    typeof payload.action === "string" ? payload.action.trim() : "ADD";
  const usageContext =
    typeof payload.usageContext === "string"
      ? payload.usageContext.trim()
      : null;

  if (ids.length === 0) {
    return NextResponse.json({ error: "No asset ids provided" }, { status: 400 });
  }

  if (!isMediaAssetUsageAction(action)) {
    return NextResponse.json({ error: "Invalid usage action" }, { status: 400 });
  }

  if (action !== "CLEAR" && !isMediaAssetUsageContext(usageContext)) {
    return NextResponse.json({ error: "Invalid usage context" }, { status: 400 });
  }

  const assets = await prisma.mediaAsset.findMany({
    where: {
      userId,
      id: {
        in: ids,
      },
    },
    select: MEDIA_ASSET_SELECT,
  });

  if (assets.length === 0) {
    return NextResponse.json({ error: "Assets not found" }, { status: 404 });
  }

  const updatedAssets = await Promise.all(
    assets.map((asset) =>
      prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          usageContexts:
            action === "CLEAR"
              ? clearMediaAssetUsageContexts()
              : action === "REMOVE"
                ? removeMediaAssetUsageContext(
                    asset.usageContexts,
                    usageContext as MediaAssetUsageContext
                  )
                : appendMediaAssetUsageContext(
                    asset.usageContexts,
                    usageContext as MediaAssetUsageContext
                  ),
        },
        select: MEDIA_ASSET_SELECT,
      })
    )
  );

  return NextResponse.json({
    ok: true,
    assets: updatedAssets.map((asset) => serializeMediaAsset(asset)),
  });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { ids?: unknown };

  try {
    payload = (await request.json()) as { ids?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = parseIdList(payload.ids);

  if (ids.length === 0) {
    return NextResponse.json({ error: "No asset ids provided" }, { status: 400 });
  }

  const assets = await prisma.mediaAsset.findMany({
    where: {
      userId,
      id: {
        in: ids,
      },
    },
    select: MEDIA_ASSET_SELECT,
  });

  if (assets.length === 0) {
    return NextResponse.json({ error: "Assets not found" }, { status: 404 });
  }

  const referencesByAssetId = await buildMediaAssetReferenceMap(userId, assets);
  const blockedAssets = assets.filter(
    (asset) => (referencesByAssetId.get(asset.id) || []).length > 0
  );

  if (blockedAssets.length > 0) {
    return NextResponse.json(
      {
        error: "Some media assets are still in use and cannot be deleted",
        code: "MEDIA_ASSETS_IN_USE",
        details: {
          blockedIds: blockedAssets.map((asset) => asset.id),
          blockedCount: blockedAssets.length,
          blockedAssets: blockedAssets.map((asset) =>
            serializeMediaAsset(asset, referencesByAssetId.get(asset.id) || [])
          ),
        },
      },
      { status: 409 }
    );
  }

  await Promise.all(
    assets.map(async (asset) => {
      try {
        await deleteManagedMediaSource(asset.src);
      } catch (error) {
        console.warn("Failed to delete media source:", asset.src, error);
      }
    })
  );

  const deletedIds = assets.map((asset) => asset.id);

  await prisma.mediaAsset.deleteMany({
    where: {
      userId,
      id: {
        in: deletedIds,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    deletedIds,
    deletedCount: deletedIds.length,
  });
}
