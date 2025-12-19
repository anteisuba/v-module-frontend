"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAuthPanel() {
  const [enter, setEnter] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 200); // 背景先出现，200ms 后卡片入场
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        "w-full max-w-xl rounded-2xl border border-black/10",
        "bg-white/55 backdrop-blur-xl shadow-2xl",
        "px-10 py-10",
        "transition-all duration-500 ease-out",
        enter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
      ].join(" ")}
    >
      <div className="text-[11px] tracking-[0.35em] text-black/60">LOGIN</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
        管理入口
      </h1>
      <p className="mt-2 text-sm text-black/60">
        登录后可编辑首页内容（图片 / 视频 / 文案）。
      </p>

      <form className="mt-7 space-y-4">
        <div>
          <label className="text-xs text-black/70">邮箱</label>
          <input
            className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-black/30"
            placeholder="email@example.com"
            type="email"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs text-black/70">密码</label>
          <input
            className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-black/30"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-black/90"
        >
          登录
        </button>

        {/* 👇 你说的“忘记密码/注册”放这里 */}
        <div className="pt-2 text-center text-xs text-black/55">
          <a className="hover:text-black" href="#">
            忘记密码
          </a>
          <span className="px-2 text-black/25">/</span>
          <Link className="hover:text-black" href="/admin/register">
            注册
          </Link>
        </div>
      </form>
    </div>
  );
}
