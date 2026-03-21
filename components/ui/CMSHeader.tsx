// components/ui/CMSHeader.tsx

"use client";

import { useI18n } from "@/lib/i18n/context";
import Button from "./Button";

interface CMSHeaderProps {
  title?: string;
  description?: string;
  userSlug?: string | null;
  onPreview?: () => void;
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
  onPreview,
  onSaveDraft,
  onPublish,
  saving = false,
  publishing = false,
  disabled = false,
}: CMSHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-[color:color-mix(in_srgb,var(--editorial-border)_82%,transparent)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="editorial-kicker">Content System</div>
        <div className="line-wipe mt-4 max-w-xs" />
        <h1 className="editorial-title mt-6 text-[color:var(--editorial-text)]">
          {title || t("cms.title")}
        </h1>
        <p className="editorial-copy mt-3">
          {description || t("cms.description")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {userSlug && (
          <a
            href={`/u/${userSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-button editorial-button--secondary min-h-11 px-4 py-2.5 text-[11px]"
          >
            {t("cms.openPage")}
          </a>
        )}

        {userSlug && onPreview && (
          <button
            type="button"
            onClick={onPreview}
            disabled={disabled}
            className="editorial-button editorial-button--secondary min-h-11 px-4 py-2.5 text-[11px] disabled:opacity-50"
          >
            {t("cms.previewDraft")}
          </button>
        )}

        {onSaveDraft && (
          <Button
            variant="secondary"
            size="md"
            onClick={onSaveDraft}
            disabled={disabled || saving || publishing}
            loading={saving}
            data-testid="cms-save-draft"
          >
            {saving ? t("cms.saving") : t("cms.saveDraft")}
          </Button>
        )}

        {onPublish && (
          <Button
            variant="primary"
            size="md"
            onClick={onPublish}
            disabled={disabled || saving || publishing}
            loading={publishing}
            data-testid="cms-publish"
          >
            {publishing ? t("cms.publishing") : t("cms.publish")}
          </Button>
        )}
      </div>
    </div>
  );
}
