// components/blog/BlogEditor.tsx

"use client";

import { useState, useEffect } from "react";
import { Input, Button, FormField, Alert } from "@/components/ui";
import { pageApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";
import { detectPlatform } from "@/features/video-section";
import VideoPlayer from "@/features/video-section/components/VideoPlayer";

interface BlogEditorProps {
  initialData?: {
    id?: string;
    title: string;
    content: string;
    coverImage: string | null;
    videoUrl: string | null;
    externalLinks: Array<{ url: string; label: string }> | null;
    published: boolean;
  };
  onSave: (data: {
    title: string;
    content: string;
    coverImage: string | null;
    videoUrl: string | null;
    externalLinks: Array<{ url: string; label: string }> | null;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function BlogEditor({
  initialData,
  onSave,
  onCancel,
  saving = false,
}: BlogEditorProps) {
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [coverImage, setCoverImage] = useState<string | null>(
    initialData?.coverImage || null
  );
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [externalLinks, setExternalLinks] = useState<
    Array<{ url: string; label: string }>
  >(initialData?.externalLinks || []);
  const [published, setPublished] = useState(initialData?.published || false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // 添加外部链接
  function addExternalLink() {
    setExternalLinks([...externalLinks, { url: "", label: "" }]);
  }

  // 更新外部链接
  function updateExternalLink(
    index: number,
    field: "url" | "label",
    value: string
  ) {
    const updated = [...externalLinks];
    updated[index] = { ...updated[index], [field]: value };
    setExternalLinks(updated);
  }

  // 删除外部链接
  function removeExternalLink(index: number) {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  }

  // 上传封面图
  async function handleCoverImageUpload(file: File) {
    try {
      setUploadingCover(true);
      const result = await pageApi.uploadImage(file);
      setCoverImage(result.src);
      showToast("封面图片上传成功");
    } catch (err) {
      handleError(err);
    } finally {
      setUploadingCover(false);
    }
  }

  // 保存
  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      showToast(t("blog.form.title") + " 和 " + t("blog.form.content") + " 不能为空");
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        coverImage,
        videoUrl: videoUrl.trim() || null,
        externalLinks: externalLinks.filter(
          (link) => link.url.trim() && link.label.trim()
        ),
        published,
      });
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast 提示 */}
      {toastMessage && (
        <Alert type="success" message={toastMessage} />
      )}

      {/* 错误提示 */}
      {error && <Alert type="error" message={error} onClose={clearError} />}

      {/* 标题 */}
      <FormField label={t("blog.form.title")} required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("blog.form.titlePlaceholder")}
          disabled={saving}
        />
      </FormField>

      {/* 内容 */}
      <FormField label={t("blog.form.content")} required>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("blog.form.contentPlaceholder")}
          disabled={saving}
          rows={15}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-1 resize-y"
        />
        <p className="text-[10px] text-black/50 mt-1">
          支持 Markdown 格式
        </p>
      </FormField>

      {/* 封面图 */}
      <FormField label={t("blog.form.coverImage")}>
        <div className="space-y-3 rounded-lg border border-black/10 bg-white/70 p-4">
          {coverImage && (
            <div className="mb-3">
              <div className="relative inline-block">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-black/10"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  disabled={saving}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-black/70 mb-2">
                上传本地图片
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  const inputElement = e.currentTarget;
                  if (file) {
                    handleCoverImageUpload(file);
                    if (inputElement) {
                      inputElement.value = "";
                    }
                  }
                }}
                disabled={saving || uploadingCover}
                className="block w-full text-xs text-black/80 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
              />
            </div>
            <div>
              <label className="block text-xs text-black/70 mb-2">
                或输入图片链接
              </label>
              <input
                type="text"
                value={coverImage || ""}
                onChange={(e) => setCoverImage(e.target.value || null)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30"
                disabled={saving || uploadingCover}
              />
            </div>
            {uploadingCover && (
              <div className="text-xs text-black/60">{t("common.uploading")}</div>
            )}
          </div>
        </div>
      </FormField>

      {/* 视频链接 */}
      <FormField label={t("blog.form.videoUrl")}>
        <div className="space-y-3 rounded-lg border border-black/10 bg-white/70 p-4">
          <div>
            <label className="block text-xs text-black/70 mb-2">
              视频链接
            </label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.bilibili.com/video/BV1Sai9BoEzN/ 或 https://www.youtube.com/watch?v=..."
              disabled={saving}
            />
            <p className="mt-1 text-[10px] text-black/50">
              支持 YouTube 和 Bilibili 链接
            </p>
            {videoUrl && (
              <div className="mt-2 flex items-center gap-2 text-xs text-black/70">
                <span>平台：</span>
                <span className="font-medium">
                  {detectPlatform(videoUrl) === "youtube"
                    ? "YouTube"
                    : detectPlatform(videoUrl) === "bilibili"
                    ? "Bilibili"
                    : "未知"}
                </span>
              </div>
            )}
          </div>
          {/* 视频预览 */}
          {videoUrl && videoUrl.trim() && detectPlatform(videoUrl) && (
            <div className="aspect-[16/9] rounded-lg border border-black/10 overflow-hidden bg-black/5 relative">
              <VideoPlayer
                item={{
                  id: "blog-video",
                  url: videoUrl,
                  platform: detectPlatform(videoUrl) || "auto",
                }}
                className="absolute inset-0"
              />
            </div>
          )}
        </div>
      </FormField>

      {/* 外部链接 */}
      <FormField label={t("blog.form.externalLinks")}>
        <div className="space-y-2">
          {externalLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={link.label}
                onChange={(e) =>
                  updateExternalLink(index, "label", e.target.value)
                }
                placeholder="链接标签"
                disabled={saving}
                className="flex-1"
              />
              <Input
                value={link.url}
                onChange={(e) =>
                  updateExternalLink(index, "url", e.target.value)
                }
                placeholder="https://example.com"
                disabled={saving}
                className="flex-2"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeExternalLink(index)}
                disabled={saving}
              >
                {t("common.delete")}
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={addExternalLink}
            disabled={saving}
          >
            {t("common.add")}
          </Button>
        </div>
      </FormField>

      {/* 发布状态 */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            disabled={saving}
            className="w-4 h-4"
          />
          <span className="text-xs text-black">{t("blog.form.published")}</span>
        </label>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          {t("blog.form.cancel")}
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          {t("blog.form.save")}
        </Button>
      </div>
    </div>
  );
}
