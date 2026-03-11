"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "./Alert";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import LoadingState from "./LoadingState";
import MediaPickerDialog from "./MediaPickerDialog";
import { getMediaAssetReferenceTarget } from "@/domain/media/reference-targets";
import {
  MEDIA_ASSET_USAGE_CONTEXTS,
  MEDIA_ASSET_USAGE_LABEL_KEYS,
  type MediaAssetUsageContext,
  type MediaAssetUsageFilter,
} from "@/domain/media/usage";
import {
  pageApi,
  ApiError,
  type MediaAssetListResponse,
  type MediaAssetSummary,
} from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useI18n } from "@/lib/i18n/context";

interface MediaLibraryBrowserProps {
  selectedSrc?: string | null;
  disabledAssetIds?: string[];
  onSelect?: (asset: MediaAssetSummary) => void;
  selectLabel?: string;
  usageContext?: MediaAssetUsageContext;
  className?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getAssetLabel(asset: MediaAssetSummary, fallbackLabel: string) {
  if (asset.originalName?.trim()) {
    return asset.originalName.trim();
  }

  const segments = asset.src.split("/");
  return segments[segments.length - 1] || fallbackLabel;
}

function getUsageLabel(
  t: (key: string) => string,
  usageContext: MediaAssetUsageContext
) {
  return t(MEDIA_ASSET_USAGE_LABEL_KEYS[usageContext]);
}

function getReferenceLabel(
  t: (key: string) => string,
  asset: MediaAssetSummary,
  reference: MediaAssetSummary["references"][number]
) {
  switch (reference.kind) {
    case "PAGE_DRAFT_CONFIG":
      return `${t("mediaLibrary.referenceKinds.pageDraft")} · ${reference.field}`;
    case "PAGE_PUBLISHED_CONFIG":
      return `${t("mediaLibrary.referenceKinds.pagePublished")} · ${reference.field}`;
    case "BLOG_POST_COVER":
      return `${t("mediaLibrary.referenceKinds.blogCover")} · ${reference.entityLabel}`;
    case "PRODUCT_IMAGE":
      return `${t("mediaLibrary.referenceKinds.productImage")} · ${reference.entityLabel} · ${reference.field}`;
    case "NEWS_ARTICLE_BACKGROUND":
      return `${t("mediaLibrary.referenceKinds.newsArticleBackground")} · ${reference.entityLabel}`;
    default:
      return `${asset.referenceCount} ${t("mediaLibrary.referencesLabel")}`;
  }
}

export default function MediaLibraryBrowser({
  selectedSrc = null,
  disabledAssetIds = [],
  onSelect,
  selectLabel,
  usageContext,
  className,
}: MediaLibraryBrowserProps) {
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const isPickerMode = Boolean(onSelect);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [usageFilter, setUsageFilter] =
    useState<MediaAssetUsageFilter>("ALL");
  const [response, setResponse] = useState<MediaAssetListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingUsage, setUpdatingUsage] = useState(false);
  const [selectingAssetId, setSelectingAssetId] = useState<string | null>(null);
  const [replacingSourceAssetId, setReplacingSourceAssetId] = useState<string | null>(
    null
  );
  const [replaceSourceAsset, setReplaceSourceAsset] =
    useState<MediaAssetSummary | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [batchUsageAction, setBatchUsageAction] = useState<
    "ADD" | "REMOVE" | "CLEAR"
  >("ADD");
  const [batchUsageContext, setBatchUsageContext] =
    useState<MediaAssetUsageContext>(MEDIA_ASSET_USAGE_CONTEXTS[0]);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assets = response?.assets || [];
  const pagination = response?.pagination;
  const hasMore = Boolean(pagination && pagination.page < pagination.totalPages);

  const disabledAssetIdSet = useMemo(
    () => new Set(disabledAssetIds),
    [disabledAssetIds]
  );
  const selectedAssets = useMemo(
    () =>
      assets.filter((asset) => selectedAssetIds.includes(asset.id)),
    [assets, selectedAssetIds]
  );
  const hasInUseSelection = selectedAssets.some((asset) => asset.isInUse);

