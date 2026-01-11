// features/shop/ProductDetail.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
}

interface ProductDetailProps {
  product: Product;
  userSlug: string;
}

export default function ProductDetail({ product, userSlug }: ProductDetailProps) {
  const router = useRouter();
  const menu = useHeroMenu();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  function handleBuyNow() {
    router.push(`/u/${userSlug}/shop/${product.id}/checkout`);
  }

  return (
    <div className="relative min-h-screen text-black py-16 px-6">
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
      <div className="max-w-6xl mx-auto">
        {/* 返回链接 */}
        <Link
          href={`/u/${userSlug}/shop`}
          className="inline-block mb-6 text-sm text-black/60 hover:text-black transition-colors"
        >
          ← 返回商店
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 图片轮播 */}
          <div>
            {product.images && product.images.length > 0 ? (
              <>
                <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          currentImageIndex === index
                            ? "border-black"
                            : "border-transparent hover:border-black/30"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* 商品信息 */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="text-3xl font-bold mb-6">{formatPrice(product.price)}</div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">商品描述</h2>
                <p className="text-black/70 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* 库存状态 */}
            <div className="mb-6">
              {product.stock === 0 ? (
                <span className="text-red-600 font-semibold">缺货</span>
              ) : (
                <span className="text-black/60">库存: {product.stock}</span>
              )}
            </div>

            {/* 购买按钮 */}
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full rounded-xl bg-black px-6 py-4 text-lg font-medium text-white hover:bg-black/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {product.stock === 0 ? "缺货" : "立即购买"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
