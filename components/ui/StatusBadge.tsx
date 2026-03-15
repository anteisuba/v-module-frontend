// components/ui/StatusBadge.tsx
// 统一的状态徽章组件，使用 editorial 设计令牌代替硬编码 Tailwind 颜色

"use client";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "muted";

/**
 * 状态色调映射表：所有颜色使用 color-mix + editorial 变量，自适应深色/浅色主题
 */
const toneStyles: Record<StatusTone, { border: string; bg: string; text: string }> = {
  success: {
    border: "color-mix(in srgb, #6b8a5e 40%, transparent)",
    bg: "color-mix(in srgb, #6b8a5e 10%, var(--editorial-surface))",
    text: "#6b8a5e",
  },
  warning: {
    border: "color-mix(in srgb, #b8863a 40%, transparent)",
    bg: "color-mix(in srgb, #b8863a 10%, var(--editorial-surface))",
    text: "#b8863a",
  },
  danger: {
    border: "color-mix(in srgb, #9a4b3d 40%, transparent)",
    bg: "color-mix(in srgb, #9a4b3d 10%, var(--editorial-surface))",
    text: "#9a4b3d",
  },
  info: {
    border: "color-mix(in srgb, var(--editorial-accent) 40%, transparent)",
    bg: "color-mix(in srgb, var(--editorial-accent) 10%, var(--editorial-surface))",
    text: "var(--editorial-accent)",
  },
  neutral: {
    border: "color-mix(in srgb, var(--editorial-border) 60%, transparent)",
    bg: "color-mix(in srgb, var(--editorial-surface) 60%, transparent)",
    text: "var(--editorial-muted)",
  },
  muted: {
    border: "color-mix(in srgb, var(--editorial-border) 40%, transparent)",
    bg: "transparent",
    text: "var(--editorial-muted)",
  },
};

// ── 预定义的状态 → 色调映射 ──

const ORDER_STATUS_TONE: Record<string, StatusTone> = {
  AWAITING_PAYMENT: "warning",
  PENDING: "warning",
  PAID: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "neutral",
  REFUNDED: "danger",
};

const PRODUCT_STATUS_TONE: Record<string, StatusTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

const COMMENT_STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "neutral",
};

const PAYMENT_STATUS_TONE: Record<string, StatusTone> = {
  OPEN: "warning",
  PAID: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
  PARTIALLY_REFUNDED: "warning",
  REFUNDED: "danger",
};

const PAYOUT_STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: "success",
  RESTRICTED: "danger",
  PENDING: "warning",
  DISCONNECTED: "neutral",
  NOT_STARTED: "muted",
};

const DISPUTE_STATUS_TONE: Record<string, StatusTone> = {
  warning_needs_response: "warning",
  warning_under_review: "info",
  warning_closed: "success",
  needs_response: "warning",
  under_review: "info",
  won: "success",
  lost: "danger",
};

/**
 * 从预定义的映射表中获取状态色调
 */
export function getStatusTone(
  domain: "order" | "product" | "comment" | "payment" | "payout" | "dispute",
  status: string,
): StatusTone {
  const map = {
    order: ORDER_STATUS_TONE,
    product: PRODUCT_STATUS_TONE,
    comment: COMMENT_STATUS_TONE,
    payment: PAYMENT_STATUS_TONE,
    payout: PAYOUT_STATUS_TONE,
    dispute: DISPUTE_STATUS_TONE,
  }[domain];
  return map[status] ?? "neutral";
}

/**
 * 获取色调的内联样式对象
 */
export function getToneStyle(tone: StatusTone) {
  return toneStyles[tone];
}

// ── StatusBadge 组件 ──

interface StatusBadgeProps {
  /** 直接传入色调 */
  tone?: StatusTone;
  /** 或者传入 domain + status，自动解析色调 */
  domain?: "order" | "product" | "comment" | "payment" | "payout" | "dispute";
  status?: string;
  children: React.ReactNode;
  className?: string;
}

export default function StatusBadge({
  tone: toneProp,
  domain,
  status,
  children,
  className = "",
}: StatusBadgeProps) {
  const tone = toneProp ?? (domain && status ? getStatusTone(domain, status) : "neutral");
  const colors = toneStyles[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{
        borderColor: colors.border,
        background: colors.bg,
        color: colors.text,
      }}
    >
      {children}
    </span>
  );
}
