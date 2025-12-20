"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPanel() {
  const [enter, setEnter] = useState(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 200);
    return () => clearTimeout(t);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!res.ok) {
        setError(data.message ?? "请求失败");
        setLoading(false);
        return;
      }

      // 成功：显示成功消息
      setSuccess(true);
      setLoading(false);
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
      <div className="text-[11px] tracking-[0.35em] text-black/60">
        FORGOT PASSWORD
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
        重置密码
      </h1>
      <p className="mt-2 text-sm text-black/60">
        请输入您的邮箱地址，我们将发送重置密码链接到您的邮箱。
      </p>

      {success ? (
        <div className="mt-7 space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            如果该邮箱存在，重置链接已发送到您的邮箱。请检查您的收件箱（包括垃圾邮件文件夹）。
          </div>
          <div className="pt-2 text-center text-xs text-black/55">
            <Link className="hover:text-black" href="/admin">
              返回登录
            </Link>
          </div>
        </div>
      ) : (
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
              required
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
            {loading ? "发送中..." : "发送重置链接"}
          </button>

          <div className="pt-2 text-center text-xs text-black/55">
            <Link className="hover:text-black" href="/admin">
              返回登录
            </Link>
            <span className="px-2 text-black/25">/</span>
            <Link className="hover:text-black" href="/admin/register">
              注册
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
