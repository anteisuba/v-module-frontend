// app/admin/cms/page.tsx

"use client";

import { useEffect, useState, Suspense, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
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
  AdminEditorAccordion,
  AdminEditorCard,
  AdminEditorTabs,
} from "@/components/ui";
import { pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useI18n } from "@/lib/i18n/context";
import type { AdminEditorPanelItem, AdminEditorTabOption } from "@/components/ui";

type CMSTabId = "page" | "content";

const CMS_PANEL_TO_TAB: Record<string, CMSTabId> = {
  hero: "page",
  background: "page",
  theme: "page",
  video: "content",
  news: "content",
  articles: "content",
};

function CMSPageContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const { config, setConfig, themeColor, setThemeColor, fontFamily, loading, hasUnsavedChanges, markAsSaved } = usePageConfig();
  const { saving, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
    themeColor,
    fontFamily,
    onError: handleError,
    onToast: (msg) => {
      // 如果消息是翻译 key，则翻译它
      const translatedMsg = msg.startsWith("cms.") ? t(msg) : msg;
      showToast(translatedMsg);
    },
  });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<CMSTabId>("page");
  const [openPanelByTab, setOpenPanelByTab] = useState<
    Record<CMSTabId, string | null>
  >({
    page: "hero",
    content: "video",
  });
  const requestedTab = searchParams.get("tab");
  const requestedPanel = searchParams.get("panel");
  const focusTarget = searchParams.get("focus");
  const initialArticleId = searchParams.get("articleId");

  useEffect(() => {
    const nextPanel =
      requestedPanel && requestedPanel in CMS_PANEL_TO_TAB ? requestedPanel : null;
    const nextTab =
      requestedTab === "page" || requestedTab === "content"
        ? requestedTab
        : nextPanel
          ? CMS_PANEL_TO_TAB[nextPanel]
          : null;

    if (nextTab) {
      setActiveTab(nextTab);
    }

    if (nextTab && nextPanel) {
      setOpenPanelByTab((prev) => ({
        ...prev,
        [nextTab]: nextPanel,
      }));
    }
  }, [requestedPanel, requestedTab]);

  // 键盘快捷键支持
  useKeyboardShortcuts({
    onSave: async () => {
      if (!saving && !publishing) {
        await handleSaveDraft();
      }
    },
    onPublish: () => {
      if (!saving && !publishing) {
        setShowPublishConfirm(true);
      }
    },
    enabled: !saving && !publishing,
  });

  // 保存草稿处理
  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      markAsSaved();
      setLastSaved(new Date());
    } catch {
      // 错误已由 handleError 处理
    }
  };

  // 发布处理
  const handlePublish = async () => {
    try {
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch {
      // 错误已由 handleError 处理
    }
  };

  // 注意：isDefaultConfig 和 cleanConfig 已移至 utils/pageConfig.ts
  // 注意：loadConfig, cleanConfig, saveDraft, publish 已移至 hooks

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState type="spinner" size="lg" message={t("common.loading")} />
        </div>
      </main>
    );
  }

  const togglePanel = (tabId: CMSTabId, panelId: string) => {
    setOpenPanelByTab((prev) => ({
      ...prev,
      [tabId]: prev[tabId] === panelId ? null : panelId,
    }));
  };

  const tabOptions: AdminEditorTabOption[] = [
    {
      id: "page",
      title: t("cms.tabs.page.title"),
      description: t("cms.tabs.page.description"),
    },
    {
      id: "content",
      title: t("cms.tabs.content.title"),
      description: t("cms.tabs.content.description"),
    },
  ];

  const pagePanels: AdminEditorPanelItem[] = [
    {
      id: "hero",
      title: t("heroEditor.title"),
      description: t("cms.panels.hero.description"),
      content: (
        <HeroSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
          uploadingIndex={uploadingIndex}
          onToast={showToast}
          onError={handleError}
          focusTarget={focusTarget}
        />
      ),
    },
    {
      id: "background",
      title: t("pageBackgroundEditor.title"),
      description: t("cms.panels.background.description"),
      content: (
        <PageBackgroundEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
          onToast={showToast}
          onError={handleError}
          focusTarget={focusTarget}
        />
      ),
    },
    {
      id: "theme",
      title: t("cms.themeSettings.title"),
      description: t("cms.panels.theme.description"),
      content: (
        <AdminEditorCard className="rounded-3xl border-black/5 bg-white/70 p-5 shadow-sm">
          <div className="space-y-4">
            <ColorPicker
              label={t("cms.themeSettings.themeColor")}
              value={themeColor}
              onChange={setThemeColor}
              helpText={t("cms.themeSettings.themeColorHelp")}
              disabled={saving || publishing}
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
                <span
                  className="text-sm underline"
                  style={{ color: themeColor }}
                >
                  {t("cms.themeSettings.previewLink")}
                </span>
              </div>
            </div>
          </div>
        </AdminEditorCard>
      ),
    },
  ];

  const contentPanels: AdminEditorPanelItem[] = [
    {
      id: "video",
      title: t("videoSectionEditor.title"),
      description: t("cms.panels.video.description"),
      content: (
        <VideoSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onToast={showToast}
          onError={handleError}
        />
      ),
    },
    {
      id: "news",
      title: t("newsSectionEditor.title"),
      description: t("cms.panels.news.description"),
      content: (
        <NewsSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
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
          focusTarget={focusTarget}
        />
      ),
    },
    {
      id: "articles",
      title: t("newsArticleEditor.title"),
      description: t("cms.panels.articles.description"),
      content: (
        <NewsArticleEditor
          disabled={saving || publishing}
          onToast={showToast}
          onError={handleError}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
          newsBackground={
            config.newsBackground || { type: "color", value: "#000000" }
          }
          onNewsBackgroundChange={(background) => {
            setConfig({
              ...config,
              newsBackground: background,
            });
          }}
          focusTarget={focusTarget}
          initialArticleId={initialArticleId}
        />
      ),
    },
  ];

  const visiblePanels = activeTab === "page" ? pagePanels : contentPanels;

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

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* 返回按钮和语言切换器 */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton 
            href="/admin/dashboard" 
            label={t("common.back")} 
            className="!relative !top-0 !left-0"
          />
          <LanguageSelector position="inline" menuPosition="bottom" />
        </div>

        {/* 头部：标题和操作按钮 */}
        <CMSHeader
          userSlug={user?.slug || null}
          onSaveDraft={handleSaveDraft}
          onPublish={() => setShowPublishConfirm(true)}
          saving={saving}
          publishing={publishing}
          disabled={saving || publishing}
        />

        {/* 保存状态显示 */}
        <SaveStatus
          saving={saving}
          publishing={publishing}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          className="mb-4"
        />

        {/* 错误和成功提示 */}
        {error && <Alert type="error" message={error} onClose={clearError} />}
        {toastMessage && <Alert type="success" message={toastMessage} />}

        <AdminEditorTabs
          tabs={tabOptions}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as CMSTabId)}
        />

        <AdminEditorAccordion
          panels={visiblePanels}
          openPanelId={openPanelByTab[activeTab]}
          onToggle={(panelId) => togglePanel(activeTab, panelId)}
        />

        <div className="mt-6 text-[10px] text-[color:var(--editorial-muted)] text-center">
          {t("cms.instruction")}
        </div>

        {/* 发布确认对话框 */}
        <ConfirmDialog
          open={showPublishConfirm}
          title={t("cms.publishConfirm.title") || "确认发布"}
          message={t("cms.publishConfirm.message") || "确定要发布页面吗？发布后将对所有访客可见。"}
          confirmLabel={t("cms.publishConfirm.confirm") || "确定发布"}
          cancelLabel={t("common.cancel")}
          onConfirm={handlePublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
      </div>
    </main>
  );
}

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
