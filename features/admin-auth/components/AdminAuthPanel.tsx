"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAuthPanel() {
  const [enter, setEnter] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 200); // 背景先出现，200ms 后卡片入场
    return () => clearTimeout(t);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok) {
        setError(data.message ?? "登录失败");
        setLoading(false);
        return;
      }

      // ✅ 登录成功：跳转到编辑目录
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError("网络错误，请稍后再试");
      setLoading(false);
    }
  }

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
        登录后可编辑你的个人页面内容。
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <label className="text-xs text-black/70">邮箱</label>
          <input
            className="
              mt-2 w-full rounded-xl
              border border-black/10
              bg-white/70
              px-4 py-3
              text-sm text-black
              placeholder:text-black/30
              outline-none
              focus:border-black/30
            "
            placeholder="email@example.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs text-black/70">密码</label>
          <input
            className="
              mt-2 w-full rounded-xl
              border border-black/10
              bg-white/70
              px-4 py-3
              text-sm text-black
              placeholder:text-black/30
              outline-none
              focus:border-black/30
            "
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-center text-xs text-red-600/80">{error}</div>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "登录中..." : "登录"}
        </button>

        <div className="pt-2 text-center text-xs text-black/55">
          <Link className="hover:text-black" href="/admin/forgot-password">
            忘记密码
          </Link>
          <span className="px-2 text-black/25">/</span>
          <Link className="hover:text-black" href="/admin/register">
            注册账号
          </Link>
        </div>
      </form>
    </div>
  );
}
