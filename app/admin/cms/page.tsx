// app/admin/cms/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui";
import type { PageConfig, HeroSectionProps } from "@/domain/page-config/types";
import { DEFAULT_PAGE_CONFIG } from "@/domain/page-config/constants";

export default function CMSPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function toastOk(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 1800);
  }

  // 获取当前用户信息和草稿配置
  async function loadConfig() {
    setError(null);
    setLoading(true);
    try {
      // 先获取用户信息（用于 slug）
      const userRes = await fetch("/api/user/me", { cache: "no-store" });
      if (!userRes.ok) {
        if (userRes.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("获取用户信息失败");
      }
      const userData = await userRes.json();
      setUserSlug(userData.user?.slug || null);

      // 获取草稿配置
      const configRes = await fetch("/api/page/me", {
        method: "GET",
        cache: "no-store",
      });

      if (configRes.ok) {
        const data = await configRes.json();
        if (data.draftConfig) {
          setConfig(data.draftConfig);
        }
      } else if (configRes.status === 404) {
        // 如果还没有配置，使用默认配置
        setConfig(DEFAULT_PAGE_CONFIG);
      } else {
        throw new Error("读取配置失败");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  // 清理配置数据（过滤掉空的 slides）
  function cleanConfig(config: PageConfig): PageConfig {
    return {
      ...config,
      sections: config.sections.map((section) => {
        if (section.type === "hero") {
          // 过滤掉 src 为空的 slides
          const validSlides = section.props.slides.filter(
            (slide) => slide.src && slide.src.trim().length > 0
          );
          
          return {
            ...section,
            props: {
              ...section.props,
              slides: validSlides, // 允许空数组
            },
          };
        }
        return section;
      }),
    };
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    try {
      // 清理配置数据
      const cleanedConfig = cleanConfig(config);

      const res = await fetch("/api/page/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftConfig: cleanedConfig }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = data.error || data.message || `保存失败 (${res.status})`;
        const details = data.details ? `\n详情: ${JSON.stringify(data.details, null, 2)}` : "";
        throw new Error(errorMsg + details);
      }

      toastOk("草稿已保存");
      // 更新本地配置为清理后的版本
      setConfig(cleanedConfig);
    } catch (e) {
      console.error("Save draft error:", e);
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      // 先保存草稿
      await saveDraft();

      // 然后发布
      const res = await fetch("/api/page/me/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = data.error || data.message || `发布失败 (${res.status})`;
        const details = data.details ? `\n详情: ${JSON.stringify(data.details, null, 2)}` : "";
        throw new Error(errorMsg + details);
      }

      toastOk("已发布！");
    } catch (e) {
      console.error("Publish error:", e);
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  // 获取 hero section
  function getHeroSection() {
    return config.sections.find((s) => s.type === "hero");
  }

  // 更新 hero section 的图片
  function updateHeroSlide(index: number, src: string, alt?: string) {
    const heroSection = getHeroSection();
    if (!heroSection || heroSection.type !== 'hero') return;

    const slides = [...(heroSection.props.slides || [])];
    
    // 确保至少有 index+1 个元素
    while (slides.length <= index) {
      slides.push({ src: "", alt: "" });
    }

    slides[index] = { 
      src: src.trim(), 
      alt: alt?.trim() || slides[index]?.alt?.trim() || "" 
    };

    setConfig({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === heroSection.id && s.type === 'hero') {
          return {
            ...s,
            type: 'hero' as const,
            props: {
              ...heroSection.props,
              slides: slides, // 保留所有 slides（包括可能的空值，保存时会过滤）
            },
          };
        }
        return s;
      }),
    });
  }

  // 上传图片
  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/page/me/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "上传失败");
      }

      updateHeroSlide(index, data.src);
      toastOk(`图片 ${index + 1} 上传成功`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploadingIndex(null);
    }
  }

  // 使用图片链接
  function useImageUrl(index: number, url: string) {
    updateHeroSlide(index, url);
    toastOk(`图片 ${index + 1} 已更新`);
  }

  function handleBackgroundChange(type: "color" | "image", value: string) {
    setConfig({
      ...config,
      background: { type, value },
    });
  }

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg text-black">加载中...</div>
        </div>
      </main>
    );
  }

  const heroSection = getHeroSection();
  let heroSlides = heroSection?.props.slides || [];
  
  // 确保至少有 3 个位置（用于 UI 显示），但允许空的 src
  while (heroSlides.length < 3) {
    heroSlides.push({ src: "", alt: "" });
  }
  
  // 限制为最多 3 张
  heroSlides = heroSlides.slice(0, 3);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <BackButton href="/admin" label="返回登录" />

      {/* 背景图 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {/* 头部：标题和操作按钮 */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">页面编辑器</h1>
            <p className="mt-2 text-sm text-black/70">
              编辑你的个人页面配置
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 预览按钮 */}
            {userSlug && (
              <a
                href={`/u/${userSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-black/20 bg-white/70 px-4 py-2 text-sm font-medium text-black hover:bg-white/80"
              >
                预览页面
              </a>
            )}

            {/* 保存草稿按钮 */}
            <button
              onClick={saveDraft}
              disabled={saving || publishing}
              className="rounded-xl border border-black/20 bg-white/70 px-4 py-2 text-sm font-medium text-black hover:bg-white/80 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存草稿"}
            </button>

            {/* 发布按钮 */}
            <button
              onClick={publish}
              disabled={saving || publishing}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
            >
              {publishing ? "发布中..." : "发布"}
            </button>
          </div>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {ok && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {ok}
          </div>
        )}

        {/* Hero Section 图片编辑 */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-black">
            Hero Section - 顶部轮播图片（3张）
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((index) => {
              const slide = heroSlides[index];
              const isUploading = uploadingIndex === index;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-black/10 bg-white/70 p-4"
                >
                  <div className="mb-3 text-sm font-medium text-black">
                    图片 {index + 1}
                  </div>

                  {/* 预览 */}
                  <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg border border-black/10 bg-black/5">
                    {slide?.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.src}
                        alt={slide.alt || `Hero ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-black/50">
                        暂无图片
                      </div>
                    )}
                  </div>

                  {/* 上传文件 */}
                  <div className="mb-3">
                    <label className="block text-xs text-black/70">
                      上传本地图片
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-xs text-black/80 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:text-white hover:file:bg-black/90"
                      disabled={isUploading || saving || publishing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadImage(index, file);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>

                  {/* 或使用图片链接 */}
                  <div>
                    <label className="block text-xs text-black/70">
                      或输入图片链接
                    </label>
                    <input
                      type="text"
                      value={slide?.src || ""}
                      onChange={(e) => useImageUrl(index, e.target.value)}
                      placeholder="https://example.com/image.jpg 或 /path/to/image.jpg"
                      className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                      disabled={isUploading || saving || publishing}
                    />
                  </div>

                  {isUploading && (
                    <div className="mt-2 text-xs text-black/60">上传中...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 背景编辑 */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-black">页面背景</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-black/70">背景类型</label>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() =>
                    handleBackgroundChange("color", config.background.value)
                  }
                  className={`rounded-lg px-4 py-2 text-sm ${
                    config.background.type === "color"
                      ? "bg-black text-white"
                      : "bg-white/70 text-black"
                  }`}
                >
                  颜色
                </button>
                <button
                  onClick={() =>
                    handleBackgroundChange("image", config.background.value)
                  }
                  className={`rounded-lg px-4 py-2 text-sm ${
                    config.background.type === "image"
                      ? "bg-black text-white"
                      : "bg-white/70 text-black"
                  }`}
                >
                  图片
                </button>
              </div>
            </div>

            {config.background.type === "color" ? (
              <div>
                <label className="text-sm text-black/70">背景颜色</label>
                <input
                  type="color"
                  value={config.background.value}
                  onChange={(e) =>
                    handleBackgroundChange("color", e.target.value)
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-black/10"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm text-black/70">图片 URL</label>
                <input
                  type="text"
                  value={config.background.value}
                  onChange={(e) =>
                    handleBackgroundChange("image", e.target.value)
                  }
                  placeholder="/path/to/image.jpg 或 https://example.com/image.jpg"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-4 py-2 text-sm text-black"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-xs text-black/60">
          说明：编辑配置后点击"保存草稿"保存到草稿，点击"发布"后才会在公开页面显示。
        </div>
      </div>
    </main>
  );
}
