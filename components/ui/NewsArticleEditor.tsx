// components/ui/NewsArticleEditor.tsx

"use client";

import { useState, useEffect } from "react";
import { newsArticleApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { NewsArticle } from "@/lib/api/types";
import BackgroundEditor from "./BackgroundEditor";

interface NewsArticleEditorProps {
  disabled?: boolean;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
  onUploadImage?: (file: File) => Promise<{ src: string }>;
  // 新闻页面背景配置（用于 NewsListSection、/news 和 /news/[id] 页面）
  newsBackground?: { type: "color" | "image"; value: string };
  onNewsBackgroundChange?: (background: { type: "color" | "image"; value: string }) => void;
}

const CATEGORIES = ["ALL", "MEDIA", "MAGAZINE", "あの", "ANO"];
const SHARE_PLATFORMS = [
  { id: "twitter", label: "Twitter/X" },
  { id: "facebook", label: "Facebook" },
  { id: "line", label: "LINE" },
];

export default function NewsArticleEditor({
  disabled = false,
  onToast,
  onError,
  onUploadImage,
  newsBackground,
  onNewsBackgroundChange,
}: NewsArticleEditorProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("ALL"); // 改为使用标签过滤
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tags, setTags] = useState<string[]>(["ALL"]); // 动态标签列表
  const [newTag, setNewTag] = useState(""); // 新标签输入

  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "MEDIA",
    tag: "",
    shareUrl: "",
    shareChannels: SHARE_PLATFORMS.map((p) => ({
      platform: p.id,
      enabled: false,
    })),
    backgroundType: "color" as "color" | "image",
    backgroundValue: "#000000",
    published: false,
  });

  // 加载文章列表
  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await newsArticleApi.getArticles({
        page: currentPage,
        limit: 10,
        published: null, // 获取所有文章（包括未发布的）
        // 不传 category，显示所有分类的文章
      });
      
      // 根据选中的标签过滤文章
      let filteredArticles = response.articles;
      if (selectedTag !== "ALL") {
        filteredArticles = response.articles.filter(
          (article) => article.tag === selectedTag
        );
      }
      
      setArticles(filteredArticles);
      // 重新计算分页（基于过滤后的结果）
      const totalFiltered = selectedTag === "ALL" 
        ? response.pagination.total 
        : filteredArticles.length;
      setTotalPages(Math.ceil(totalFiltered / 10));
      
      // 从所有文章中提取所有标签（不限于当前页）
      const allTags = new Set<string>(["ALL"]);
      response.articles.forEach((article) => {
        if (article.tag) {
          allTags.add(article.tag);
        }
      });
      setTags(Array.from(allTags));
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        onError?.(err.message);
      } else {
        onError?.("加载文章列表失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [currentPage, selectedTag]);

  // 添加新标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "MEDIA",
      tag: "",
      shareUrl: "",
      shareChannels: SHARE_PLATFORMS.map((p) => ({
        platform: p.id,
        enabled: false,
      })),
      backgroundType: "color",
      backgroundValue: "#000000",
      published: false,
    });
    setEditingArticle(null);
    setIsCreating(false);
  };

  // 开始创建新文章
  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  // 开始编辑文章
  const handleEdit = (article: NewsArticle) => {
    // 如果正在编辑同一篇文章，保留当前表单数据
    if (editingArticle?.id === article.id) {
      // 保持当前表单数据不变
      return;
    }
    
    // 编辑不同文章时，从数据库加载数据
    // 确保 shareChannels 有正确的结构
    const articleShareChannels = (article.shareChannels as Array<{ platform: string; enabled: boolean }>) || [];
    // 确保所有平台都存在
    const shareChannels = SHARE_PLATFORMS.map((p) => {
      const existing = articleShareChannels.find((ch) => ch.platform === p.id);
      return existing || { platform: p.id, enabled: false };
    });
    
    setFormData({
      title: article.title || "",
      content: article.content || "",
      category: article.category || "MEDIA",
      tag: article.tag || "",
      shareUrl: article.shareUrl || "",
      shareChannels: shareChannels,
      backgroundType: (article.backgroundType as "color" | "image") || "color",
      backgroundValue: article.backgroundValue || "#000000",
      published: article.published || false,
    });
    setEditingArticle(article);
    setIsCreating(false);
  };

  // 保存文章
  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      onError?.("标题和内容不能为空");
      return;
    }

    try {
      if (editingArticle) {
        // 更新现有文章
        await newsArticleApi.updateArticle(editingArticle.id, {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tag: formData.tag || undefined,
          shareUrl: formData.shareUrl || undefined,
          shareChannels: formData.shareChannels,
          backgroundType: formData.backgroundType,
          backgroundValue: formData.backgroundValue,
          published: formData.published,
        });
        onToast?.("文章已更新");
      } else {
        // 创建新文章
        await newsArticleApi.createArticle({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tag: formData.tag || undefined,
          shareUrl: formData.shareUrl || undefined,
          shareChannels: formData.shareChannels,
          backgroundType: formData.backgroundType,
          backgroundValue: formData.backgroundValue,
          published: formData.published,
        });
        if (formData.published) {
          onToast?.("文章已创建并发布");
        } else {
          onToast?.("文章已创建（草稿）");
        }
      }
      // 保存成功后，保留表单数据，只关闭编辑状态
      if (editingArticle) {
        // 更新文章后，保留表单数据，但关闭编辑状态
        setEditingArticle(null);
      } else {
        // 创建新文章后，重置表单
        resetForm();
      }
      loadArticles();
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        onError?.(err.message);
      } else {
        onError?.("保存失败");
      }
    }
  };

  // 删除文章
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return;

    try {
      await newsArticleApi.deleteArticle(id);
      onToast?.("文章已删除");
      loadArticles();
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        onError?.(err.message);
      } else {
        onError?.("删除失败");
      }
    }
  };

  // 切换分享渠道
  const toggleShareChannel = (platformId: string) => {
    setFormData({
      ...formData,
      shareChannels: formData.shareChannels.map((ch) =>
        ch.platform === platformId ? { ...ch, enabled: !ch.enabled } : ch
      ),
    });
  };

  if (loading && articles.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
        <div className="text-center text-black/60">加载中...</div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-black">新闻文章管理</h2>
        <button
          type="button"
          onClick={handleCreate}
          disabled={disabled || isCreating || editingArticle !== null}
          className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 新建文章
        </button>
      </div>

      {/* 新闻页面背景设置（用于 NewsListSection、/news 和 /news/[id] 页面） */}
      {newsBackground && onNewsBackgroundChange && (
        <div className="mb-4 rounded-lg border border-black/10 bg-white/70 p-4">
          <BackgroundEditor
            label="新闻页面背景设置（控制 NewsListSection、/news 和 /news/[id] 页面）"
            background={newsBackground}
            onBackgroundChange={onNewsBackgroundChange}
            disabled={disabled}
            onUploadImage={onUploadImage}
            onToast={(msg) => onToast?.(msg || "新闻页面背景图片上传成功")}
            onError={onError}
            previewHeight="h-32"
          />
        </div>
      )}

      {/* 标签过滤（替代分类过滤） */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSelectedTag(tag);
                setCurrentPage(1);
              }}
              disabled={disabled}
              className={[
                "rounded px-3 py-1.5 text-xs transition-colors",
                selectedTag === tag
                  ? "bg-black text-white"
                  : "bg-white/70 text-black hover:bg-white/90",
                disabled && "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="添加新标签"
            className="flex-1 rounded border border-black/10 bg-white px-2 py-1 text-xs text-black"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={disabled || !newTag.trim()}
            className="rounded border border-black/10 bg-white/70 px-2 py-1 text-xs font-medium text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </div>

      {/* 编辑表单 */}
      {(isCreating || editingArticle) && (
        <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1.5">
              标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="文章标题"
              className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1.5">
              内容 *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="文章内容（支持 Markdown）"
              rows={8}
              className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1.5">
              标签
            </label>
            <input
              type="text"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              placeholder="例如：あの"
              className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1.5">
              分享链接
            </label>
            <input
              type="url"
              value={formData.shareUrl}
              onChange={(e) =>
                setFormData({ ...formData, shareUrl: e.target.value })
              }
              placeholder="https://example.com"
              className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1.5">
              分享渠道
            </label>
            <div className="flex gap-3">
              {SHARE_PLATFORMS.map((platform) => {
                const channel = formData.shareChannels.find(
                  (ch) => ch.platform === platform.id
                );
                return (
                  <label
                    key={platform.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={channel?.enabled || false}
                      onChange={() => toggleShareChannel(platform.id)}
                      disabled={disabled}
                      className="toggle toggle-sm"
                    />
                    <span className="text-xs text-black/70">{platform.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 背景编辑（仅用于文章详情页） */}
          <div>
            <BackgroundEditor
              label="文章详情页背景设置（仅控制 /news/[id] 页面）"
              background={{
                type: formData.backgroundType,
                value: formData.backgroundValue,
              }}
              onBackgroundChange={(background) => {
                setFormData({
                  ...formData,
                  backgroundType: background.type,
                  backgroundValue: background.value,
                });
              }}
              disabled={disabled}
              onUploadImage={onUploadImage}
              onToast={onToast}
              onError={onError}
              previewHeight="h-16"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                disabled={disabled}
                className="toggle toggle-sm"
              />
              <span className="text-xs text-black/70">已发布（勾选后文章会在公开页面显示）</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={disabled}
              className="rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={disabled}
              className="rounded-lg border border-black/10 bg-white/70 px-4 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      <div className="space-y-2">
        {articles.map((article) => (
          <div
            key={article.id}
            className="rounded-lg border border-black/10 bg-white/70 p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs text-black/50">
                    {new Date(article.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                  <span className="text-xs font-medium text-black">
                    {article.category}
                  </span>
                  {article.tag && (
                    <span className="text-xs text-black/60">{article.tag}</span>
                  )}
                  {article.published && (
                    <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] text-green-700">
                      已发布
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-black">{article.title}</h3>
              </div>
              <div className="ml-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(article)}
                  disabled={disabled}
                  className="rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] font-medium text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(article.id)}
                  disabled={disabled}
                  className="rounded border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={disabled || currentPage === 1}
            className="rounded border border-black/10 bg-white/70 px-3 py-1 text-xs text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-xs text-black/60">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={disabled || currentPage === totalPages}
            className="rounded border border-black/10 bg-white/70 px-3 py-1 text-xs text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

