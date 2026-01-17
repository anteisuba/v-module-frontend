// features/shop/ProductList.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import { Skeleton } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
}

interface ProductListProps {
  products: Product[];
  userSlug: string;
  backgroundStyle?: React.CSSProperties;
}

// 单个商品卡片组件 - 带图片骨架屏
function ProductCard({ product, userSlug, formatPrice }: { 
  product: Product; 
  userSlug: string;
  formatPrice: (price: number) => string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasImage = product.images && product.images.length > 0;

  return (
    <Link
      href={`/u/${userSlug}/shop/${product.id}`}
      className="group rounded-lg overflow-hidden border border-black/10 bg-white hover:shadow-lg transition-shadow"
    >
      {hasImage && !imageError ? (
        <div className="relative w-full h-48 overflow-hidden">
          {/* 骨架屏：图片加载前显示 */}
          {!imageLoaded && (
            <div className="absolute inset-0 z-10">
              <Skeleton
                width="100%"
                height="100%"
                rounded="none"
                variant="shimmer"
              />
            </div>
          )}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No Image</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-black/80">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-black/60 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-black">
            {formatPrice(product.price)}
          </span>
          {product.stock === 0 && (
            <span className="text-xs text-red-600 font-semibold">缺货</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductList({ products, userSlug, backgroundStyle }: ProductListProps) {
  const menu = useHeroMenu();

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  const defaultBackgroundStyle: React.CSSProperties = {
    backgroundColor: "#000000",
  };

  return (
    <main className="relative min-h-screen text-black" style={backgroundStyle || defaultBackgroundStyle}>
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

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* 标题和返回按钮 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-wider">SHOP</h1>
          <Link
            href={`/u/${userSlug}`}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            BACK
          </Link>
        </div>

        {/* 内容区域 */}
        {products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-black/60 mb-4">暂无已发布的商品</p>
            <p className="text-sm text-black/40">
              提示：请确保商品状态设置为"已发布"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                userSlug={userSlug}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
