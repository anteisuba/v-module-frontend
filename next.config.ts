import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 生产环境优化配置

  // 启用压缩
  compress: true,

  // 移除 X-Powered-By 响应头（安全最佳实践）
  poweredByHeader: false,

  // 图片优化配置
  images: {
    // 允许的远程图片域名
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
    // 图片格式优化（优先使用现代格式）
    formats: ["image/avif", "image/webp"],
    // 图片质量
    minimumCacheTTL: 60,
  },

  // 实验性功能
  experimental: {
    // 启用服务器组件外部包优化
    // Prisma Client 应该被标记为外部包，避免被打包
    serverComponentsExternalPackages: ["@prisma/client"],
  },

  // 生产环境优化
  ...(process.env.NODE_ENV === "production" && {
    // 生产环境禁用 source map（减少构建体积，提高安全性）
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;
