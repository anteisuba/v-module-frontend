// app/admin/cms/page.tsx
"use client";

import { Suspense, useState, type CSSProperties } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  BackButton,
  HeroSectionEditor,
  NewsSectionEditor,
  VideoSectionEditor,
  PageBackgroundEditor,
  NewsArticleEditor,
  Alert,
  CMSHeader,
  LoadingState,
  SaveStatus,
  ConfirmDialog,
  LanguageSelector,
  ColorPicker,
  AdminEditorCard,
} from "@/components/ui";
import SectionArchitectCard from "@/components/ui/SectionArchitectCard";
import MenuSectionEditor from "@/components/ui/MenuSectionEditor";
import { SectionLayoutControl } from "@/components/ui/SectionLayoutControl";
import { pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useI18n } from "@/lib/i18n/context";
import type { SectionConfig, SectionType, PageConfig } from "@/domain/page-config/types";

// ────────────────────────────────────────────────────────────────────
// Composer Target 状态类型
// ────────────────────────────────────────────────────────────────────
type GlobalPanelId = "background" | "theme" | "articles";

type ComposerTarget =
  | { kind: "global"; panelId: GlobalPanelId }
  | { kind: "section"; sectionId: string };

// ────────────────────────────────────────────────────────────────────
// 全局面板标题 / 描述
// ────────────────────────────────────────────────────────────────────
const GLOBAL_PANEL_META: Record<
  GlobalPanelId,
  { emoji: string; labelKey: string; descriptionKey: string }
> = {
  background: {
    emoji: "🎨",
    labelKey: "cms.globalPanels.background.label",
    descriptionKey: "cms.globalPanels.background.description",
  },
  theme: {
    emoji: "🎨",
    labelKey: "cms.globalPanels.theme.label",
    descriptionKey: "cms.globalPanels.theme.description",
  },
  articles: {
    emoji: "📝",
    labelKey: "cms.globalPanels.articles.label",
    descriptionKey: "cms.globalPanels.articles.description",
  },
};

// ────────────────────────────────────────────────────────────────────
// 所有标准 section 类型（始终显示，无论 config 里是否有）
// ────────────────────────────────────────────────────────────────────
const CANONICAL_SECTION_TYPES: SectionType[] = [
  "hero",
  "video",
  "news",
  "menu",
];

/** 为某个 type 创建一个带默认 props 的 section */
function createDefaultSection(type: SectionType, order: number): SectionConfig {
  switch (type) {
    case "hero":
      return {
        id: `hero-${Date.now()}`,
        type: "hero",
        props: { slides: [], title: "", subtitle: "" },
        enabled: true,
        order,
      };
    case "video":
      return {
        id: `video-${Date.now()}`,
        type: "video",
        props: { items: [] },
        enabled: true,
        order,
      };
    case "news":
      return {
        id: `news-${Date.now()}`,
        type: "news",
        props: { items: [] },
        enabled: true,
        order,
      };
    case "menu":
      return {
        id: `menu-${Date.now()}`,
        type: "menu",
        props: {},
        enabled: true,
        order,
      };
    case "gallery":
      return {
        id: `gallery-${Date.now()}`,
        type: "gallery",
        props: { items: [] },
        enabled: true,
        order,
      };
  }
}

// ────────────────────────────────────────────────────────────────────
// 辅助：reorder sections
// ────────────────────────────────────────────────────────────────────
function moveSectionInConfig(
  config: PageConfig,
  sectionId: string,
  dir: "up" | "down"
): PageConfig {
  const sorted = [...config.sections].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === sectionId);
  if (idx < 0) return config;
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= sorted.length) return config;
  // swap orders
  const aOrder = sorted[idx].order;
  const bOrder = sorted[target].order;
  const newSections = config.sections.map((s) => {
    if (s.id === sorted[idx].id) return { ...s, order: bOrder };
    if (s.id === sorted[target].id) return { ...s, order: aOrder };
    return s;
  });
  return { ...config, sections: newSections };
}

