"use client";

import { AdminAuthPanel } from "@/features/admin-auth";
import { LanguageSelector } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export default function AdminPage() {
  const { t } = useI18n();

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="fixed bottom-6 right-6 z-[100]">
        <LanguageSelector position="inline" />
      </div>
      {/* 背景图：铺满 */}
      <div className="absolute inset-0">
        {/* 你也可以换成 next/image，这里先用 div 更省事 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-b.jpeg)" }}
        />
        {/* 雾面淡化层：参考图那种纸面灰 */}
        <div className="absolute inset-0 bg-white/70" />
        {/* 轻微暗角（更“官网”） */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      {/* 前景内容 */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6">
        {/* 顶部大标题区（像参考图那样） */}
        <header className="pt-10 text-center">
          <div className="mx-auto inline-flex items-center gap-3">
            <span className="inline-flex items-center bg-black px-3 py-1 text-2xl font-bold tracking-[0.2em] text-white">
              {t("admin.title")}
            </span>
          </div>
          <div className="mt-3 text-xs tracking-[0.25em] text-black/70">
            {t("admin.subtitle")}
          </div>
        </header>

        {/* 表单卡片 */}
        <div className="flex flex-1 items-center justify-center py-10">
          <AdminAuthPanel />
        </div>

        {/* 底部链接栏（先占位） */}
        <footer className="pb-6 text-center text-xs text-black/60">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a className="hover:text-black" href="#">
              {t("admin.footer.about")}
            </a>
            <a className="hover:text-black" href="#">
              {t("admin.footer.terms")}
            </a>
            <a className="hover:text-black" href="#">
              {t("admin.footer.privacy")}
            </a>
            <a className="hover:text-black" href="#">
              {t("admin.footer.contact")}
            </a>
          </div>
          <div className="mt-3 text-black/40">{t("admin.footer.copyright")}</div>
        </footer>
      </div>
    </main>
  );
}