  async function loadAssets(page = 1, append = false) {
    try {
      setError(null);
      if (append) {
        setLoadingMore(true);
      } else if (response) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const nextResponse = await pageApi.getMediaAssets({
        page,
        limit: 24,
        query: deferredQuery || undefined,
        usageContext: usageFilter,
      });

      setResponse((currentResponse) => {
        if (!append || !currentResponse) {
          return nextResponse;
        }

        return {
          assets: [...currentResponse.assets, ...nextResponse.assets],
          pagination: nextResponse.pagination,
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("mediaLibrary.loadFailed")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setSelectedAssetIds([]);
    void loadAssets(1);
  }, [deferredQuery, usageFilter]);

  async function handleUpload(file: File) {
    try {
      setUploading(true);
      const uploadResponse = await pageApi.uploadImage(file, {
        usageContext,
      });
      await loadAssets(1);
      showToast(t("mediaLibrary.uploaded"));

      if (uploadResponse.asset && onSelect) {
        onSelect(uploadResponse.asset);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setUploading(false);
    }
  }

  async function handleCopy(src: string) {
    try {
      await navigator.clipboard.writeText(src);
      showToast(t("mediaLibrary.copiedUrl"));
    } catch {
      setError(t("mediaLibrary.copyFailed"));
    }
  }

  async function handleSelectAsset(asset: MediaAssetSummary) {
    if (!onSelect) {
      return;
    }

    try {
      setSelectingAssetId(asset.id);
      let nextAsset = asset;

      if (usageContext && !asset.usageContexts.includes(usageContext)) {
        const usageResponse = await pageApi.addMediaAssetUsage(
          [asset.id],
          usageContext
        );

        nextAsset = usageResponse.assets[0] || {
          ...asset,
          usageContexts: [...asset.usageContexts, usageContext],
        };
      }

      onSelect(nextAsset);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSelectingAssetId(null);
    }
  }

  async function handleReplaceAssetReferences(
    sourceAsset: MediaAssetSummary,
    targetAsset: MediaAssetSummary
  ) {
    if (sourceAsset.id === targetAsset.id) {
      setError(t("mediaLibrary.replaceSameAsset"));
      return;
    }

    try {
      setReplacingSourceAssetId(sourceAsset.id);
      const result = await pageApi.replaceMediaAssetReferences(
        sourceAsset.id,
        targetAsset.id
      );
      setReplaceSourceAsset(null);
      await loadAssets(1);
      showToast(
        t("mediaLibrary.replaceSuccess").replace(
          "{count}",
          String(result.replacedReferenceCount)
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("mediaLibrary.replaceFailed")
      );
    } finally {
      setReplacingSourceAssetId(null);
    }
  }

  async function handleBatchUsageUpdate() {
    if (selectedAssetIds.length === 0) {
      return;
    }

    try {
      setUpdatingUsage(true);

      if (batchUsageAction === "CLEAR") {
        await pageApi.clearMediaAssetUsage(selectedAssetIds);
      } else if (batchUsageAction === "REMOVE") {
        await pageApi.removeMediaAssetUsage(selectedAssetIds, batchUsageContext);
      } else {
        await pageApi.addMediaAssetUsage(selectedAssetIds, batchUsageContext);
      }

      await loadAssets(1);
      showToast(
        batchUsageAction === "CLEAR"
          ? t("mediaLibrary.bulkTagSuccessClear")
          : batchUsageAction === "REMOVE"
            ? t("mediaLibrary.bulkTagSuccessRemove")
            : t("mediaLibrary.bulkTagSuccessAdd")
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("mediaLibrary.bulkTagFailed")
      );
    } finally {
      setUpdatingUsage(false);
    }
  }

  async function handleDeleteAssets(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    try {
      setDeleting(true);
      await pageApi.deleteMediaAssets(ids);
      setSelectedAssetIds((current) =>
        current.filter((selectedId) => !ids.includes(selectedId))
      );
      setDeleteTargetIds(null);
      await loadAssets(1);
      showToast(t("mediaLibrary.deleteSuccess"));
    } catch (err) {
      setDeleteTargetIds(null);
      if (
        err instanceof ApiError &&
        err.code === "MEDIA_ASSETS_IN_USE" &&
        err.details &&
        typeof err.details === "object" &&
        "blockedAssets" in err.details
      ) {
        await loadAssets(1);
      }
      setError(
        err instanceof Error ? err.message : t("mediaLibrary.deleteFailed")
      );
    } finally {
      setDeleting(false);
    }
  }

  function toggleAssetSelection(assetId: string) {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    );
  }

  function selectAllVisibleAssets() {
    setSelectedAssetIds((current) =>
      Array.from(
        new Set([
          ...current,
          ...assets.map((asset) => asset.id),
        ])
      )
    );
  }

  const emptyMessage = useMemo(() => {
    if (deferredQuery || usageFilter !== "ALL") {
      return t("mediaLibrary.noResults");
    }

    return t("mediaLibrary.empty");
  }, [deferredQuery, usageFilter, t]);

  const deleteMessage =
    deleteTargetIds && deleteTargetIds.length > 1
      ? t("mediaLibrary.deleteConfirmBulk").replace(
          "{count}",
          String(deleteTargetIds.length)
        )
      : t("mediaLibrary.deleteConfirmSingle");

  return (
    <div className={joinClasses("space-y-4", className)} data-testid="media-library-browser">
      {toastMessage ? <Alert type="success" message={toastMessage} /> : null}
      {error ? (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      ) : null}

      {!isPickerMode ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-xs text-black/60">
              {t("mediaLibrary.selectedCount").replace(
                "{count}",
                String(selectedAssetIds.length)
              )}
            </div>
            {hasInUseSelection ? (
              <div className="text-[11px] text-amber-700">
                {t("mediaLibrary.deleteSelectionWarning")}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={selectAllVisibleAssets}
                disabled={assets.length === 0 || deleting || updatingUsage}
              >
                {t("mediaLibrary.selectAllVisible")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAssetIds([])}
                disabled={
                  selectedAssetIds.length === 0 || deleting || updatingUsage
                }
              >
                {t("mediaLibrary.clearSelection")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteTargetIds(selectedAssetIds)}
                disabled={
                  selectedAssetIds.length === 0 ||
                  deleting ||
                  updatingUsage ||
                  hasInUseSelection
                }
                loading={deleting}
              >
                {t("mediaLibrary.deleteSelected")}
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-[150px_220px_auto]">
              <select
                value={batchUsageAction}
                onChange={(event) =>
                  setBatchUsageAction(
                    event.target.value as "ADD" | "REMOVE" | "CLEAR"
                  )
                }
                data-testid="media-library-bulk-tag-action"
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
              >
                <option value="ADD">{t("mediaLibrary.bulkTagAdd")}</option>
                <option value="REMOVE">{t("mediaLibrary.bulkTagRemove")}</option>
                <option value="CLEAR">{t("mediaLibrary.bulkTagClear")}</option>
              </select>
              <select
                value={batchUsageContext}
                onChange={(event) =>
                  setBatchUsageContext(
                    event.target.value as MediaAssetUsageContext
                  )
                }
                data-testid="media-library-bulk-tag-context"
                disabled={batchUsageAction === "CLEAR"}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {MEDIA_ASSET_USAGE_CONTEXTS.map((value) => (
                  <option key={value} value={value}>
                    {getUsageLabel(t, value)}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="md"
                onClick={() => void handleBatchUsageUpdate()}
                loading={updatingUsage}
                disabled={
                  selectedAssetIds.length === 0 ||
                  deleting ||
                  updatingUsage ||
                  (batchUsageAction !== "CLEAR" && !batchUsageContext)
                }
                data-testid="media-library-bulk-tag-apply"
              >
                {t("mediaLibrary.bulkTagApply")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl md:flex-row md:items-end md:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label className="mb-1 block text-xs font-medium text-black/70">
              {t("mediaLibrary.searchLabel")}
            </label>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("mediaLibrary.searchPlaceholder")}
              data-testid="media-library-search"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-black/70">
              {t("mediaLibrary.filterLabel")}
            </label>
            <select
              value={usageFilter}
              onChange={(event) =>
                setUsageFilter(event.target.value as MediaAssetUsageFilter)
              }
              data-testid="media-library-filter"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
            >
              <option value="ALL">{t("mediaLibrary.filterAll")}</option>
              <option value="UNSPECIFIED">
                {t("mediaLibrary.filterUnspecified")}
              </option>
              {MEDIA_ASSET_USAGE_CONTEXTS.map((value) => (
                <option key={value} value={value}>
                  {getUsageLabel(t, value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            id="media-library-upload"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              const inputElement = event.currentTarget;

              if (file) {
                void handleUpload(file);
              }

              inputElement.value = "";
            }}
            disabled={uploading}
          />
          <label
            htmlFor="media-library-upload"
            className={joinClasses(
              "inline-flex cursor-pointer items-center rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-white",
              uploading && "cursor-not-allowed opacity-60"
            )}
          >
            {uploading ? t("common.uploading") : t("mediaLibrary.uploadButton")}
          </label>
          <Button
            variant="secondary"
            size="md"
            onClick={() => void loadAssets(1)}
            disabled={loading || refreshing || loadingMore || deleting}
            data-testid="media-library-refresh"
          >
            {refreshing ? t("common.loading") : t("mediaLibrary.refresh")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white/55 p-10 backdrop-blur-xl">
          <LoadingState message={t("common.loading")} />
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/45 px-6 py-10 text-center text-sm text-black/55">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const isSelected = selectedSrc === asset.src;
              const isChecked = selectedAssetIds.includes(asset.id);
              const isSelectionDisabled = disabledAssetIdSet.has(asset.id);
              const label = getAssetLabel(asset, t("mediaLibrary.fileFallback"));
              const visibleReferences = asset.references.slice(0, 2);

              return (
                <div
                  key={asset.id}
                  data-testid={`media-asset-card-${asset.id}`}
                  className={joinClasses(
                    "overflow-hidden rounded-2xl border bg-white/70 shadow-sm transition-colors",
                    isSelected
                      ? "border-black/35 ring-1 ring-black/20"
                      : "border-black/10"
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
                    {!isPickerMode ? (
                      <label className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-[11px] text-black shadow-sm">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAssetSelection(asset.id)}
                          disabled={deleting || updatingUsage}
                          className="mr-1.5"
                        />
                        {t("mediaLibrary.selectShort")}
                      </label>
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.src}
                      alt={label}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="space-y-1">
                      <div className="truncate text-sm font-semibold text-black">
                        {label}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-black/55">
                        <span>{formatBytes(asset.size)}</span>
                        <span>{new Date(asset.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <span
                        className={joinClasses(
                          "rounded-full px-2 py-1 text-[10px]",
                          asset.isInUse
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {asset.isInUse
                          ? t("mediaLibrary.inUse").replace(
                              "{count}",
                              String(asset.referenceCount)
                            )
                          : t("mediaLibrary.notInUse")}
                      </span>
                      {asset.usageContexts.length > 0 ? (
                        asset.usageContexts.map((value) => (
                          <span
                            key={`${asset.id}-${value}`}
                            className="rounded-full bg-black/5 px-2 py-1 text-[10px] text-black/60"
                          >
                            {getUsageLabel(t, value)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] text-black/45">
                          {t("mediaLibrary.filterUnspecified")}
                        </span>
                      )}
                    </div>

                    {asset.isInUse ? (
                      <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                        {visibleReferences.map((reference, index) => {
                          const target = getMediaAssetReferenceTarget(reference);

                          return (
                            <div
                              key={`${asset.id}-${reference.kind}-${index}`}
                              className="flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                {getReferenceLabel(t, asset, reference)}
                              </div>
                              {target ? (
                                <Link
                                  href={target.href}
                                  data-testid={`media-asset-go-to-replace-${asset.id}-${index}`}
                                  className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-[10px] font-medium text-amber-800 transition-colors hover:bg-amber-100"
                                >
                                  {t("mediaLibrary.goToReplace")}
                                </Link>
                              ) : null}
                            </div>
                          );
                        })}
                        {asset.referenceCount > visibleReferences.length ? (
                          <div className="text-amber-700/80">
                            {t("mediaLibrary.moreReferences").replace(
                              "{count}",
                              String(asset.referenceCount - visibleReferences.length)
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="truncate rounded-lg bg-black/5 px-2 py-1 text-[11px] text-black/60">
                      {asset.src}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {onSelect ? (
                        <Button
                          variant={isSelected ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => void handleSelectAsset(asset)}
                          loading={selectingAssetId === asset.id}
                          disabled={isSelectionDisabled}
                          data-testid={`media-asset-select-${asset.id}`}
                        >
                          {selectLabel || t("mediaLibrary.select")}
                        </Button>
                      ) : (
                        asset.isInUse ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setReplaceSourceAsset(asset)}
                            loading={replacingSourceAssetId === asset.id}
                            disabled={deleting}
                            data-testid={`media-asset-open-replace-${asset.id}`}
                          >
                            {t("mediaLibrary.replaceAction")}
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTargetIds([asset.id])}
                            disabled={deleting}
                            data-testid={`media-asset-delete-${asset.id}`}
                          >
                            {t("common.delete")}
                          </Button>
                        )
                      )}
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => void handleCopy(asset.src)}
                      >
                        {t("mediaLibrary.copyUrl")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore ? (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  pagination ? void loadAssets(pagination.page + 1, true) : undefined
                }
                disabled={loadingMore || deleting}
              >
                {loadingMore ? t("common.loading") : t("mediaLibrary.loadMore")}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetIds?.length)}
        title={t("mediaLibrary.deleteConfirmTitle")}
        message={deleteMessage}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={() => void handleDeleteAssets(deleteTargetIds || [])}
        onCancel={() => setDeleteTargetIds(null)}
      />
      <MediaPickerDialog
        open={Boolean(replaceSourceAsset)}
        title={t("mediaLibrary.replaceTitle")}
        description={t("mediaLibrary.replaceDescription")}
        selectedSrc={replaceSourceAsset?.src || null}
        selectLabel={t("mediaLibrary.replaceSelect")}
        disabledAssetIds={replaceSourceAsset ? [replaceSourceAsset.id] : []}
        onSelect={(asset) => {
          if (replaceSourceAsset) {
            void handleReplaceAssetReferences(replaceSourceAsset, asset);
          }
        }}
        onClose={() => {
          if (!replacingSourceAssetId) {
            setReplaceSourceAsset(null);
          }
        }}
      />
    </div>
  );
}
