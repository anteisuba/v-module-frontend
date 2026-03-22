// app/admin/dashboard/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useUser } from "@/lib/context/UserContext";
import { LanguageSelector, LoadingState } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { pageApi, blogApi, shopApi } from "@/lib/api";
import { getToneStyle } from "@/components/ui/StatusBadge";
import type { StatusTone } from "@/components/ui/StatusBadge";

const BG_STORAGE_KEY = "dashboard-bg";
const DEFAULT_BG: BgSettings = { color: "#f5f2ec", imageUrl: null };

/** Returns true if a hex color is perceptually light (should use dark text). */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Relative luminance approximation
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ── 类型 ──

type PageStatus = {
  isPublished: boolean;
  hasUnpublishedChanges: boolean;
  sectionCount: number;
};

type ContentStats = {
  total: number;
  published: number;
  drafts: number;
};

type CountStats = {
  total: number;
  pending: number;
};

type DashboardData = {
  page: PageStatus | null;
  blog: ContentStats | null;
  shop: ContentStats | null;
  orders: CountStats | null;
  comments: CountStats | null;
};

// ── 状态徽章 ──

function ToneBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const style = getToneStyle(tone);
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
      style={style}
    >
      {children}
    </span>
  );
}

// ── 统计数字 ──

function StatValue({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-light text-[color:var(--editorial-text)]">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
        {label}
      </div>
    </div>
  );
}

// ── Dashboard 卡片 ──

