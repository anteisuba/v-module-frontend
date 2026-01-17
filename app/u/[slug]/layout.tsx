// app/u/[slug]/layout.tsx
// 用户公开页面布局 - 注入主题色 CSS 变量

import { prisma } from "@/lib/prisma";

interface UserLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// 计算主题色的 hover 和 active 状态（简单的亮度调整）
function adjustBrightness(hex: string, percent: number): string {
  // 确保是有效的 hex 颜色
  if (!hex || !hex.startsWith("#") || hex.length !== 7) {
    return hex;
  }

  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// 判断颜色是否为浅色（用于决定前景色）
function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith("#") || hex.length !== 7) {
    return false;
  }

  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  // 使用相对亮度公式
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export default async function UserLayout({
  children,
  params,
}: UserLayoutProps) {
  const { slug } = await params;

  // 直接查询页面主题设置
  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      themeColor: true,
      fontFamily: true,
    },
  });

  // 获取主题色，如果未设置则使用默认黑色
  const themeColor = page?.themeColor || "#000000";
  const fontFamily = page?.fontFamily || "Inter";

  // 计算主题色相关的变体
  const themeHover = adjustBrightness(themeColor, 20);
  const themeActive = adjustBrightness(themeColor, 40);
  const themeForeground = isLightColor(themeColor) ? "#000000" : "#ffffff";

  // 注入 CSS 变量
  const themeStyles = {
    "--theme-primary": themeColor,
    "--theme-primary-foreground": themeForeground,
    "--theme-primary-hover": themeHover,
    "--theme-primary-active": themeActive,
    "--theme-font-family": fontFamily,
  } as React.CSSProperties;

  return (
    <div style={themeStyles} className="min-h-screen">
      {children}
    </div>
  );
}
