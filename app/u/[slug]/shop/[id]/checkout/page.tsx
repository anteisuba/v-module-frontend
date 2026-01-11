// app/u/[slug]/shop/[id]/checkout/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input, Button, FormField, Alert, LoadingState } from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const menu = useHeroMenu();

  const [slug, setSlug] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    zipCode: "",
    country: "",
  });
  const [shippingMethod, setShippingMethod] = useState("Standard");

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
      setProductId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      const prod = await shopApi.getProduct(productId!);
      setProduct(prod);
    } catch (err) {
      handleError(err);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!buyerEmail.trim()) {
      showToast("请输入邮箱");
      return;
    }

    if (quantity < 1 || quantity > product.stock) {
      showToast("购买数量无效");
      return;
    }

    try {
      setSubmitting(true);
      const orderResponse = await shopApi.createOrder({
        userId: product.userId,
        buyerEmail: buyerEmail.trim(),
        buyerName: buyerName.trim() || null,
        shippingAddress: Object.values(shippingAddress).some((v) => v.trim())
          ? shippingAddress
          : null,
        shippingMethod: shippingMethod || null,
        items: [
          {
            productId: product.id,
            quantity,
          },
        ],
      });
      
      // orderResponse 是订单对象，包含 id
      if (!orderResponse?.id) {
        throw new Error("订单创建失败：未返回订单 ID");
      }

      router.push(`/u/${slug}/shop/order-success/${orderResponse.id}`);
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  }

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

  if (!product) {
    return null;
  }

  const totalPrice = product.price * quantity;

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

      <div className="max-w-4xl mx-auto">
        <Link
          href={`/u/${slug}/shop/${product.id}`}
          className="inline-block mb-6 text-sm text-black/60 hover:text-black transition-colors"
        >
          ← 返回商品详情
        </Link>

        <h1 className="text-3xl font-bold mb-8">下单</h1>

        {error && <Alert type="error" message={error} onClose={clearError} />}
        {toastMessage && <Alert type="success" message={toastMessage} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 商品信息 */}
          <div className="bg-white/50 rounded-lg p-6 border border-black/10">
            <h2 className="text-lg font-semibold mb-4">商品信息</h2>
            <div className="flex gap-4 mb-4">
              {product.images && product.images.length > 0 && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-lg font-bold">{formatPrice(product.price)}</p>
              </div>
            </div>
            <div className="border-t border-black/10 pt-4">
              <div className="flex justify-between mb-2">
                <span>数量:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={submitting}
                    className="w-8 h-8 rounded border border-black/20 hover:bg-black/5"
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    disabled={submitting || quantity >= product.stock}
                    className="w-8 h-8 rounded border border-black/20 hover:bg-black/5"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-black/10">
                <span>总计:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="邮箱 *" required>
              <Input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={submitting}
              />
            </FormField>

            <FormField label="姓名（可选）">
              <Input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="您的姓名"
                disabled={submitting}
              />
            </FormField>

            <FormField label="配送地址（可选）">
              <div className="space-y-2">
                <Input
                  value={shippingAddress.street}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      street: e.target.value,
                    })
                  }
                  placeholder="街道地址"
                  disabled={submitting}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value,
                      })
                    }
                    placeholder="城市"
                    disabled={submitting}
                  />
                  <Input
                    value={shippingAddress.zipCode}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        zipCode: e.target.value,
                      })
                    }
                    placeholder="邮编"
                    disabled={submitting}
                  />
                </div>
                <Input
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      country: e.target.value,
                    })
                  }
                  placeholder="国家"
                  disabled={submitting}
                />
              </div>
            </FormField>

            <FormField label="配送方式">
              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
              >
                <option value="Standard">标准配送</option>
                <option value="Express">快速配送</option>
              </select>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={submitting}
              disabled={product.stock === 0}
            >
              提交订单
            </Button>

            <p className="text-xs text-black/60 text-center">
              提交订单后，卖家会通过邮箱联系您完成支付和配送
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