function DashboardCard({
  title,
  description,
  status,
  stats,
  primaryAction,
  secondaryActions,
  loading: cardLoading,
}: {
  title: string;
  description: string;
  status?: React.ReactNode;
  stats?: React.ReactNode;
  primaryAction: { label: string; href: string };
  secondaryActions?: Array<{ label: string; href: string; external?: boolean }>;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-[1.4rem] border border-[color:color-mix(in_srgb,var(--editorial-border)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_96%,transparent)] shadow-[0_8px_32px_rgba(17,12,6,0.06)]">
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-[color:var(--editorial-text)]">{title}</h3>
            {status}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--editorial-muted)]">
            {description}
          </p>
        </div>

        {cardLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--editorial-border)] border-t-[color:var(--editorial-accent)]" />
          </div>
        ) : (
          stats && (
            <div className="flex items-center justify-around gap-4 rounded-xl bg-[color:color-mix(in_srgb,var(--editorial-surface)_60%,transparent)] px-4 py-3">
              {stats}
            </div>
          )
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[color:color-mix(in_srgb,var(--editorial-border)_60%,transparent)] px-5 py-3 sm:px-6">
        <Link
          href={primaryAction.href}
          className="editorial-button editorial-button--primary min-h-9 px-4 py-1.5 text-[10px]"
        >
          {primaryAction.label}
        </Link>
        {secondaryActions?.map((action) =>
          action.external ? (
            <a
              key={action.href}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-button editorial-button--secondary min-h-9 px-4 py-1.5 text-[10px]"
            >
              {action.label}
            </a>
          ) : (
            <Link
              key={action.href}
              href={action.href}
              className="editorial-button editorial-button--secondary min-h-9 px-4 py-1.5 text-[10px]"
            >
              {action.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

// ── 背景控制器 ──

type BgSettings = { color: string; imageUrl: string | null };

function useBgSettings() {
  const [bg, setBgRaw] = useState<BgSettings>(DEFAULT_BG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(BG_STORAGE_KEY);
        if (stored) {
          setBgRaw(JSON.parse(stored));
        }
      } catch {
        // ignore invalid local storage values
      }
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setBg = useCallback((next: BgSettings | ((prev: BgSettings) => BgSettings)) => {
    setBgRaw((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(value));
      return value;
    });
  }, []);

  return [hydrated ? bg : DEFAULT_BG, setBg] as const;
}

function BgController({
  bg,
  onChange,
  open,
  onToggle,
}: {
  bg: BgSettings;
  onChange: (next: BgSettings) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 打开时锁定 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await pageApi.uploadImage(file, { usageContext: "PAGE_BACKGROUND" });
      onChange({ ...bg, imageUrl: result.src });
    } catch {
      // 静默忽略
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={onToggle}
        className="editorial-button editorial-button--secondary flex items-center gap-2 px-3 py-2 text-[10px]"
      >
        <span
          className="inline-block h-4 w-4 rounded-full border border-black/15 shrink-0"
          style={
            bg.imageUrl
              ? { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: "cover" }
              : { backgroundColor: bg.color }
          }
        />
        {t("admin.dashboard.bgController.label")}
      </button>

      {/* 侧栏面板 — portal 到 body 以避免 stacking context 遮盖 */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className={[
              "fixed inset-0 z-[9999] transition-opacity duration-300",
              open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
            aria-hidden={!open}
          >
            {/* 遮罩 */}
            <button
              type="button"
              aria-label="Close"
              onClick={onToggle}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* 面板 */}
            <aside
              className={[
                "absolute right-0 top-0 h-full w-[88vw] max-w-sm",
                "border-l border-[color:color-mix(in_srgb,var(--editorial-border)_30%,transparent)]",
                "bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_97%,transparent)] backdrop-blur-2xl",
                "transition-transform duration-300 ease-out",
                open ? "translate-x-0" : "translate-x-full",
              ].join(" ")}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-8 sm:px-8">
                {/* 标题栏 */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--editorial-muted)]">
                      {t("admin.dashboard.bgController.title")}
                    </div>
                    <div className="mt-4 h-px w-24 bg-[color:color-mix(in_srgb,var(--editorial-border)_50%,transparent)]" />
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onToggle}
                    className="editorial-button editorial-button--secondary px-4 py-2 text-[10px]"
                  >
                    Close
                  </button>
                </div>

                {/* 颜色选择 */}
                <div className="mt-10">
                  <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]">
                    {t("admin.dashboard.bgController.colorLabel")}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bg.color}
                      onChange={(e) => onChange({ ...bg, color: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-[color:color-mix(in_srgb,var(--editorial-border)_60%,transparent)] bg-transparent"
                    />
                    <input
                      type="text"
                      value={bg.color}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange({ ...bg, color: v });
                      }}
                      className="flex-1 rounded-lg border border-[color:color-mix(in_srgb,var(--editorial-border)_60%,transparent)] bg-transparent px-3 py-2 text-sm text-[color:var(--editorial-text)] uppercase tracking-wider"
                      maxLength={7}
                    />
                  </div>
                  {/* 预设色板 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["#f5f2ec", "#ffffff", "#1a1a1a", "#0f172a", "#fef3c7", "#ecfdf5", "#f0f4ff", "#fdf2f8"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChange({ ...bg, color: c })}
                        className={[
                          "h-8 w-8 rounded-full border-2 transition-colors",
                          bg.color === c
                            ? "border-[color:var(--editorial-accent)]"
                            : "border-[color:color-mix(in_srgb,var(--editorial-border)_50%,transparent)] hover:border-[color:var(--editorial-muted)]",
                        ].join(" ")}
                        style={{ backgroundColor: c }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>

                {/* 背景图片 */}
                <div className="mt-10">
                  <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]">
                    {t("admin.dashboard.bgController.image")}
                  </div>

                  {bg.imageUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--editorial-border)_60%,transparent)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bg.imageUrl}
                        alt="Background preview"
                        className="h-40 w-full object-cover"
                      />
                      <div className="flex gap-2 p-3">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="editorial-button editorial-button--secondary flex-1 min-h-9 px-3 py-1.5 text-[10px]"
                        >
                          {uploading ? (
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            t("admin.dashboard.bgController.replace")
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange({ ...bg, imageUrl: null })}
                          className="editorial-button editorial-button--secondary min-h-9 px-3 py-1.5 text-[10px]"
                        >
                          {t("admin.dashboard.bgController.remove")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color:color-mix(in_srgb,var(--editorial-border)_70%,transparent)] px-6 py-10 text-[color:var(--editorial-muted)] transition-colors hover:border-[color:var(--editorial-accent)] hover:text-[color:var(--editorial-text)]"
                    >
                      {uploading ? (
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                          <span className="text-xs">{t("admin.dashboard.bgController.addImage")}</span>
                        </>
                      )}
                    </button>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* 重置按钮 - 底部 */}
                <div className="mt-auto pt-10">
                  <button
                    type="button"
                    onClick={() => onChange(DEFAULT_BG)}
                    className="editorial-button editorial-button--secondary w-full min-h-11 px-4 py-2.5 text-[10px]"
                  >
                    {t("admin.dashboard.bgController.reset")}
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}

// ── 主页面 ──

export default function DashboardPage() {
  const { user, loading: userLoading, logout } = useUser();
  const { t } = useI18n();
  const [bg, setBg] = useBgSettings();
  const [bgPanelOpen, setBgPanelOpen] = useState(false);
  const [data, setData] = useState<DashboardData>({
    page: null,
    blog: null,
    shop: null,
    orders: null,
    comments: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    // 并行请求所有数据
    const [pageResult, blogPublished, blogDrafts, shopPublished, shopDrafts, ordersAll, ordersPending, commentsResult] =
      await Promise.allSettled([
        pageApi.getFullPageData(),
        blogApi.getPosts({ limit: 1, published: true }),
        blogApi.getPosts({ limit: 1, published: false }),
        shopApi.getProducts({ limit: 1, status: "PUBLISHED" }),
        shopApi.getProducts({ limit: 1, status: "DRAFT" }),
        shopApi.getOrders({ limit: 1 }),
        shopApi.getOrders({ limit: 1, status: "PENDING" }),
        blogApi.getModerationComments({ limit: 1 }),
      ]);

    return {
      page:
        pageResult.status === "fulfilled"
          ? {
              isPublished: pageResult.value.pageStatus?.isPublished ?? false,
              hasUnpublishedChanges: pageResult.value.pageStatus?.hasUnpublishedChanges ?? false,
              sectionCount: pageResult.value.draftConfig?.sections?.length ?? 0,
            }
          : null,
      blog:
        blogPublished.status === "fulfilled" && blogDrafts.status === "fulfilled"
          ? {
              published: blogPublished.value.pagination.total,
              drafts: blogDrafts.value.pagination.total,
              total:
                blogPublished.value.pagination.total +
                blogDrafts.value.pagination.total,
            }
          : null,
      shop:
        shopPublished.status === "fulfilled" && shopDrafts.status === "fulfilled"
          ? {
              published: shopPublished.value.pagination.total,
              drafts: shopDrafts.value.pagination.total,
              total:
                shopPublished.value.pagination.total +
                shopDrafts.value.pagination.total,
            }
          : null,
      orders:
        ordersAll.status === "fulfilled" && ordersPending.status === "fulfilled"
          ? {
              total: ordersAll.value.pagination.total,
              pending: ordersPending.value.pagination.total,
            }
          : null,
      comments:
        commentsResult.status === "fulfilled"
          ? {
              total: commentsResult.value.summary.total,
              pending: commentsResult.value.summary.pending,
            }
          : null,
    } satisfies DashboardData;
  }, []);

  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    let cancelled = false;

    async function loadStats() {
      const nextData = await fetchStats();
      if (cancelled) {
        return;
      }
      setData(nextData);
      setStatsLoading(false);
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [userLoading, user, fetchStats]);

  if (userLoading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  // 页面配置状态徽章
  function renderPageStatus() {
    if (!data.page) return null;
    if (data.page.hasUnpublishedChanges) {
      return <ToneBadge tone="warning">{t("admin.dashboard.status.unpublished")}</ToneBadge>;
    }
    if (data.page.isPublished) {
      return <ToneBadge tone="success">{t("admin.dashboard.status.published")}</ToneBadge>;
    }
    return <ToneBadge tone="neutral">{t("admin.dashboard.status.draft")}</ToneBadge>;
  }

  const lightBg = isLightColor(bg.color);

  return (
    <main className={`relative min-h-screen w-full overflow-hidden ${lightBg ? "editorial-shell--light" : ""}`}>
      {/* 背景 */}
      <div className="absolute inset-0" style={{ backgroundColor: bg.color }}>
        {bg.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg.imageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/6 via-transparent to-black/10" />
      </div>

      {/* 顶栏 */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <button
          onClick={() => logout()}
          className="editorial-button editorial-button--secondary px-4 py-2 text-[10px]"
        >
          {t("admin.dashboard.logout")}
        </button>
        <div className="flex items-center gap-3">
          <BgController bg={bg} onChange={setBg} open={bgPanelOpen} onToggle={() => setBgPanelOpen((v) => !v)} />
          <LanguageSelector position="inline" menuPosition="bottom" variant="light" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-12 pt-6">
        {/* 头部 */}
        <header className="mb-8">
          <div className="editorial-kicker">{t("admin.dashboard.eyebrow")}</div>
          <h1 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.6rem)] font-light leading-[1.15] tracking-[0.02em] text-[color:var(--editorial-text)]">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-3 text-sm text-[color:var(--editorial-muted)]">
            {t("admin.dashboard.welcome").replace(
              "{name}",
              user?.displayName || user?.email || t("admin.dashboard.user")
            )}
          </p>
        </header>

        {/* 卡片网格 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* 页面配置 */}
          <DashboardCard
            title={t("admin.dashboard.pages.cms.label")}
            description={t("admin.dashboard.pages.cms.description")}
            status={renderPageStatus()}
            loading={statsLoading}
            stats={
              data.page ? (
                <StatValue
                  value={data.page.sectionCount}
                  label={t("admin.dashboard.stats.sections")}
                />
              ) : null
            }
            primaryAction={{
              label: t("admin.dashboard.actions.editPage"),
              href: "/admin/cms",
            }}
            secondaryActions={[
              ...(user?.slug
                ? [
                    {
                      label: t("admin.dashboard.actions.preview"),
                      href: `/u/${user.slug}`,
                      external: true,
                    },
                  ]
                : []),
            ]}
          />

          {/* 博客 */}
          <DashboardCard
            title={t("admin.dashboard.pages.blog.label")}
            description={t("admin.dashboard.pages.blog.description")}
            loading={statsLoading}
            stats={
              data.blog ? (
                <>
                  <StatValue
                    value={data.blog.published}
                    label={t("admin.dashboard.stats.published")}
                  />
                  <StatValue
                    value={data.blog.drafts}
                    label={t("admin.dashboard.stats.drafts")}
                  />
                </>
              ) : null
            }
            primaryAction={{
              label: t("admin.dashboard.actions.manageBlog"),
              href: "/admin/blog",
            }}
            secondaryActions={
              user?.slug
                ? [
                    {
                      label: t("admin.dashboard.actions.viewBlog"),
                      href: `/u/${user.slug}/blog`,
                      external: true,
                    },
                  ]
                : undefined
            }
          />

          {/* 商店 */}
          <DashboardCard
            title={t("admin.dashboard.pages.shop.label")}
            description={t("admin.dashboard.pages.shop.description")}
            loading={statsLoading}
            stats={
              data.shop ? (
                <>
                  <StatValue
                    value={data.shop.published}
                    label={t("admin.dashboard.stats.published")}
                  />
                  <StatValue
                    value={data.shop.drafts}
                    label={t("admin.dashboard.stats.drafts")}
                  />
                </>
              ) : null
            }
            primaryAction={{
              label: t("admin.dashboard.actions.manageShop"),
              href: "/admin/shop",
            }}
            secondaryActions={
              user?.slug
                ? [
                    {
                      label: t("admin.dashboard.actions.viewShop"),
                      href: `/u/${user.slug}/shop`,
                      external: true,
                    },
                  ]
                : undefined
            }
          />

          {/* 订单 */}
          <DashboardCard
            title={t("admin.dashboard.pages.orders.label")}
            description={t("admin.dashboard.pages.orders.description")}
            loading={statsLoading}
            status={
              data.orders && data.orders.pending > 0 ? (
                <ToneBadge tone="warning">
                  {data.orders.pending} {t("admin.dashboard.stats.pending")}
                </ToneBadge>
              ) : undefined
            }
            stats={
              data.orders ? (
                <>
                  <StatValue
                    value={data.orders.total}
                    label={t("admin.dashboard.stats.totalOrders")}
                  />
                  <StatValue
                    value={data.orders.pending}
                    label={t("admin.dashboard.stats.pending")}
                  />
                </>
              ) : null
            }
            primaryAction={{
              label: t("admin.dashboard.actions.viewOrders"),
              href: "/admin/orders",
            }}
          />

          {/* 评论 */}
          <DashboardCard
            title={t("admin.dashboard.pages.comments.label")}
            description={t("admin.dashboard.pages.comments.description")}
            loading={statsLoading}
            status={
              data.comments && data.comments.pending > 0 ? (
                <ToneBadge tone="warning">
                  {data.comments.pending} {t("admin.dashboard.stats.pending")}
                </ToneBadge>
              ) : undefined
            }
            stats={
              data.comments ? (
                <>
                  <StatValue
                    value={data.comments.total}
                    label={t("admin.dashboard.stats.totalComments")}
                  />
                  <StatValue
                    value={data.comments.pending}
                    label={t("admin.dashboard.stats.pendingReview")}
                  />
                </>
              ) : null
            }
            primaryAction={{
              label: t("admin.dashboard.actions.moderate"),
              href: "/admin/comments",
            }}
          />

          {/* 媒体库 */}
          <DashboardCard
            title={t("admin.dashboard.pages.media.label")}
            description={t("admin.dashboard.pages.media.description")}
            primaryAction={{
              label: t("admin.dashboard.actions.openMedia"),
              href: "/admin/media",
            }}
          />

          {/* 收款设置 */}
          <DashboardCard
            title={t("admin.dashboard.pages.payouts.label")}
            description={t("admin.dashboard.pages.payouts.description")}
            primaryAction={{
              label: t("admin.dashboard.actions.payoutSettings"),
              href: "/admin/settings/payouts",
            }}
          />
        </div>

        {/* 公开页快捷链接 */}
        {user?.slug && (
          <div className="mt-8 text-center">
            <a
              href={`/u/${user.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-link text-[11px] uppercase tracking-[0.16em]"
            >
              {t("admin.dashboard.viewPublicPage")} →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
