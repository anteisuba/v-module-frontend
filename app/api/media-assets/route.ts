import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";
import {
  MEDIA_ASSET_SELECT,
  serializeMediaAsset,
} from "@/domain/media/assets";
import {
  appendMediaAssetUsageContext,
  isMediaAssetUsageContext,
  isMediaAssetUsageFilter,
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

  return NextResponse.json({
    assets: assets.map(serializeMediaAsset),
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

  let payload: { ids?: unknown; usageContext?: unknown };

  try {
    payload = (await request.json()) as { ids?: unknown; usageContext?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = parseIdList(payload.ids);
  const usageContext =
    typeof payload.usageContext === "string"
      ? payload.usageContext.trim()
      : null;

  if (ids.length === 0) {
    return NextResponse.json({ error: "No asset ids provided" }, { status: 400 });
  }

  if (!isMediaAssetUsageContext(usageContext)) {
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
          usageContexts: appendMediaAssetUsageContext(
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
    assets: updatedAssets.map(serializeMediaAsset),
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
