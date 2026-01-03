// components/ui/CMSHeader.tsx

"use client";

import { useI18n } from "@/lib/i18n/context";
import Button from "./Button";

interface CMSHeaderProps {
  title?: string;
  description?: string;
  userSlug?: string | null;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  saving?: boolean;
  publishing?: boolean;
  disabled?: boolean;
}

export default function CMSHeader({
  title,
  description,
  userSlug,
  onSaveDraft,
  onPublish,
  saving = false,
  publishing = false,
  disabled = false,
}: CMSHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-black">{title || t("cms.title")}</h1>
        <p className="mt-1 text-xs text-black/70">{description || t("cms.description")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 预览按钮 */}
        {userSlug && (
          <a
            href={`/u/${userSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 border border-black/20 bg-white/70 text-black hover:bg-white/80 active:bg-white/90 px-3 py-1.5 text-xs cursor-pointer"
          >
            {t("cms.openPage")}
          </a>
        )}

        {/* 保存草稿按钮 */}
        {onSaveDraft && (
          <Button
            variant="secondary"
            size="md"
            onClick={onSaveDraft}
            disabled={disabled || saving || publishing}
            loading={saving}
          >
            {saving ? t("cms.saving") : t("cms.saveDraft")}
          </Button>
        )}

        {/* 发布按钮 */}
        {onPublish && (
          <Button
            variant="primary"
            size="md"
            onClick={onPublish}
            disabled={disabled || saving || publishing}
            loading={publishing}
          >
            {publishing ? t("cms.publishing") : t("cms.publish")}
          </Button>
        )}
      </div>
    </div>
  );
}