// ────────────────────────────────────────────────────────────────────
// Composer：右侧编辑器面板
// ────────────────────────────────────────────────────────────────────
function ComposerContent({
  target,
  config,
  setConfig,
  themeColor,
  setThemeColor,
  saving,
  publishing,
  showToast,
  handleError,
  uploadingIndex,
  setUploadingIndex,
}: {
  target: ComposerTarget | null;
  config: PageConfig;
  setConfig: (c: PageConfig) => void;
  themeColor: string;
  setThemeColor: (c: string) => void;
  saving: boolean;
  publishing: boolean;
  showToast: (msg: string) => void;
  handleError: (msg: string) => void;
  uploadingIndex: number | null;
  setUploadingIndex: (i: number | null) => void;
}) {
  const { t } = useI18n();
  const disabled = saving || publishing;

  if (!target) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <div className="text-3xl opacity-30">←</div>
        <p className="text-sm text-[color:var(--editorial-muted)]">
          {t("cms.architect.emptyComposer")}
        </p>
      </div>
    );
  }

  // ── 全局设置 ──────────────────────────────────────────────────────
  if (target.kind === "global") {
    if (target.panelId === "background") {
      return (
        <PageBackgroundEditor
          config={config}
          onConfigChange={setConfig}
          disabled={disabled}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
          onToast={showToast}
          onError={handleError}
        />
      );
    }

    if (target.panelId === "theme") {
      return (
        <AdminEditorCard className="rounded-3xl border-black/5 bg-white/70 p-5 shadow-sm">
          <div className="space-y-4">
            <ColorPicker
              label={t("cms.themeSettings.themeColor")}
              value={themeColor}
              onChange={setThemeColor}
              helpText={t("cms.themeSettings.themeColorHelp")}
              disabled={disabled}
            />
            <div className="space-y-2">
              <label className="block text-xs font-medium text-black">
                {t("cms.themeSettings.preview")}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn-themed rounded-lg px-4 py-2 text-sm font-medium"
                  style={
                    {
                      "--theme-primary": themeColor,
                      "--theme-primary-foreground": "#ffffff",
                    } as CSSProperties
                  }
                  disabled
                >
                  {t("cms.themeSettings.previewButton")}
                </button>
                <span className="text-sm underline" style={{ color: themeColor }}>
                  {t("cms.themeSettings.previewLink")}
                </span>
              </div>
            </div>
          </div>
        </AdminEditorCard>
      );
    }

    if (target.panelId === "articles") {
      return (
        <NewsArticleEditor
          disabled={disabled}
          onToast={showToast}
          onError={handleError}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
          newsBackground={
            config.newsBackground || { type: "color", value: "#000000" }
          }
          onNewsBackgroundChange={(background) =>
            setConfig({ ...config, newsBackground: background })
          }
        />
      );
    }
  }

  // ── Section 编辑器 ─────────────────────────────────────────────────
  if (target.kind === "section") {
    const section = config.sections.find((s) => s.id === target.sectionId);
    if (!section) {
      return (
        <div className="py-8 text-center text-sm text-[color:var(--editorial-muted)]">
          {t("cms.architect.sectionNotFound")}
        </div>
      );
    }

    if (section.type === "hero") {
      const colSpan = (section.layout?.colSpan ?? 4) as 1 | 2 | 3 | 4;
      return (
        <div className="space-y-4">
          <SectionLayoutControl
            value={colSpan}
            onChange={(val) =>
              setConfig({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === section.id ? { ...s, layout: { ...s.layout, colSpan: val } } : s
                ),
              })
            }
          />
          <HeroSectionEditor
            config={config}
            onConfigChange={setConfig}
            disabled={disabled}
            onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
            uploadingIndex={uploadingIndex}
            onToast={showToast}
            onError={handleError}
          />
        </div>
      );
    }

    if (section.type === "video") {
      const colSpan = (section.layout?.colSpan ?? 4) as 1 | 2 | 3 | 4;
      return (
        <div className="space-y-4">
          <SectionLayoutControl
            value={colSpan}
            onChange={(val) =>
              setConfig({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === section.id ? { ...s, layout: { ...s.layout, colSpan: val } } : s
                ),
              })
            }
          />
          <VideoSectionEditor
            config={config}
            onConfigChange={setConfig}
            disabled={disabled}
            onToast={showToast}
            onError={handleError}
          />
        </div>
      );
    }

    if (section.type === "news") {
      const colSpan = (section.layout?.colSpan ?? 4) as 1 | 2 | 3 | 4;
      return (
        <div className="space-y-4">
          <SectionLayoutControl
            value={colSpan}
            onChange={(val) =>
              setConfig({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === section.id ? { ...s, layout: { ...s.layout, colSpan: val } } : s
                ),
              })
            }
          />
          <NewsSectionEditor
            config={config}
            onConfigChange={setConfig}
            disabled={disabled}
            onUploadImage={async (file, options) => {
              setUploadingIndex(-1);
              try {
                return await pageApi.uploadImage(file, options);
              } finally {
                setUploadingIndex(null);
              }
            }}
            uploadingIndex={uploadingIndex === -1 ? -1 : null}
            onToast={showToast}
            onError={handleError}
          />
        </div>
      );
    }

    if (section.type === "menu") {
      return (
        <MenuSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={disabled}
          onToast={showToast}
          onError={handleError}
        />
      );
    }
  }

  return null;
}

