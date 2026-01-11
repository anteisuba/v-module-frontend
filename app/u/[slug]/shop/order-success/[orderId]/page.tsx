// app/u/[slug]/shop/order-success/[orderId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const menu = useHeroMenu();
  const [slug, setSlug] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
      setOrderId(resolvedParams.orderId);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (orderId) {
      // 这里可以加载订单详情，暂时只显示成功消息
      setLoading(false);
    }
  }, [orderId]);

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-16 px-6">
      {/* 右上角菜单按钮 */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4 text-white">
        <button
          className="text-2xl opacity-90 hover:opacity-100 transition drop-shadow-lg"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          ☰
        </button>
      </div>

      {/* 菜单 */}
      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">订单已提交</h1>
          <p className="text-black/60">
            订单号: {orderId?.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="bg-white/50 rounded-lg p-6 border border-black/10 mb-6 text-left">
          <p className="text-black/70 mb-4">
            您的订单已成功提交！卖家会通过您提供的邮箱联系您，完成后续的支付和配送流程。
          </p>
          <p className="text-sm text-black/60">
            请保持邮箱畅通，我们会尽快处理您的订单。
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href={`/u/${slug}/shop`}
            className="rounded-lg border border-black/20 bg-white/70 px-6 py-2 text-sm font-medium text-black hover:bg-white/80 transition-colors"
          >
            继续购物
          </Link>
          <Link
            href={`/u/${slug}`}
            className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
          >
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
