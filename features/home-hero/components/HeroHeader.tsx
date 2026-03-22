"use client";

import Image from "next/image";
import type { SocialLinkItem, SocialLinksPosition } from "@/domain/page-config/types";
import { renderIcon } from "@/lib/utils/iconRenderer";

const isExternalUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://");

type Props = {
  socialLinks?: SocialLinkItem[];
  showSocialLinks?: boolean;
  socialLinksPosition?: SocialLinksPosition;
  logo?: { src?: string; alt?: string; opacity?: number; size?: number };
  showLogo?: boolean;
  logoPosition?: string;
};

const SOCIAL_POSITION_CLASS: Record<SocialLinksPosition, string> = {
  "top-right":     "absolute top-6 right-30 z-50 flex items-center gap-4 text-white",
  "bottom-center": "absolute bottom-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 text-white",
};

export default function HeroHeader({
  logo,
  showLogo = true,
  socialLinks,
  showSocialLinks = true,
  socialLinksPosition = "top-right",
}: Props) {
  const enabledLinks = socialLinks?.filter((link) => link.enabled && link.url) || [];
  const size = logo?.size ?? 40;
  const radius = Math.round(size * 0.275);

  return (
    <>
      {/* Logo - absolute 定位在 Hero 区域内 */}
      {showLogo && (
        <div className="absolute left-6 top-6 z-50">
          <a href="#top" aria-label="Home" className="flex items-center select-none">
            <div
              className="overflow-hidden border border-white/14 bg-black/28 backdrop-blur-md"
              style={{
                position: "relative",
                width: size,
                height: size,
                borderRadius: radius,
                opacity: logo?.opacity ?? 1,
                flexShrink: 0,
              }}
            >
              {logo?.src ? (
                <Image
                  src={logo.src}
                  alt={logo.alt || "Logo"}
                  fill
                  sizes={`${size}px`}
                  className="object-cover"
                  unoptimized={isExternalUrl(logo.src)}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/80">
                  VTS
                </span>
              )}
            </div>
          </a>
        </div>
      )}

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
