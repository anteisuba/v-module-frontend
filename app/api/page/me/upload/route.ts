// app/api/page/me/upload/route.ts

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  MEDIA_ASSET_SELECT,
  serializeMediaAsset,
  type SelectedMediaAssetRecord,
} from "@/domain/media/assets";
import {
  isMediaAssetUsageContext,
  type MediaAssetUsageContext,
} from "@/domain/media/usage";
import { getS3Client } from "@/lib/mediaStorage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // 1. 校验登录
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 3. 解析 FormData
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const usageContextValue = formData.get("usageContext");
  const rawUsageContext =
    typeof usageContextValue === "string" && usageContextValue.trim()
      ? usageContextValue.trim()
      : null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (rawUsageContext && !isMediaAssetUsageContext(rawUsageContext)) {
    return NextResponse.json(
      { error: "Invalid usage context" },
      { status: 400 }
    );
  }

  // 4. 验证文件类型
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // 5. 验证文件大小（例如：最大 10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size exceeds 10MB limit" },
      { status: 400 }
    );
  }

  try {
    const s3Client = getS3Client();
    const useCloudStorage = s3Client && process.env.R2_BUCKET_NAME;
    const isVercel = process.env.VERCEL === "1";
    let assetRecord: SelectedMediaAssetRecord | null = null;
    const usageContext = rawUsageContext
      ? (rawUsageContext as MediaAssetUsageContext)
      : null;
    const usageContexts: MediaAssetUsageContext[] = usageContext
      ? [usageContext]
      : [];

    if (useCloudStorage) {
      // 使用 Cloudflare R2 存储（生产环境推荐）
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const ext = path.extname(file.name);
      const filename = `${timestamp}-${randomStr}${ext}`;
      const key = `uploads/${user.slug}/${filename}`;

      // 上传到 R2
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(command);

      // 构建公开 URL
      // 如果配置了 R2_PUBLIC_URL，使用它；否则需要用户自行配置 Public Development URL 或 Custom Domain
      if (!process.env.R2_PUBLIC_URL) {
        console.warn(
          "[Upload] R2_PUBLIC_URL 未配置，建议在 Cloudflare R2 中启用 Public Development URL 或配置 Custom Domain，并在环境变量中设置 R2_PUBLIC_URL"
        );
        // 即使未配置，也返回一个 URL（但可能无法访问，除非用户配置了 Public Development URL）
        return NextResponse.json(
          {
            error:
              "R2_PUBLIC_URL 未配置。请在 Cloudflare R2 Settings 中启用 Public Development URL 或配置 Custom Domain，并在环境变量中设置 R2_PUBLIC_URL",
          },
          { status: 500 }
        );
      }

      const publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

      try {
        assetRecord = await prisma.mediaAsset.create({
          data: {
            userId: userId,
            src: publicUrl,
            mimeType: file.type,
            size: file.size,
            originalName: file.name,
            usageContexts,
          },
          select: MEDIA_ASSET_SELECT,
        });
      } catch (error: any) {
        console.warn("Failed to create MediaAsset record (upload still succeeded):", error);
      }

      return NextResponse.json({
        ok: true,
        src: publicUrl,
        mimeType: file.type,
        size: file.size,
        asset: assetRecord ? serializeMediaAsset(assetRecord) : undefined,
      });
    } else if (isVercel) {
      // 在 Vercel 上但没有配置 R2，返回错误
      return NextResponse.json(
        {
          error: "文件上传功能需要配置云存储服务。请配置 Cloudflare R2 环境变量。",
          code: "STORAGE_NOT_CONFIGURED",
        },
        { status: 501 }
      );
    } else {
      // 使用本地文件系统（开发环境）
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        user.slug
      );

      // 确保目录存在
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (mkdirError: any) {
        if (mkdirError.code === "ENOENT") {
          const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
          await mkdir(publicUploadsDir, { recursive: true });
          await mkdir(uploadDir, { recursive: true });
        } else {
          throw mkdirError;
        }
      }

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const ext = path.extname(file.name);
      const filename = `${timestamp}-${randomStr}${ext}`;
      const filepath = path.join(uploadDir, filename);

      // 保存文件
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // 返回文件路径（相对于 public）
      const publicPath = `/uploads/${user.slug}/${filename}`;
      
      try {
        assetRecord = await prisma.mediaAsset.create({
          data: {
            userId: userId,
            src: publicPath,
            mimeType: file.type,
            size: file.size,
            originalName: file.name,
            usageContexts,
          },
          select: MEDIA_ASSET_SELECT,
        });
      } catch (error: any) {
        console.warn("Failed to create MediaAsset record (upload still succeeded):", error);
      }

      return NextResponse.json({
        ok: true,
        src: publicPath,
        mimeType: file.type,
        size: file.size,
        asset: assetRecord ? serializeMediaAsset(assetRecord) : undefined,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
