// app/admin/register/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui";
import { userApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await userApi.register({
        email,
        password,
        displayName,
        slug,
      });

      // 注册成功，跳转到登录页
      router.push("/admin?registered=true");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("注册失败，请稍后再试");
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
              REGISTER
            </span>
          </div>
          <div className="mt-3 text-xs tracking-[0.25em] text-black/70">
            创建账号
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white/55 backdrop-blur-xl px-10 py-10 shadow-2xl">
            <div className="text-[11px] tracking-[0.35em] text-black/60">
              REGISTER
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
              创建账号
            </h1>
            <p className="mt-2 text-sm text-black/60">
              注册后即可创建你的个人页面
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <div>
                <label className="text-xs text-black/70">邮箱 *</label>
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

              <div>
                <label className="text-xs text-black/70">密码 *</label>
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
                <label className="text-xs text-black/70">显示名称（可选）</label>
                <input
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/30"
                  placeholder="比如: fulina"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs text-black/70">
                  用户名（URL，可选）
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/30"
                  placeholder="不填则从邮箱生成"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-black/50">
                  用于 /u/[你的用户名] 页面 URL
                </p>
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
                {loading ? "注册中..." : "注册"}
              </button>

              <div className="pt-2 text-center text-xs text-black/55">
                已有账号？{" "}
                <Link className="hover:text-black" href="/admin">
                  去登录
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

