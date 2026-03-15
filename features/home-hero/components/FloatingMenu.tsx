"use client";

import { useHeroMenu } from "../hooks/useHeroMenu";
import HeroMenu from "./HeroMenu";

/**
 * 全局浮动菜单按钮 + 侧栏
 * 放在 layout 层，所有 /u/[slug]/* 子页面共享
 */
export default function FloatingMenu() {
  const menu = useHeroMenu();

  return (
    <>
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
