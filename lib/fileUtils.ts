// lib/fileUtils.ts
import path from "path";
import { promises as fs } from "fs";

/**
 * 判断是否为上传文件（vs 静态资源）
 */
export function isUploadedFile(src: string): boolean {
  return src.startsWith("/upload-img1/");
}

/**
 * 安全删除上传的文件
 * 只删除 /upload-img1/ 下的文件，忽略错误（文件不存在等）
 */
export async function deleteUploadedFile(src: string): Promise<void> {
  if (!isUploadedFile(src)) {
    // 不是上传文件，不删除（可能是静态资源如 /hero/xxx.jpeg）
    return;
  }

  try {
    // 构建绝对路径，确保安全（防止路径遍历）
    const publicPath = src.startsWith("/") ? src.slice(1) : src;
    const absPath = path.join(process.cwd(), "public", publicPath);

    // 再次验证路径在 public/upload-img1 下（安全措施）
    const normalizedPath = path.normalize(absPath);
    const uploadDir = path.join(process.cwd(), "public", "upload-img1");
    if (!normalizedPath.startsWith(uploadDir)) {
      console.warn(`[fileUtils] 拒绝删除非 upload-img1 文件: ${src}`);
      return;
    }

    await fs.unlink(absPath);
  } catch (error) {
    // 文件不存在或其他错误，静默忽略
    // 在生产环境可以记录日志，但不抛出错误
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fileUtils] 删除文件失败: ${src}`, error);
    }
  }
}
