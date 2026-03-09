"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Alert from "./Alert";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import LoadingState from "./LoadingState";
import {
  MEDIA_ASSET_USAGE_CONTEXTS,
  MEDIA_ASSET_USAGE_LABEL_KEYS,
  type MediaAssetUsageContext,
  type MediaAssetUsageFilter,
} from "@/domain/media/usage";
import {
  pageApi,
  type MediaAssetListResponse,
  type MediaAssetSummary,
} from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useI18n } from "@/lib/i18n/context";

interface MediaLibraryBrowserProps {
  selectedSrc?: string | null;
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

export default function MediaLibraryBrowser({
  selectedSrc = null,
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
  const [selectingAssetId, setSelectingAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assets = response?.assets || [];
  const pagination = response?.pagination;
  const hasMore = Boolean(pagination && pagination.page < pagination.totalPages);

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
      Array.from(new Set([...current, ...assets.map((asset) => asset.id)]))
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
    <div className={joinClasses("space-y-4", className)}>
      {toastMessage ? <Alert type="success" message={toastMessage} /> : null}
      {error ? (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      ) : null}

      {!isPickerMode ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-black/60">
            {t("mediaLibrary.selectedCount").replace(
              "{count}",
              String(selectedAssetIds.length)
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={selectAllVisibleAssets}
              disabled={assets.length === 0 || deleting}
            >
              {t("mediaLibrary.selectAllVisible")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedAssetIds([])}
              disabled={selectedAssetIds.length === 0 || deleting}
            >
              {t("mediaLibrary.clearSelection")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteTargetIds(selectedAssetIds)}
              disabled={selectedAssetIds.length === 0 || deleting}
              loading={deleting}
            >
              {t("mediaLibrary.deleteSelected")}
            </Button>
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
              const label = getAssetLabel(asset, t("mediaLibrary.fileFallback"));

              return (
                <div
                  key={asset.id}
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
                        >
                          {selectLabel || t("mediaLibrary.select")}
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteTargetIds([asset.id])}
                          disabled={deleting}
                        >
                          {t("common.delete")}
                        </Button>
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
    </div>
  );
}
