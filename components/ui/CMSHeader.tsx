// components/ui/CMSHeader.tsx

"use client";

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
  title = "页面编辑器",
  description = "编辑你的个人页面配置",
  userSlug,
  onSaveDraft,
  onPublish,
  saving = false,
  publishing = false,
  disabled = false,
}: CMSHeaderProps) {
  return (
    <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-black">{title}</h1>
        <p className="mt-1 text-xs text-black/70">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 预览按钮 */}
        {userSlug && (
          <a
            href={`/u/${userSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
          >
            打开页面
          </a>
        )}

        {/* 保存草稿按钮 */}
        {onSaveDraft && (
          <button
            onClick={onSaveDraft}
            disabled={disabled || saving || publishing}
            className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "保存中..." : "保存草稿"}
          </button>
        )}

        {/* 发布按钮 */}
        {onPublish && (
          <button
            onClick={onPublish}
            disabled={disabled || saving || publishing}
            className="cursor-pointer rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? "发布中..." : "发布"}
          </button>
        )}
      </div>
    </div>
  );
}

