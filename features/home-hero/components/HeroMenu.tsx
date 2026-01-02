"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ITEMS = [
  { label: "LOGIN", href: "/admin" },
  { label: "New", href: "/news" },
  { label: "BLOG", href: "/blog" },
  { label: "MEDIA", href: "/media" },
  { label: "PROFILE", href: "/profile" },
  { label: "CONTACT", href: "/contact" },
];

export default function HeroMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  
  // 从路径中提取 slug（如果是 /u/[slug] 格式）
  const getNewsHref = () => {
    const match = pathname?.match(/^\/u\/([^/]+)/);
    if (match && match[1]) {
      return `/news?from=/u/${match[1]}`;
    }
    return "/news";
  };
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
              const href = item.label === "New" ? getNewsHref() : item.href;
              
              return (
                <li
                  key={item.label}
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
                    onClick={onClose}
                    className="text-white text-2xl tracking-[0.2em] opacity-90 hover:opacity-100 transition"
                  >
                    {item.label}
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
        </nav>
      </aside>
    </div>
  );
}
