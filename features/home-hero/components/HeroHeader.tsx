"use client";

import type { SocialLinkItem, SocialLinksPosition } from "@/domain/page-config/types";
import { renderIcon } from "@/lib/utils/iconRenderer";

type Props = {
  socialLinks?: SocialLinkItem[];
  showSocialLinks?: boolean;
  socialLinksPosition?: SocialLinksPosition;
  // 以下 props 保留接口兼容，但不再渲染（Logo 由 FloatingMenu 统一处理）
  logo?: { src?: string; alt?: string; opacity?: number };
  showLogo?: boolean;
  logoPosition?: string;
};

const SOCIAL_POSITION_CLASS: Record<SocialLinksPosition, string> = {
  "top-right":     "absolute top-6 right-30 z-50 flex items-center gap-4 text-white",
  "bottom-center": "absolute bottom-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 text-white",
};

export default function HeroHeader({
  socialLinks,
  showSocialLinks = true,
  socialLinksPosition = "top-right",
}: Props) {
  // 过滤出启用的社交链接
  const enabledLinks = socialLinks?.filter((link) => link.enabled && link.url) || [];

  return (
    <>
      {/* Logo 由 layout 层的 FloatingMenu 统一渲染（fixed 定位，全页面可见），HeroHeader 不再重复渲染 */}

      <div className={SOCIAL_POSITION_CLASS[socialLinksPosition]}>
        {showSocialLinks &&
          enabledLinks.map((link) => (
            <a
              key={link.id}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/24 text-sm text-white/80 backdrop-blur-md transition hover:border-white/24 hover:bg-black/34 hover:text-white"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
            >
              {renderIcon(link.icon, link.name, "h-[18px] w-[18px]")}
            </a>
          ))}
      </div>
    </>
  );
}
