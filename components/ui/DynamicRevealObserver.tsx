"use client";

/**
 * RevealObserver 的客户端动态包装器。
 *
 * RevealObserver 依赖 IntersectionObserver / MutationObserver 等浏览器 API，
 * 必须完全跳过 SSR。在 Next.js App Router + Turbopack 下，
 * 即使原文件已标记 "use client"，直接在 Server Component（layout.tsx）里
 * 静态 import 仍可能触发"module factory is not available"错误。
 *
 * 用 dynamic({ ssr: false }) 封一层可彻底规避。
 */
import dynamic from "next/dynamic";

const RevealObserver = dynamic(() => import("./RevealObserver"), {
  ssr: false,
});

export default function DynamicRevealObserver() {
  return <RevealObserver />;
}
