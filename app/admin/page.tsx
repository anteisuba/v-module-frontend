"use client";

import { AdminAuthPanel } from "@/features/admin-auth";
import { EditorialAuthLayout, LanguageSelector } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export default function AdminPage() {
  const { t } = useI18n();

  return (
    <EditorialAuthLayout
      eyebrow={t("admin.subtitle")}
      title={t("admin.title")}
      description="A quieter control room for creator pages, editorial publishing, and storefront operations."
      panel={<AdminAuthPanel />}
      topRight={<LanguageSelector position="inline" />}
      stats={[
        { label: "CMS", value: "Draft / Publish" },
        { label: "Store", value: "Orders / Stripe" },
        { label: "Pages", value: "Public layouts" },
        { label: "Locale", value: "ZH / EN / JA" },
      ]}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>{t("admin.footer.about")}</span>
            <span>{t("admin.footer.terms")}</span>
            <span>{t("admin.footer.privacy")}</span>
            <span>{t("admin.footer.contact")}</span>
          </div>
          <div>{t("admin.footer.copyright")}</div>
        </div>
      }
    />
  );
}
