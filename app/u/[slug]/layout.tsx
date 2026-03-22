// app/u/[slug]/layout.tsx
// 用户公开页面布局 - 注入主题色 CSS 变量

import { prisma } from "@/lib/prisma";
import { getE2EPublicPageState } from "@/lib/e2e/publicPageState";
import FloatingMenu from "@/features/home-hero/components/FloatingMenu";
import type { ThemeConfig } from "@/domain/page-config/types";
import { normalizePageConfig } from "@/utils/pageConfig";

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
  const e2ePublicPageState = await getE2EPublicPageState(slug);

  // 获取主题色，如果未设置则使用默认黑色
  let themeColor = e2ePublicPageState?.themeColor || "#000000";
  let fontFamily = e2ePublicPageState?.fontFamily || "Inter";

  let theme: ThemeConfig | undefined;

  if (!e2ePublicPageState) {
    const page = await prisma.page.findUnique({
      where: { slug },
      select: {
        themeColor: true,
        fontFamily: true,
        publishedConfig: true,
      },
    });

    themeColor = page?.themeColor || "#000000";
    fontFamily = page?.fontFamily || "Inter";

    // 从 publishedConfig 中提取 theme（如果存在）
    const config = normalizePageConfig(page?.publishedConfig);
    theme = config.theme;
  }

  // theme JSON 优先于 DB 列
  const primaryColor = theme?.primaryColor || themeColor;
  const resolvedBodyFont = theme?.bodyFont || `var(--font-jost)`;
  const resolvedHeadingFont = theme?.headingFont || `var(--font-cormorant)`;

  // 计算主题色相关的变体
  const themeHover = adjustBrightness(primaryColor, 20);
  const themeActive = adjustBrightness(primaryColor, 40);
  const themeForeground = isLightColor(primaryColor) ? "#000000" : "#ffffff";

  // 注入 CSS 变量 — 覆写 globals.css 中的 --color-* 变量
  const themeStyles = {
    "--theme-primary": primaryColor,
    "--theme-primary-foreground": themeForeground,
    "--theme-primary-hover": themeHover,
    "--theme-primary-active": themeActive,
    "--theme-font-family": resolvedBodyFont,
    // 覆写 editorial/color 变量实现主题切换
    ...(theme?.backgroundColor && { "--color-bg": theme.backgroundColor }),
    ...(theme?.surfaceColor && { "--color-surface": theme.surfaceColor }),
    ...(theme?.textColor && { "--color-text": theme.textColor }),
    ...(theme?.primaryColor && { "--color-accent": theme.primaryColor, "--color-accent-foreground": themeForeground }),
    ...(resolvedHeadingFont && { "--font-display": resolvedHeadingFont }),
    ...(resolvedBodyFont && { "--font-body": resolvedBodyFont }),
    ...(theme?.borderRadius && { "--radius": theme.borderRadius }),
  } as React.CSSProperties;

  return (
    <div style={themeStyles} className="min-h-screen">
      <FloatingMenu />
      {children}
      <footer className="editorial-shell border-t border-white/10 px-6 py-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/36">
          {new Date().getFullYear()} &middot; Creator Journal
        </p>
      </footer>
    </div>
  );
}
