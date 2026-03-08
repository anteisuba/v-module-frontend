"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  BackButton,
  Button,
  ConfirmDialog,
  Input,
  LanguageSelector,
  LoadingState,
} from "@/components/ui";
import { blogApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";
type StatusFilter = "ALL" | CommentStatus;

interface ModerationComment {
  id: string;
  blogPostId: string;
  userName: string;
  userEmail: string | null;
  content: string;
  status: CommentStatus;
  createdAt: string;
  moderatedAt: string | null;
  user: {
    id: string;
    slug: string;
    displayName: string | null;
  } | null;
  blogPost: {
    id: string;
    title: string;
    published: boolean;
  };
}

interface CommentSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const EMPTY_SUMMARY: CommentSummary = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

export default function CommentsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [summary, setSummary] = useState<CommentSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(
    null
  );
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [commentToDelete, setCommentToDelete] =
    useState<ModerationComment | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (!userLoading && user) {
      void loadComments();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [user, userLoading, debouncedQuery, statusFilter]);

  async function loadComments() {
    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await blogApi.getModerationComments({
        page: 1,
        limit: 100,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        query: debouncedQuery || undefined,
      });

      setComments(response.comments);
      setSummary(response.summary);
      setHasLoadedOnce(true);
    } catch (err) {
      handleError(err);
      showToast(t("comments.list.loadFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleUpdateStatus(
    commentId: string,
    nextStatus: CommentStatus
  ) {
    try {
      setUpdatingCommentId(commentId);
      await blogApi.updateCommentStatus(commentId, nextStatus);
      await loadComments();
      showToast(
        nextStatus === "APPROVED"
          ? t("comments.list.approved")
          : t("comments.list.rejected")
      );
    } catch (err) {
      handleError(err);
      showToast(t("comments.list.updateFailed"));
    } finally {
      setUpdatingCommentId(null);
    }
  }

  async function handleDelete() {
    if (!commentToDelete) {
      return;
    }

    try {
      setDeletingCommentId(commentToDelete.id);
      await blogApi.deleteComment(commentToDelete.id);
      await loadComments();
      showToast(t("comments.list.deleted"));
      setCommentToDelete(null);
    } catch (err) {
      handleError(err);
      showToast(t("comments.list.deleteFailed"));
    } finally {
      setDeletingCommentId(null);
    }
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
  }

  function formatDate(dateString: string | null) {
    if (!dateString) {
      return t("comments.list.notModerated");
    }

    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusLabel(status: CommentStatus) {
    const labels: Record<CommentStatus, string> = {
      PENDING: t("comments.status.pending"),
      APPROVED: t("comments.status.approved"),
      REJECTED: t("comments.status.rejected"),
    };

    return labels[status];
  }

  function getStatusColor(status: CommentStatus) {
    const colors: Record<CommentStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-gray-100 text-gray-700",
    };

    return colors[status];
  }

  if (userLoading || loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <BackButton href="/admin/dashboard" label={t("common.back")} />
        <div className="fixed bottom-6 right-6 z-[100]">
          <LanguageSelector position="bottom-right" />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">{t("comments.title")}</h1>
          <p className="mt-1 text-sm text-black/70">
            {t("comments.description")}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-medium text-black/70">
                {t("comments.filters.searchLabel")}
              </label>
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("comments.filters.searchPlaceholder")}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-black/70">
                {t("comments.filters.statusLabel")}
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
              >
                <option value="ALL">{t("comments.filters.statusAll")}</option>
                <option value="PENDING">{t("comments.status.pending")}</option>
                <option value="APPROVED">{t("comments.status.approved")}</option>
                <option value="REJECTED">{t("comments.status.rejected")}</option>
              </select>
            </div>

            <div className="flex gap-2 md:justify-end">
              <Button
                variant="secondary"
                onClick={resetFilters}
                disabled={
                  (searchQuery.length === 0 && statusFilter === "ALL") ||
                  loading ||
                  refreshing
                }
              >
                {t("comments.filters.reset")}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-black/55">
            <span>
              {t("comments.list.currentResults").replace(
                "{count}",
                comments.length.toString()
              )}
            </span>
            {refreshing ? <span>{t("comments.list.refreshing")}</span> : null}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-black/60">{t("comments.stats.total")}</div>
            <div className="mt-1 text-2xl font-bold text-black">
              {summary.total}
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-black/60">
              {t("comments.stats.pending")}
            </div>
            <div className="mt-1 text-2xl font-bold text-black">
              {summary.pending}
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-black/60">
              {t("comments.stats.approved")}
            </div>
            <div className="mt-1 text-2xl font-bold text-black">
              {summary.approved}
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-black/60">
              {t("comments.stats.rejected")}
            </div>
            <div className="mt-1 text-2xl font-bold text-black">
              {summary.rejected}
            </div>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        {toastMessage && (
          <div className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 transform rounded-lg bg-black px-4 py-2 text-sm text-white">
            {toastMessage}
          </div>
        )}

        {comments.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-12 text-center backdrop-blur-xl">
            <p className="text-black/60">
              {debouncedQuery || statusFilter !== "ALL"
                ? t("comments.list.emptyFiltered")
                : t("comments.list.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-black">
                        {comment.user?.displayName || comment.userName}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${getStatusColor(
                          comment.status
                        )}`}
                      >
                        {getStatusLabel(comment.status)}
                      </span>
                      {comment.user ? (
                        <span className="text-xs text-blue-600">
                          @{comment.user.slug}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1 text-sm text-black/65">
                      <p>
                        {t("comments.list.postLabel")}
                        {" "}
                        {comment.blogPost.published && user.slug ? (
                          <Link
                            href={`/u/${user.slug}/blog/${comment.blogPost.id}`}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            {comment.blogPost.title}
                          </Link>
                        ) : (
                          <span>{comment.blogPost.title}</span>
                        )}
                      </p>
                      <p>
                        {t("comments.list.emailLabel")}
                        {" "}
                        {comment.userEmail || t("comments.list.anonymousEmail")}
                      </p>
                      <p>
                        {t("comments.list.submittedAt")}
                        {" "}
                        {formatDate(comment.createdAt)}
                      </p>
                      <p>
                        {t("comments.list.moderatedAt")}
                        {" "}
                        {formatDate(comment.moderatedAt)}
                      </p>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap rounded-xl border border-black/10 bg-white/70 p-4 text-sm leading-relaxed text-black/85">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 md:w-44 md:flex-col">
                    {comment.status !== "APPROVED" ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleUpdateStatus(comment.id, "APPROVED")
                        }
                        loading={updatingCommentId === comment.id}
                        disabled={
                          updatingCommentId === comment.id ||
                          deletingCommentId === comment.id
                        }
                      >
                        {t("comments.list.approve")}
                      </Button>
                    ) : null}

                    {comment.status !== "REJECTED" ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleUpdateStatus(comment.id, "REJECTED")
                        }
                        loading={updatingCommentId === comment.id}
                        disabled={
                          updatingCommentId === comment.id ||
                          deletingCommentId === comment.id
                        }
                      >
                        {t("comments.list.reject")}
                      </Button>
                    ) : null}

                    <Button
                      variant="danger"
                      onClick={() => setCommentToDelete(comment)}
                      loading={deletingCommentId === comment.id}
                      disabled={
                        updatingCommentId === comment.id ||
                        deletingCommentId === comment.id
                      }
                    >
                      {t("comments.list.delete")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!commentToDelete}
        title={t("comments.deleteConfirm.title")}
        message={t("comments.deleteConfirm.message")}
        confirmLabel={t("common.delete")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setCommentToDelete(null)}
      />
    </main>
  );
}
