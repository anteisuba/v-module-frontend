import { unlink } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function normalizeR2PublicUrl(value: string | undefined) {
  return value?.replace(/\/$/, "") || null;
}

export function getS3Client() {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function getLocalUploadFilePath(src: string) {
  if (!src.startsWith("/uploads/")) {
    return null;
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const resolvedPath = path.resolve(process.cwd(), "public", src.slice(1));

  if (
    resolvedPath !== uploadsRoot &&
    !resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    return null;
  }

  return resolvedPath;
}

function getManagedRemoteUploadKey(src: string) {
  const normalizedPublicUrl = normalizeR2PublicUrl(process.env.R2_PUBLIC_URL);

  if (!normalizedPublicUrl) {
    return null;
  }

  try {
    const assetUrl = new URL(src);
    const publicUrl = new URL(normalizedPublicUrl);

    if (assetUrl.origin !== publicUrl.origin) {
      return null;
    }

    if (!assetUrl.pathname.startsWith("/uploads/")) {
      return null;
    }

    return assetUrl.pathname.slice(1);
  } catch {
    return null;
  }
}

async function deleteLocalUpload(src: string) {
  const filePath = getLocalUploadFilePath(src);

  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}

async function deleteRemoteUpload(src: string) {
  const key = getManagedRemoteUploadKey(src);
  const s3Client = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!key || !s3Client || !bucketName) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export async function deleteManagedMediaSource(src: string) {
  if (src.startsWith("/uploads/")) {
    await deleteLocalUpload(src);
    return;
  }

  await deleteRemoteUpload(src);
}
