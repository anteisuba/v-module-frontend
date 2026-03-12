"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { userApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { useUser } from "@/lib/context/UserContext";
import { useI18n } from "@/lib/i18n/context";

export default function AdminAuthPanel() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await userApi.login(email, password);
      
      // 刷新用户信息
      await refreshUser();
      
      // ✅ 登录成功：跳转到编辑目录
      router.push("/admin/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError(t("auth.login.error") || "登录失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="editorial-kicker">{t("auth.login.title").toUpperCase()}</div>
        <h2 className="mt-4 text-[2.2rem] font-light tracking-[0.02em] text-[color:var(--editorial-text)]">
          {t("auth.login.title")}
        </h2>
        <p className="editorial-copy mt-4">
          {t("auth.login.description") || "登录后可编辑你的个人页面内容。"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label={t("auth.login.email")}
          placeholder="email@example.com"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Input
          label={t("auth.login.password")}
          placeholder="••••••••"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error ? (
          <div className="rounded-[1.2rem] border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full"
          disabled={loading}
        >
          {loading
            ? t("auth.login.submitting") || "登录中..."
            : t("auth.login.submit")}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:color-mix(in_srgb,var(--editorial-border)_80%,transparent)] pt-5 text-[11px] uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
          <Link className="editorial-link" href="/admin/forgot-password">
            {t("auth.login.forgotPassword")}
          </Link>
          <Link className="editorial-link" href="/admin/register">
            {t("auth.login.register")}
          </Link>
        </div>
      </form>
    </div>
  );
}
