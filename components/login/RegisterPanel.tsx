"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPanel() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);

    const payload = {
      email: email.trim(),
      password,
      displayName: displayName.trim(),
    };

    if (!payload.email || !payload.password) {
      setError("邮箱和密码必填");
      return;
    }
    if (payload.password.length < 8) {
      setError("密码至少 8 位");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? "注册失败");
        return;
      }

      setDone(true);
      // 你想要“注册完跳登录”就这样：
      setTimeout(() => router.push("/admin"), 600);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 背景同一套审美 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-b.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white/55 backdrop-blur-xl px-10 py-10 shadow-2xl">
          <div className="text-[11px] tracking-[0.35em] text-black/60">
            REGISTER
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
            新规注册
          </h1>

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs text-black/70">邮箱</label>
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-black/30"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs text-black/70">密码</label>
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-black/30"
                type="password"
                placeholder="至少 8 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="text-xs text-black/70">显示名（可选）</label>
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-black/30"
                type="text"
                placeholder="比如：fulina"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "注册中..." : "注册"}
            </button>

            {error && (
              <div className="text-center text-xs text-red-600/80">{error}</div>
            )}

            {done && (
              <div className="text-center text-xs text-emerald-700/80">
                注册成功，正在跳转登录…
              </div>
            )}

            <div className="pt-2 text-center text-xs text-black/55">
              已有账号？{" "}
              <Link className="hover:text-black" href="/admin">
                去登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
