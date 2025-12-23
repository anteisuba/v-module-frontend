// app/admin/reset-password/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui";
import { userApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("缺少重置 token");
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !token) return;

    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await userApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("重置失败，请稍后再试");
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
            重置密码
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white/55 backdrop-blur-xl px-10 py-10 shadow-2xl">
            <div className="text-[11px] tracking-[0.35em] text-black/60">
              RESET PASSWORD
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
              设置新密码
            </h1>
            <p className="mt-2 text-sm text-black/60">
              请输入您的新密码
            </p>

            {success ? (
              <div className="mt-7 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                密码重置成功！正在跳转到登录页面...
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-7 space-y-4">
                <div>
                  <label className="text-xs text-black/70">新密码</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/30"
                    placeholder="至少 6 位"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="text-xs text-black/70">确认密码</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/30"
                    placeholder="再次输入新密码"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
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
                  disabled={loading || !token}
                >
                  {loading ? "重置中..." : "重置密码"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="text-lg text-black">加载中...</div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

