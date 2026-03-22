// app/admin/register/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BackButton,
  Button,
  EditorialAuthLayout,
  Input,
  Alert,
} from "@/components/ui";
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
    <>
      <BackButton href="/admin" label="返回登录" fixed={false} className="absolute top-6 left-6 z-50" />
      <EditorialAuthLayout
        eyebrow="Creator access"
        title="Open a quieter publishing desk."
        description="Create the account that will own your public page, editorial content, and storefront settings."
        stats={[
          { label: "Page", value: "/u/slug" },
          { label: "Publishing", value: "News / Blog" },
          { label: "Commerce", value: "Shop / Orders" },
          { label: "Payouts", value: "Stripe Connect" },
        ]}
        panel={
          <div className="space-y-8">
            <div>
              <div className="editorial-kicker">Register</div>
              <h2 className="mt-4 text-[2.2rem] font-light text-[color:var(--editorial-text)]">
                创建账号
              </h2>
              <p className="editorial-copy mt-4">
                注册后即可创建你的个人页面。
              </p>
            </div>

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

              <Input
                label="密码"
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
                label="显示名称（可选）"
                placeholder="比如: fulina"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />

              <Input
                label="用户名（URL，可选）"
                placeholder="不填则从邮箱生成"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={loading}
                helpText="用于 /u/[你的用户名] 页面 URL。"
              />

              {error ? (
                <Alert type="error" message={error} className="rounded-[1.2rem]" />
              ) : null}

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
                disabled={loading}
              >
                {loading ? "注册中..." : "注册"}
              </Button>

              <div className="border-t border-[color:color-mix(in_srgb,var(--editorial-border)_80%,transparent)] pt-5 text-[11px] uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
                已有账号？{" "}
                <Link className="editorial-link" href="/admin">
                  去登录
                </Link>
              </div>
            </form>
          </div>
        }
      />
    </>
  );
}
