"use client";

import Image from "next/image";
import type { SocialLinkItem } from "@/domain/page-config/types";

type Props = {
  onMenuClick?: () => void;
  logo?: { src?: string; alt?: string };
  socialLinks?: SocialLinkItem[];
  showLogo?: boolean;
  showSocialLinks?: boolean;
};

const isExternalUrl = (url: string) => url.startsWith("http://") || url.startsWith("https://");

// 判断是否为图片 URL（支持 http/https 或本地路径，且包含图片扩展名）
const isImageUrl = (str: string): boolean => {
  if (!str) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'];
  const lowerStr = str.toLowerCase();
  // 检查是否是 URL（http/https）
  if (isExternalUrl(str)) {
    return imageExtensions.some(ext => lowerStr.includes(ext));
  }
  // 检查是否是本地路径（以 / 开头）
  if (str.startsWith('/')) {
    return imageExtensions.some(ext => lowerStr.includes(ext));
  }
  return false;
};

// 渲染图标（支持图片 URL、emoji 或文字）
function renderIcon(icon: string | undefined, fallbackName: string) {
  if (!icon) {
    return <span>{fallbackName}</span>;
  }

  // 如果是图片 URL，使用图片渲染
  if (isImageUrl(icon)) {
    if (isExternalUrl(icon)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt={fallbackName}
          className="h-5 w-5 object-contain"
          style={{ display: 'inline-block' }}
        />
      );
    } else {
      // 本地图片路径使用 Next.js Image
      return (
        <span className="inline-flex items-center">
          <Image
            src={icon}
            alt={fallbackName}
            width={20}
            height={20}
            className="object-contain"
          />
        </span>
      );
    }
  }

  // 否则作为文字或 emoji 直接显示
  return <span>{icon}</span>;
}

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
            {renderIcon(link.icon, link.name)}
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
