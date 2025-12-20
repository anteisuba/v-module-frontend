"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [enter, setEnter] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // 检查 token 是否存在
    if (!token) {
      setTokenValid(false);
      setError("重置链接无效：缺少 token");
    } else {
      setTokenValid(true);
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !token) return;

    // 验证密码长度
    if (password.length < 8) {
      setError("密码至少 8 位");
      return;
    }

    // 验证密码匹配
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!res.ok) {
        setError(data.message ?? "重置失败");
        setLoading(false);
        return;
      }

      // 成功：显示成功消息，然后跳转到登录页
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err) {
      setError("网络错误，请稍后再试");
      setLoading(false);
    }
  }

  if (tokenValid === false) {
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
          RESET PASSWORD
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
          重置链接无效
        </h1>
        <p className="mt-2 text-sm text-black/60">
          重置链接无效或已过期。请重新申请密码重置。
        </p>
        <div className="mt-7">
          <Link
            href="/admin/forgot-password"
            className="block w-full rounded-xl bg-black py-3 text-center text-sm font-medium text-white hover:bg-black/90"
          >
            重新申请重置
          </Link>
          <div className="mt-4 text-center text-xs text-black/55">
            <Link className="hover:text-black" href="/admin">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
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
        RESET PASSWORD
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
        设置新密码
      </h1>
      <p className="mt-2 text-sm text-black/60">
        请输入您的新密码。密码至少需要 8 个字符。
      </p>

      {success ? (
        <div className="mt-7 space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            密码重置成功！正在跳转到登录页面...
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <div>
            <label className="text-xs text-black/70">新密码</label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-xs text-black/70">确认新密码</label>
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
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-center text-xs text-red-600/80">{error}</div>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            disabled={loading || !token}
          >
            {loading ? "重置中..." : "重置密码"}
          </button>

          <div className="pt-2 text-center text-xs text-black/55">
            <Link className="hover:text-black" href="/admin">
              返回登录
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