// ────────────────────────────────────────────────────────────────────
// Composer 标题栏
// ────────────────────────────────────────────────────────────────────
function ComposerHeader({
  target,
  config,
}: {
  target: ComposerTarget | null;
  config: PageConfig;
}) {
  const { t } = useI18n();
  if (!target) return null;

  let emoji = "";
  let label = "";

  if (target.kind === "global") {
    const meta = GLOBAL_PANEL_META[target.panelId];
    emoji = meta.emoji;
    label = t(meta.labelKey);
  } else {
    const section = config.sections.find((s) => s.id === target.sectionId);
    if (!section) return null;
    const metaMap: Record<string, { emoji: string; labelKey: string }> = {
      hero:    { emoji: "🖼️", labelKey: "sectionMeta.hero"    },
      video:   { emoji: "🎬", labelKey: "sectionMeta.video"   },
      news:    { emoji: "📰", labelKey: "sectionMeta.news"    },
      menu:    { emoji: "☰",  labelKey: "sectionMeta.menu"    },
      gallery: { emoji: "🖼️", labelKey: "sectionMeta.gallery" },
    };
    const meta = metaMap[section.type] ?? { emoji: "⚙️", labelKey: "" };
    emoji = meta.emoji;
    label = meta.labelKey ? t(meta.labelKey) : section.type;
  }

  return (
    <div className="mb-5 flex items-center gap-2 border-b border-[color:var(--editorial-border)] pb-4">
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="font-serif text-lg leading-none text-[color:var(--editorial-text)]">
        {label}
      </h2>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]">
        {t("cms.architect.composerSuffix")}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 主页面内容
// ────────────────────────────────────────────────────────────────────
function CMSPageContent() {
  const { user } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const {
    config,
    setConfig,
    themeColor,
    setThemeColor,
    fontFamily,
    loading,
    hasUnsavedChanges,
    markAsSaved,
  } = usePageConfig();
  const { saving, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
    themeColor,
    fontFamily,
    onError: handleError,
    onToast: (msg) => {
      const translatedMsg = msg.startsWith("cms.") ? t(msg) : msg;
      showToast(translatedMsg);
    },
  });

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [composerTarget, setComposerTarget] = useState<ComposerTarget | null>(
    null
  );

  // 键盘快捷键
  useKeyboardShortcuts({
    onSave: async () => {
      if (!saving && !publishing) await handleSaveDraft();
    },
    onPublish: () => {
      if (!saving && !publishing) setShowPublishConfirm(true);
    },
    enabled: !saving && !publishing,
  });

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      markAsSaved();
      setLastSaved(new Date());
    } catch {
      // error handled by handleError
    }
  };

  const handlePublish = async () => {
    try {
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch {
      // error handled by handleError
    }
  };

  // ── 拖拽排序 sensors（必须在所有 early return 之前声明）──────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState type="spinner" size="lg" message={t("common.loading")} />
        </div>
      </main>
    );
  }

  // ── 已排序的 sections ─────────────────────────────────────────────
  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order);
  const disabled = saving || publishing;

  // ── 切换 section 启用状态 ─────────────────────────────────────────
  function toggleSectionEnabled(sectionId: string) {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  }

  // ── 更新 section colSpan ─────────────────────────────────────────
  function updateSectionColSpan(sectionId: string, colSpan: 1 | 2 | 3 | 4) {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, layout: { ...s.layout, colSpan } } : s
      ),
    });
  }

  // ── 拖拽排序 section ─────────────────────────────────────────────
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
    const newIndex = sortedSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedSections, oldIndex, newIndex);
    setConfig({
      ...config,
      sections: config.sections.map((s) => {
        const newOrder = reordered.findIndex((r) => r.id === s.id);
        return newOrder !== -1 ? { ...s, order: newOrder } : s;
      }),
    });
  }

  // ── 添加 section（通用） ───────────────────────────────────────────
  function addSection(type: SectionType) {
    const maxOrder = config.sections.reduce(
      (max, s) => Math.max(max, s.order),
      -1
    );
    const newSection = createDefaultSection(type, maxOrder + 1);
    const newConfig = { ...config, sections: [...config.sections, newSection] };
    setConfig(newConfig);
    setComposerTarget({ kind: "section", sectionId: newSection.id });
  }

  // ── 选择全局面板 ─────────────────────────────────────────────────
  function selectGlobal(panelId: GlobalPanelId) {
    setComposerTarget({ kind: "global", panelId });
  }

  // ── 选择 section ─────────────────────────────────────────────────
  function selectSection(sectionId: string) {
    setComposerTarget(
      composerTarget?.kind === "section" &&
        composerTarget.sectionId === sectionId
        ? null // 再点一次取消
        : { kind: "section", sectionId }
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 背景图 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        {/* 顶部：返回 + 语言切换 */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton
            href="/admin/dashboard"
            label={t("common.back")}
            className="!relative !top-0 !left-0"
          />
          <LanguageSelector position="inline" menuPosition="bottom" />
        </div>

        {/* 页头 */}
        <CMSHeader
          userSlug={user?.slug || null}
          onSaveDraft={handleSaveDraft}
          onPublish={() => setShowPublishConfirm(true)}
          saving={saving}
          publishing={publishing}
          disabled={disabled}
        />

        {/* 保存状态 */}
        <SaveStatus
          saving={saving}
          publishing={publishing}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          className="mb-4"
        />

        {/* 错误 / 成功提示 */}
        {error && <Alert type="error" message={error} onClose={clearError} />}
        {toastMessage && <Alert type="success" message={toastMessage} />}

        {/* ─── 双栏主体 ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">

          {/* ══ 左栏：Architect ══════════════════════════════════════ */}
          <div className="space-y-3">

            {/* 标题 */}
            <div className="px-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--editorial-muted)]">
                {t("cms.architect.title")}
              </div>
            </div>

            {/* ── 全局设置组 ─────────────────────────────────────── */}
            <div className="space-y-2">
              <div className="px-1 text-[9px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]/60">
                {t("cms.architect.global")}
              </div>

              {(["background", "theme", "articles"] as GlobalPanelId[]).map(
                (panelId) => {
                  const meta = GLOBAL_PANEL_META[panelId];
                  const isActive =
                    composerTarget?.kind === "global" &&
                    composerTarget.panelId === panelId;
                  return (
                    <button
                      key={panelId}
                      type="button"
                      onClick={() => selectGlobal(panelId)}
                      className={[
                        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                        isActive
                          ? "border-[color:var(--editorial-accent)] bg-[color:var(--editorial-accent)] shadow-md"
                          : "border-[color:var(--editorial-border)] bg-[color:color-mix(in_srgb,var(--editorial-surface)_80%,transparent)] hover:border-[color:var(--editorial-accent)]/40",
                      ].join(" ")}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {meta.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={[
                            "text-sm font-medium leading-none",
                            isActive
                              ? "text-[color:var(--editorial-accent-foreground)]"
                              : "text-[color:var(--editorial-text)]",
                          ].join(" ")}
                        >
                          {t(meta.labelKey)}
                        </div>
                        <div
                          className={[
                            "mt-1.5 text-[10px] uppercase tracking-[0.16em]",
                            isActive
                              ? "text-[color:color-mix(in_srgb,var(--editorial-accent-foreground)_60%,transparent)]"
                              : "text-[color:var(--editorial-muted)]",
                          ].join(" ")}
                        >
                          {t(meta.descriptionKey)}
                        </div>
                      </div>
                      <span
                        className={[
                          "text-[10px]",
                          isActive
                            ? "text-[color:color-mix(in_srgb,var(--editorial-accent-foreground)_50%,transparent)]"
                            : "text-[color:var(--editorial-muted)]",
                        ].join(" ")}
                      >
                        →
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* ── Sections ────────────────────────────────────────── */}
            <div className="space-y-2 pt-2">
              <div className="px-1 text-[9px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]/60">
                {t("cms.architect.sections")}
              </div>

              {/* 已配置的 section — 可拖拽排序 */}
              {sortedSections.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedSections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sortedSections.map((section) => (
                        <SectionArchitectCard
                          key={section.id}
                          id={section.id}
                          section={section}
                          isSelected={
                            composerTarget?.kind === "section" &&
                            composerTarget.sectionId === section.id
                          }
                          disabled={disabled}
                          onSelect={() => selectSection(section.id)}
                          onToggleEnabled={() =>
                            toggleSectionEnabled(section.id)
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* 未配置的 section — 占位按钮（点击添加） */}
              {CANONICAL_SECTION_TYPES.filter(
                (type) => !sortedSections.find((s) => s.type === type)
              ).map((sectionType) => {
                const EMOJI_MAP: Record<SectionType, string> = {
                  hero: "🖼️",
                  video: "🎬",
                  news: "📰",
                  gallery: "🖼️",
                  menu: "☰",
                };
                return (
                  <button
                    key={sectionType}
                    type="button"
                    onClick={() => addSection(sectionType)}
                    disabled={disabled}
                    className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[color:var(--editorial-border)] px-4 py-3 text-left opacity-50 transition hover:opacity-100 hover:border-[color:var(--editorial-accent)]/50 disabled:cursor-not-allowed"
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {EMOJI_MAP[sectionType]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-none text-[color:var(--editorial-text)]">
                        {t(`sectionMeta.${sectionType}`)}
                      </div>
                      <div className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]">
                        {t("cms.architect.notConfigured")}
                      </div>
                    </div>
                    <span className="text-[10px] text-[color:var(--editorial-muted)]">+</span>
                  </button>
                );
              })}
            </div>

            {/* 底部提示 */}
            <div className="px-1 pt-2 text-[9px] text-[color:var(--editorial-muted)] text-center">
              {t("cms.instruction")}
            </div>
          </div>

          {/* ══ 右栏：Composer ════════════════════════════════════════ */}
          <div>
            <AdminEditorCard className="min-h-[500px] overflow-hidden rounded-3xl p-6">
              <ComposerHeader target={composerTarget} config={config} />
              <ComposerContent
                target={composerTarget}
                config={config}
                setConfig={setConfig}
                themeColor={themeColor}
                setThemeColor={setThemeColor}
                saving={saving}
                publishing={publishing}
                showToast={showToast}
                handleError={handleError}
                uploadingIndex={uploadingIndex}
                setUploadingIndex={setUploadingIndex}
              />
            </AdminEditorCard>
          </div>
        </div>

        {/* 发布确认 */}
        <ConfirmDialog
          open={showPublishConfirm}
          title={t("cms.publishConfirm.title") || "确认发布"}
          message={
            t("cms.publishConfirm.message") ||
            "确定要发布页面吗？发布后将对所有访客可见。"
          }
          confirmLabel={t("cms.publishConfirm.confirm") || "确定发布"}
          cancelLabel={t("common.cancel")}
          onConfirm={handlePublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────────────
// 导出
// ────────────────────────────────────────────────────────────────────
export default function CMSPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState message="加载中..." />
        </div>
      }
    >
      <CMSPageContent />
    </Suspense>
  );
}
