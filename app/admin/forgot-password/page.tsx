// app/admin/forgot-password/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui";
import { userApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await userApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        // 404 表示邮箱未注册
        if (err.status === 404) {
          setError("该邮箱未注册");
        } else {
          setError(err.message);
        }
      } else if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("请求失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <BackButton href="/admin" label="返回登录" />

      {/* 背景图 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-b.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      {/* 前景内容 */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6">
        <header className="pt-10 text-center">
          <div className="mx-auto inline-flex items-center gap-3">
            <div className="text-5xl font-black tracking-tight">ZUTOMAYO</div>
            <span className="inline-flex items-center bg-black px-3 py-1 text-sm font-bold tracking-[0.2em] text-white">
              RESET PASSWORD
            </span>
          </div>
          <div className="mt-3 text-xs tracking-[0.25em] text-black/70">
            找回密码
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white/55 backdrop-blur-xl px-10 py-10 shadow-2xl">
            <div className="text-[11px] tracking-[0.35em] text-black/60">
              FORGOT PASSWORD
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
              忘记密码
            </h1>
            <p className="mt-2 text-sm text-black/60">
              请输入您的邮箱地址，我们将发送重置密码链接
            </p>

            {success ? (
              <div className="mt-7 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                我们已发送重置密码链接到您的邮箱。请检查您的邮箱（包括垃圾邮件文件夹）。
                <br />
                <br />
                链接将在 24 小时后过期。
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-7 space-y-4">
                <div>
                  <label className="text-xs text-black/70">邮箱</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/30"
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
                  <div className="text-center text-xs text-red-600/80">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "发送中..." : "发送重置链接"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 text-center text-xs text-black/55 border-t border-black/10">
              <Link className="hover:text-black" href="/admin">
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

