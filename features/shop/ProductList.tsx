// features/shop/ProductList.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";

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
  const imageSrc = hasImage ? product.images[0] : null;
  const isExternal = imageSrc ? isExternalUrl(imageSrc) : false;

  return (
    <Link
      href={`/u/${userSlug}/shop/${product.id}`}
      data-testid={`public-user-shop-product-${product.id}`}
      className="group reveal overflow-hidden rounded-[1.8rem] border border-white/10 bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_92%,transparent)] backdrop-blur-xl shadow-[0_24px_72px_rgba(17,12,6,0.12)] transition-colors hover:border-white/20"
    >
      {imageSrc && !imageError ? (
        <div className="relative h-64 w-full overflow-hidden">
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
          {isExternal ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={product.name}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex h-64 w-full items-center justify-center bg-[linear-gradient(135deg,rgba(201,169,110,0.16),rgba(20,20,16,0.08))]">
          <span className="text-[11px] uppercase tracking-[0.24em] text-white/48">No Image</span>
        </div>
      )}
      <div className="p-6">
        <div className="editorial-kicker text-white/44">Product</div>
        <h3 className="mt-3 line-clamp-2 font-serif text-[1.9rem] font-light leading-[1.02] tracking-[0.03em] text-white">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-8 text-white/68">
            {product.description}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="font-serif text-[1.8rem] font-light text-white">
            {formatPrice(product.price)}
          </span>
          {product.stock === 0 && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:#9a4b3d]">缺货</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductList({ products, userSlug, backgroundStyle }: ProductListProps) {
  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  const defaultBackgroundStyle: React.CSSProperties = {
    backgroundColor: "#000000",
  };

  return (
    <main
      data-testid="public-user-shop-list"
      className="editorial-shell relative min-h-screen"
    >
      <div
        className="absolute inset-0"
        style={backgroundStyle || defaultBackgroundStyle}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0.18),rgba(8,8,6,0.6)_56%,rgba(8,8,6,0.82))]" />

      <div className="editorial-container pt-20 sm:pt-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="reveal max-w-3xl">
            <div className="editorial-kicker text-white/54">Creator shop</div>
            <div className="line-wipe mt-5 max-w-sm bg-white/16" />
            <h1 className="mt-8 font-serif text-[clamp(3.2rem,7vw,6.8rem)] font-light leading-[0.92] tracking-[0.03em] text-white">
              Shop
            </h1>
          </div>
          <Link
            href={`/u/${userSlug}`}
            className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
          >
            Back
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="reveal editorial-panel px-6 py-20 text-center">
            <p className="font-serif text-5xl font-extralight tracking-widest text-white/25">{'\u2726'}</p>
            <p className="mt-6 font-serif text-3xl font-light text-white">商品即将上架</p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">
              创作者正在准备中，敬请关注。
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
