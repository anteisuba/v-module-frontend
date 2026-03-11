import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";
import { MEDIA_ASSET_SELECT } from "@/domain/media/assets";
import { replaceMediaAssetReferences } from "@/domain/media/reference-replacements";

export const runtime = "nodejs";

async function requireUserId() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { sourceAssetId?: unknown; targetAssetId?: unknown };

  try {
    payload = (await request.json()) as {
      sourceAssetId?: unknown;
      targetAssetId?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sourceAssetId =
    typeof payload.sourceAssetId === "string" ? payload.sourceAssetId.trim() : "";
  const targetAssetId =
    typeof payload.targetAssetId === "string" ? payload.targetAssetId.trim() : "";

  if (!sourceAssetId || !targetAssetId) {
    return NextResponse.json(
      { error: "Both sourceAssetId and targetAssetId are required" },
      { status: 400 }
    );
  }

  if (sourceAssetId === targetAssetId) {
    return NextResponse.json(
      {
        error: "Source and target assets must be different",
        code: "MEDIA_ASSET_REPLACE_SAME_ASSET",
      },
      { status: 400 }
    );
  }

  const assets = await prisma.mediaAsset.findMany({
    where: {
      userId,
      id: {
        in: [sourceAssetId, targetAssetId],
      },
    },
    select: MEDIA_ASSET_SELECT,
  });

  const sourceAsset = assets.find((asset) => asset.id === sourceAssetId);
  const targetAsset = assets.find((asset) => asset.id === targetAssetId);

  if (!sourceAsset || !targetAsset) {
    return NextResponse.json({ error: "Assets not found" }, { status: 404 });
  }

  if (sourceAsset.src === targetAsset.src) {
    return NextResponse.json(
      {
        error: "Source and target assets already use the same source",
        code: "MEDIA_ASSET_REPLACE_NOOP",
      },
      { status: 400 }
    );
  }

  const result = await replaceMediaAssetReferences(userId, sourceAsset, targetAsset);

  return NextResponse.json({
    ok: true,
    replacedReferenceCount: result.replacedReferenceCount,
    updatedEntityCount: result.updatedEntityCount,
  });
}
