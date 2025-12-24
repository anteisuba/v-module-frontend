// app/api/news/route.ts

import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// 支持的图片格式
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public", "upload-img2");

    // 读取目录中的所有文件
    let files: string[];
    try {
      files = await readdir(uploadDir);
    } catch (error: unknown) {
      // 如果目录不存在，返回空数组
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return NextResponse.json({ items: [] });
      }
      throw error;
    }

    // 过滤出图片文件并按文件名排序
    const imageFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
      .sort() // 按文件名排序
      .map((file) => ({
        id: file,
        src: `/upload-img2/${file}`,
        alt: file,
        href: "", // 外部链接需要后续配置，这里先返回空字符串
      }));

    return NextResponse.json({ items: imageFiles });
  } catch (error) {
    console.error("Failed to read news images:", error);
    return NextResponse.json(
      { error: "Failed to read news images" },
      { status: 500 }
    );
  }
}
