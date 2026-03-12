"use client";

import Image from "next/image";
import type { SocialLinkItem } from "@/domain/page-config/types";
import { renderIcon } from "@/lib/utils/iconRenderer";

type Props = {
  onMenuClick?: () => void;
  logo?: { src?: string; alt?: string; opacity?: number };
  socialLinks?: SocialLinkItem[];
  showLogo?: boolean;
  showSocialLinks?: boolean;
};

const isExternalUrl = (url: string) => url.startsWith("http://") || url.startsWith("https://");

export default function HeroHeader({ 
  onMenuClick, 
  logo, 
  socialLinks,
  showLogo = true,
  showSocialLinks = true,
}: Props) {
  // 过滤出启用的社交链接
  const enabledLinks = socialLinks?.filter((link) => link.enabled && link.url) || [];

  return (
    <>
      {showLogo && (
        <div className="absolute left-5 top-5 z-50 sm:left-6 sm:top-6">
          <a
            href="#top"
            aria-label="Home"
            className="flex items-center gap-4 select-none"
          >
            <div
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/14 bg-black/26 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
              style={{ opacity: logo?.opacity ?? 1 }}
            >
              {logo?.src ? (
                isExternalUrl(logo.src) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo.src}
                    alt={logo.alt || "Logo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={logo.src}
                    alt={logo.alt || "Logo"}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <span className="text-[11px] uppercase tracking-[0.28em] text-white/80">
                  VTS
                </span>
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/50">
                Creator page
              </div>
              <div className="mt-1 font-serif text-[1.4rem] font-light tracking-[0.04em] text-white">
                VTuber Site
              </div>
            </div>
          </a>
        </div>
      )}

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 text-white">
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

        <button
          className="editorial-button min-h-10 border-white/14 bg-black/28 px-4 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/40"
          type="button"
          aria-label="menu"
          onClick={onMenuClick}
        >
          Menu
        </button>
      </div>
    </>
  );
}
