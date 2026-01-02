"use client";

import Image from "next/image";
import type { SocialLinkItem } from "@/domain/page-config/types";
import { renderIcon } from "@/lib/utils/iconRenderer";

type Props = {
  onMenuClick?: () => void;
  logo?: { src?: string; alt?: string };
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
      {/* 左上角 Logo / Tag */}
      {showLogo && (
        <div className="absolute top-6 left-6 z-50">
        <a
          href="#top"
          aria-label="Home"
          className="flex items-center gap-3 select-none"
        >
          <div className="h-14 w-14 rounded-sm bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 overflow-hidden">
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
                  width={56}
                  height={56}
                  className="object-cover"
                />
              )
            ) : (
              <span className="text-white text-xs tracking-[0.25em]">ano</span>
            )}
          </div>
        </a>
      </div>
      )}

      {/* 右上角 SNS + Menu */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 text-white">
        {showSocialLinks && enabledLinks.map((link) => (
          <a
            key={link.id}
            className="flex items-center text-sm opacity-80 hover:opacity-100 transition"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.name}
          >
            {renderIcon(link.icon, link.name, "h-5 w-5")}
          </a>
        ))}

        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="menu"
          onClick={onMenuClick}
        >
          ☰
        </button>
      </div>
    </>
  );
}
