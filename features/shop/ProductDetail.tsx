// features/shop/ProductDetail.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";

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
  backgroundStyle?: React.CSSProperties;
}

export default function ProductDetail({
  product,
  userSlug,
  backgroundStyle,
}: ProductDetailProps) {
  const router = useRouter();
  const menu = useHeroMenu();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  function handleBuyNow() {
    router.push(`/u/${userSlug}/shop/${product.id}/checkout`);
  }

  const currentImage = product.images[currentImageIndex];
  const currentImageIsExternal = currentImage ? isExternalUrl(currentImage) : false;

  return (
    <main
      data-testid="public-user-shop-detail"
      className="editorial-shell relative min-h-screen"
    >
      <div
        className="absolute inset-0"
        style={backgroundStyle || { backgroundColor: "#000000" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0.18),rgba(8,8,6,0.64)_56%,rgba(8,8,6,0.84))]" />

      <div className="fixed right-6 top-6 z-50 flex items-center gap-4 text-white">
        <button
          className="editorial-button min-h-10 border-white/14 bg-black/28 px-4 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/40"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          Menu
        </button>
      </div>

      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="editorial-container pt-20 sm:pt-24">
        <Link
          href={`/u/${userSlug}/shop`}
          className="editorial-link text-[11px] uppercase tracking-[0.18em]"
        >
          ← 返回商店
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
          <div>
            {product.images && product.images.length > 0 ? (
              <>
                <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                  {currentImageIsExternal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square overflow-hidden rounded-[1.1rem] border transition-colors ${
                          currentImageIndex === index
                            ? "border-[color:var(--theme-primary)]"
                            : "border-white/10 hover:border-white/28"
                        }`}
                      >
                        {isExternalUrl(img) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 25vw, 12.5vw"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(201,169,110,0.16),rgba(20,20,16,0.08))]">
                <span className="text-[11px] uppercase tracking-[0.24em] text-white/48">No Image</span>
              </div>
            )}
          </div>

          <div className="reveal editorial-panel p-6 sm:p-8">
            <div className="editorial-kicker text-white/54">Product</div>
            <h1
              data-testid="public-user-shop-detail-title"
              className="mt-5 font-serif text-[clamp(2.8rem,4.5vw,4.8rem)] font-light leading-[0.94] tracking-[0.03em] text-white"
            >
              {product.name}
            </h1>
            <div className="mt-5 font-serif text-[2.4rem] font-light text-[color:var(--theme-primary)]">
              {formatPrice(product.price)}
            </div>

            {product.description && (
              <div className="mt-8">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/46">商品描述</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-white/72">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-white/10 pt-5">
              {product.stock === 0 ? (
                <span className="text-[11px] uppercase tracking-[0.18em] text-[color:#9a4b3d]">缺货</span>
              ) : (
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/48">
                  库存: {product.stock}
                </span>
              )}
            </div>

            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              data-testid="public-shop-buy-now"
              className="editorial-button editorial-button--primary mt-8 w-full min-h-14 px-6 py-4 text-[11px] disabled:opacity-45"
            >
              {product.stock === 0 ? "缺货" : "立即购买"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
