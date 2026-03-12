// app/admin/forgot-password/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BackButton,
  Button,
  EditorialAuthLayout,
  Input,
} from "@/components/ui";
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
    <>
      <BackButton href="/admin" label="返回登录" />
      <EditorialAuthLayout
        eyebrow="Recovery"
        title="Bring the account back into the room."
        description="Request a reset link and resume access without leaving the editorial flow."
        stats={[
          { label: "Window", value: "24 hours" },
          { label: "Delivery", value: "Email link" },
        ]}
        panel={
          <div className="space-y-8">
            <div>
              <div className="editorial-kicker">Forgot Password</div>
              <h2 className="mt-4 text-[2.2rem] font-light text-[color:var(--editorial-text)]">
                忘记密码
              </h2>
              <p className="editorial-copy mt-4">
                请输入您的邮箱地址，我们将发送重置密码链接。
              </p>
            </div>

            {success ? (
              <div className="rounded-[1.4rem] border border-emerald-500/24 bg-emerald-500/8 px-5 py-4 text-sm leading-7 text-emerald-800">
                我们已发送重置密码链接到您的邮箱。请检查您的邮箱，包括垃圾邮件文件夹。链接将在 24 小时后过期。
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <Input
                  label="邮箱"
                  placeholder="email@example.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
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
                  {loading ? "发送中..." : "发送重置链接"}
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
