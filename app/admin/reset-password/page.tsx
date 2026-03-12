// app/admin/reset-password/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BackButton,
  Button,
  EditorialAuthLayout,
  Input,
} from "@/components/ui";
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
    <>
      <BackButton href="/admin" label="返回登录" />
      <EditorialAuthLayout
        eyebrow="Password reset"
        title="Set the next key for the console."
        description="Choose a new password and return to the admin flow with a cleaner handoff."
        stats={[
          { label: "Minimum", value: "6 characters" },
          { label: "Return", value: "Admin sign-in" },
        ]}
        panel={
          <div className="space-y-8">
            <div>
              <div className="editorial-kicker">Reset Password</div>
              <h2 className="mt-4 text-[2.2rem] font-light text-[color:var(--editorial-text)]">
                设置新密码
              </h2>
              <p className="editorial-copy mt-4">请输入您的新密码。</p>
            </div>

            {success ? (
              <div className="rounded-[1.4rem] border border-emerald-500/24 bg-emerald-500/8 px-5 py-4 text-sm leading-7 text-emerald-800">
                密码重置成功，正在跳转到登录页面。
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <Input
                  label="新密码"
                  placeholder="至少 6 位"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />

                <Input
                  label="确认密码"
                  placeholder="再次输入新密码"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
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
                  disabled={loading || !token}
                >
                  {loading ? "重置中..." : "重置密码"}
                </Button>
              </form>
            )}

            <div className="border-t border-[color:color-mix(in_srgb,var(--editorial-border)_80%,transparent)] pt-5 text-[11px] uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
              <Link className="editorial-link" href="/admin">
                返回登录
              </Link>
            </div>
          </div>
        }
      />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="editorial-shell editorial-shell--light flex min-h-screen items-center justify-center">
          <div className="editorial-panel px-8 py-6 text-sm text-[color:var(--editorial-muted)]">
            加载中...
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
