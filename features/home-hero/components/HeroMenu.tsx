"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import LanguageSelector from "@/components/ui/LanguageSelector";
import PageLoading from "@/components/ui/PageLoading";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ITEMS = [
  { key: "login", href: "/admin" },
  { key: "news", href: "/news" },
  { key: "blog", href: "/blog" },
  { key: "media", href: "/media" },
  { key: "profile", href: "/profile" },
  { key: "contact", href: "/contact" },
];

export default function HeroMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
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
  const getNewsHref = () => {
    const match = pathname?.match(/^\/u\/([^/]+)/);
    if (match && match[1]) {
      return `/news?from=/u/${match[1]}`;
    }
    return "/news";
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
      {/* 背景遮罩（点击关闭） */}
      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={onClose}
        className={["absolute inset-0", "bg-black/60", "backdrop-blur-sm"].join(
          " "
        )}
      />

      {/* 右侧面板：从右滑入 */}
      <aside
        className={[
          "absolute right-0 top-0 h-full w-[86vw] max-w-md",
          "bg-black/35 backdrop-blur-xl",
          "border-l border-white/10",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        {/* 顶部：关闭按钮 */}
        <div className="flex items-center justify-end p-6">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* 菜单项：逐行出现 */}
        <nav className="px-10 pt-6">
          <ul className="space-y-6">
            {ITEMS.map((item, i) => {
              // 如果是 News 链接，使用动态 href
              const href = item.key === "news" ? getNewsHref() : item.href;
              
              return (
                <li
                  key={item.key}
                  className={[
                    "transition-all duration-500 ease-out",
                    open
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3",
                  ].join(" ")}
                  style={{
                    transitionDelay: open ? `${120 + i * 70}ms` : "0ms",
                  }}
                >
                  <Link
                    href={href}
                    onClick={handleLinkClick}
                    className="text-white text-2xl tracking-[0.2em] opacity-90 hover:opacity-100 transition"
                  >
                    {t(`heroMenu.${item.key}`)}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* 底部的小字（像官网那种气质） */}
          <div
            className={[
              "mt-14 text-white/60 text-xs tracking-[0.25em]",
              "transition-all duration-500",
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            ].join(" ")}
            style={{ transitionDelay: open ? "520ms" : "0ms" }}
          >
            © VTUBER-SITE
          </div>

          {/* 语言选择器 */}
          <div
            className={[
              "mt-6 transition-all duration-500",
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            ].join(" ")}
            style={{ transitionDelay: open ? "590ms" : "0ms" }}
          >
            <LanguageSelector variant="dark" menuPosition="bottom" />
          </div>
        </nav>
      </aside>
    </div>
  );
}
