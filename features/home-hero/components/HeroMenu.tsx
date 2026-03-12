"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import LanguageSelector from "@/components/ui/LanguageSelector";
import PageLoading from "@/components/ui/PageLoading";

// 安全的翻译函数，如果 useI18n 失败则返回 key
function useSafeI18n() {
  try {
    return useI18n();
  } catch {
    // 如果不在 I18nProvider 中，返回默认的翻译函数
    return {
      locale: "zh" as const,
      setLocale: () => {},
      t: (key: string) => key,
    };
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
};

const BASE_ITEMS = [
  { key: "login", href: "/admin" },
  { key: "news", href: "/news" },
  { key: "blog", href: "/blog", showOnUserPage: true },
  { key: "shop", href: "/shop", showOnUserPage: true },
  { key: "media", href: "/media" },
  { key: "profile", href: "/profile" },
  { key: "contact", href: "/contact" },
];

export default function HeroMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const { t } = useSafeI18n();
  const [isNavigating, setIsNavigating] = useState(false);
  const [previousPathname, setPreviousPathname] = useState<string | null>(null);
  
  // 监听路由变化，清除加载状态
  useEffect(() => {
    if (isNavigating && previousPathname && pathname !== previousPathname) {
      // 路径已变化，延迟清除加载状态，确保页面已渲染
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setPreviousPathname(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, isNavigating, previousPathname]);

  // 从路径中提取 slug（如果是 /u/[slug] 格式）
  const getUserSlug = () => {
    const match = pathname?.match(/^\/u\/([^/]+)/);
    return match ? match[1] : null;
  };

  const userSlug = getUserSlug();
  const isUserPage = !!userSlug;

  // 过滤菜单项：在用户页面只显示 showOnUserPage 的项，或者非用户页面的默认项
  const ITEMS = BASE_ITEMS.filter((item) => {
    if (isUserPage) {
      // 在用户页面，显示 showOnUserPage 的项，或者 login/news/media/profile/contact
      return item.showOnUserPage || 
             ["login", "news", "media", "profile", "contact"].includes(item.key);
    }
    // 非用户页面，显示所有项
    return true;
  });

  // 从路径中提取 slug（如果是 /u/[slug] 格式）
  const getNewsHref = () => {
    if (userSlug) {
      return `/news?from=/u/${userSlug}`;
    }
    return "/news";
  };

  const getBlogHref = () => {
    if (userSlug) {
      return `/u/${userSlug}/blog`;
    }
    return "/blog";
  };

  const getShopHref = () => {
    if (userSlug) {
      return `/u/${userSlug}/shop`;
    }
    return "/shop";
  };

  // 处理链接点击
  const handleLinkClick = () => {
    setIsNavigating(true);
    setPreviousPathname(pathname);
    onClose(); // 关闭菜单
  };
  // 如果正在导航，显示加载页面
  if (isNavigating) {
    return <PageLoading message={t("common.loading")} />;
  }

  return (
    <div
      className={[
        "fixed inset-0 z-[80]",
        "transition-opacity duration-300",
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/72 backdrop-blur-sm"
      />

      <aside
        className={[
          "absolute right-0 top-0 h-full w-[88vw] max-w-lg",
          "border-l border-white/10 bg-[linear-gradient(180deg,rgba(10,10,8,0.94),rgba(18,18,14,0.98))] backdrop-blur-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <nav className="flex h-full flex-col px-8 pb-8 pt-8 sm:px-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/45">
                Navigation
              </div>
              <div className="mt-4 h-px w-24 bg-white/12" />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="editorial-button min-h-10 border-white/12 bg-white/6 px-4 py-2 text-[10px] text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <ul className="mt-12 space-y-5">
            {ITEMS.map((item, i) => {
              let href = item.href;
              if (item.key === "news") {
                href = getNewsHref();
              } else if (item.key === "blog") {
                href = getBlogHref();
              } else if (item.key === "shop") {
                href = getShopHref();
              }

              return (
                <li
                  key={item.key}
                  className={[
                    "transition-all duration-500 ease-out",
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                  ].join(" ")}
                  style={{
                    transitionDelay: open ? `${120 + i * 70}ms` : "0ms",
                  }}
                >
                  <Link
                    href={href}
                    onClick={handleLinkClick}
                    className="group flex items-end justify-between gap-4 border-b border-white/8 pb-4"
                  >
                    <span className="font-serif text-[clamp(1.9rem,4vw,3rem)] font-light tracking-[0.04em] text-white/88 transition group-hover:text-white">
                      {t(`heroMenu.${item.key}`)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.28em] text-white/32 transition group-hover:text-white/56">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div
            className={[
              "mt-auto transition-all duration-500",
              open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            ].join(" ")}
            style={{ transitionDelay: open ? "520ms" : "0ms" }}
          >
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">
              Multi-tenant editorial network
            </div>
            <div className="mt-6">
              <LanguageSelector variant="dark" menuPosition="bottom" />
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
}
