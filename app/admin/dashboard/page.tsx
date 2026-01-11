// app/admin/dashboard/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/UserContext";
import { LanguageSelector } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

type EditPageOption = {
  id: string;
  label: string;
  href: string;
  description?: string;
  available: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const { t } = useI18n();
  const [selectedPage, setSelectedPage] = useState<string>("cms");

  // 使用翻译的页面选项
  const EDIT_PAGES: EditPageOption[] = useMemo(() => [
    {
      id: "cms",
      label: t("admin.dashboard.pages.cms.label"),
      href: "/admin/cms",
      description: t("admin.dashboard.pages.cms.description"),
      available: true,
    },
    {
      id: "blog",
      label: t("admin.dashboard.pages.blog.label"),
      href: "/admin/blog",
      description: t("admin.dashboard.pages.blog.description"),
      available: true,
    },
    {
      id: "shop",
      label: t("admin.dashboard.pages.shop.label"),
      href: "/admin/shop",
      description: t("admin.dashboard.pages.shop.description"),
      available: true,
    },
  ], [t]);

  function handleNavigate() {
    const page = EDIT_PAGES.find((p) => p.id === selectedPage);
    if (page && page.available) {
      router.push(page.href);
    }
  }

  async function handleLogout() {
    await logout();
  }

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg text-black">{t("common.loading")}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <button
        onClick={handleLogout}
        className="absolute left-6 top-6 z-50 rounded-lg border border-black/20 bg-white/70 px-4 py-2 text-sm font-medium text-black hover:bg-white/80"
      >
        {t("admin.dashboard.logout")}
      </button>
      
      {/* 语言选择器 */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <LanguageSelector position="bottom-right" />
      </div>

      {/* 背景图 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black">{t("admin.dashboard.title")}</h1>
          <p className="mt-2 text-sm text-black/70">
            {t("admin.dashboard.welcome").replace("{name}", user?.displayName || user?.email || t("admin.dashboard.user"))}
          </p>
        </div>

        {/* 页面选择 */}
        <div className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-black">{t("admin.dashboard.selectPage")}</h2>

          <div className="space-y-3">
            {EDIT_PAGES.map((page) => (
              <label
                key={page.id}
                className={[
                  "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
                  page.available
                    ? selectedPage === page.id
                      ? "border-black/30 bg-white/80"
                      : "border-black/10 bg-white/50 hover:bg-white/70"
                    : "cursor-not-allowed border-black/5 bg-white/30 opacity-60",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="editPage"
                  value={page.id}
                  checked={selectedPage === page.id}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  disabled={!page.available}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black">{page.label}</span>
                    {!page.available && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                        {t("admin.dashboard.comingSoon")}
                      </span>
                    )}
                  </div>
                  {page.description && (
                    <p className="mt-1 text-xs text-black/60">{page.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* 跳转按钮 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNavigate}
              disabled={!EDIT_PAGES.find((p) => p.id === selectedPage)?.available}
              className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.dashboard.enterEdit")}
            </button>
          </div>
        </div>

        {/* 快捷链接 */}
        {user?.slug && (
          <div className="mt-6 text-center">
            <a
              href={`/u/${user.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-black/70 hover:text-black underline"
            >
              {t("admin.dashboard.viewPublicPage")} →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

