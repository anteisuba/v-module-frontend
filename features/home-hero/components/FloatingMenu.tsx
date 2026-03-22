"use client";

import Image from "next/image";
import { useHeroMenu } from "../hooks/useHeroMenu";
import HeroMenu from "./HeroMenu";

const isExternalUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://");

type Props = {
  logo?: { src?: string; alt?: string; opacity?: number; size?: number };
  showLogo?: boolean;
};

/**
 * 全局浮动菜单按钮 + Logo + 侧栏
 * 放在 layout 层，所有 /u/[slug]/* 子页面共享
 */
export default function FloatingMenu({ logo, showLogo = true }: Props) {
  const menu = useHeroMenu();

  return (
    <>
      <div className="fixed left-6 top-6 z-[9990] flex items-center gap-4">
        {/* Logo */}
        {showLogo && (
          <a
            href="#top"
            aria-label="Home"
            className="flex items-center select-none"
          >
            {(() => {
              const size = logo?.size ?? 40;
              const radius = Math.round(size * 0.275);
              return (
                // position: relative 是 Next.js Image fill 模式的必要条件
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
                    // 统一用 fill 模式：完全由容器 div 控制尺寸，不受 Next.js Image inline style 干扰
                    <Image
                      src={logo.src}
                      alt={logo.alt || "Logo"}
                      fill
                      sizes={`${size}px`}
                      className="object-cover"
                      unoptimized={isExternalUrl(logo.src)}
                    />
                  ) : (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/80"
                    >
                      VTS
                    </span>
                  )}
                </div>
              );
            })()}
          </a>
        )}
      </div>

      <div className="fixed right-6 top-6 z-[9990] flex items-center gap-4">
        <button
          className="editorial-button min-h-10 border-white/14 bg-black/28 px-4 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/40"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          Menu
        </button>
      </div>
      <HeroMenu open={menu.open} onClose={menu.closeMenu} />
    </>
  );
}
