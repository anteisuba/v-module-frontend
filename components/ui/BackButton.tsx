"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

type BackButtonProps = {
  /**
   * 返回的目标路径，如果不提供则使用浏览器历史返回
   * @default undefined (使用 router.back())
   */
  href?: string;
  /**
   * 按钮文本
   * @default "返回"
   */
  label?: string;
  /**
   * 按钮位置
   * @default "top-left"
   */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /**
   * 是否显示为链接样式（文本链接而非按钮）
   * @default false
   */
  asLink?: boolean;
  /**
   * 自定义 className
   */
  className?: string;
  /**
   * 是否使用固定定位
   * @default true
   */
  fixed?: boolean;
};

export default function BackButton({
  href,
  label = "返回",
  position = "top-left",
  asLink = false,
  className = "",
  fixed = true,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (href) {
      router.push(href);
    } else {
      // 检查是否有历史记录，如果没有则返回首页
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  // 位置样式
  const positionClasses = {
    "top-left": "top-6 left-6",
    "top-right": "top-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-right": "bottom-6 right-6",
  };

  const baseClasses = fixed ? `fixed z-50 ${positionClasses[position]}` : "";

  // 链接样式
  if (asLink) {
    if (href) {
      return (
        <Link
          href={href}
          className={`${baseClasses} text-sm text-black/70 hover:text-black transition underline ${className}`}
        >
          ← {label}
        </Link>
      );
    }
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} text-sm text-black/70 hover:text-black transition underline ${className}`}
      >
        ← {label}
      </button>
    );
  }

  // 按钮样式（默认）
  const buttonClasses = `
    ${baseClasses}
    rounded-xl border border-black/10 bg-white/70 backdrop-blur-sm
    px-4 py-2 text-sm font-medium text-black
    hover:bg-white/80 hover:border-black/20
    transition-all duration-200
    shadow-sm hover:shadow-md
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        ← {label}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={buttonClasses} type="button">
      ← {label}
    </button>
  );
}
