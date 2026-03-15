"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";

interface PublicProduct {
  id: string;
  userSlug: string | null;
  userDisplayName: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
}

interface PublicShopCatalogProps {
  products: PublicProduct[];
}

function formatPrice(price: number, locale: string) {
  const currencyLocale =
    locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN";

  return new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 2,
  }).format(price);
}

export default function PublicShopCatalog({
  products,
}: PublicShopCatalogProps) {
  const { t, locale } = useI18n();

  return (
    <main data-testid="public-shop-catalog" className="editorial-shell editorial-shell--light">
      <div className="editorial-container flex flex-col gap-10 py-10 sm:py-14">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.5fr)]">
          <div className="reveal max-w-4xl">
            <div className="editorial-kicker">{t("publicEntry.shop.eyebrow")}</div>
            <div className="line-wipe mt-5 max-w-sm" />
            <h1 className="editorial-hero-title mt-8 text-[color:var(--editorial-text)]">
              {t("publicEntry.shop.title")}
            </h1>
            <p className="editorial-subtitle mt-6">
              {t("publicEntry.shop.description")}
            </p>
          </div>

          <div className="reveal editorial-panel flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div>
              <div className="editorial-kicker">Market</div>
              <div className="mt-5 editorial-stat">
                <div className="editorial-stat__label">
                  {t("publicEntry.shop.countSuffix")}
                </div>
                <div className="editorial-stat__value">{products.length}</div>
              </div>
            </div>
            <Link
              href="/admin"
              className="editorial-button editorial-button--primary min-h-11 px-4 py-2.5 text-[11px]"
            >
              {t("publicEntry.common.openAdmin")}
            </Link>
          </div>
        </header>

        {products.length === 0 ? (
          <section className="reveal editorial-panel border-dashed px-6 py-16 text-center">
            <h2 className="font-serif text-3xl font-light text-[color:var(--editorial-text)]">
              {t("publicEntry.shop.emptyTitle")}
            </h2>
            <p className="editorial-copy mx-auto mt-4">
              {t("publicEntry.shop.emptyDescription")}
            </p>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const sellerSlug = product.userSlug ?? "";
              const productHref = sellerSlug
                ? `/u/${sellerSlug}/shop/${product.id}`
                : "/shop";
              const shopHref = sellerSlug ? `/u/${sellerSlug}/shop` : "/shop";
              const primaryImage = product.images[0] || null;

              return (
                <article
                  key={product.id}
                  data-testid={`public-shop-catalog-product-${product.id}`}
                  className="reveal overflow-hidden rounded-[1.9rem] border border-[color:color-mix(in_srgb,var(--editorial-border)_86%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_94%,transparent)] shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
                >
                  <Link
                    href={productHref}
                    className="relative block h-72 bg-[color:color-mix(in_srgb,var(--editorial-text)_5%,transparent)]"
                  >
                    {primaryImage ? (
                      isExternalUrl(primaryImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(201,169,110,0.14),rgba(26,26,24,0.06))] text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
                        SHOP
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col gap-5 p-6">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
                            {t("publicEntry.common.creatorLabel")}
                          </div>
                          <div className="mt-2 text-sm text-[color:var(--editorial-text)]">
                            {product.userDisplayName || (sellerSlug ? `@${sellerSlug}` : t("publicEntry.common.unknownCreator"))}
                          </div>
                        </div>
                        <div className="editorial-pill bg-[color:var(--editorial-accent)] text-[color:var(--editorial-accent-foreground)]">
                          {formatPrice(product.price, locale)}
                        </div>
                      </div>

                      <Link href={productHref} className="mt-4 block">
                        <h2 className="font-serif text-[1.9rem] font-light leading-[1.02] tracking-[0.03em] text-[color:var(--editorial-text)] transition-colors hover:text-[color:color-mix(in_srgb,var(--editorial-text)_82%,transparent)]">
                          {product.name}
                        </h2>
                      </Link>

                      {product.description ? (
                        <p className="mt-4 line-clamp-3 text-sm leading-8 text-[color:color-mix(in_srgb,var(--editorial-text)_76%,transparent)]">
                          {product.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-[color:color-mix(in_srgb,var(--editorial-border)_82%,transparent)] pt-4 text-sm">
                      <span
                        className={
                          product.stock === 0
                            ? "font-medium text-[color:#9a4b3d]"
                            : "text-[color:var(--editorial-muted)]"
                        }
                      >
                        {product.stock === 0
                          ? t("publicEntry.shop.outOfStock")
                          : `${t("publicEntry.shop.inStock")} ${product.stock}`}
                      </span>
                      {sellerSlug ? (
                        <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
                          @{sellerSlug}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={productHref}
                        className="editorial-button editorial-button--primary min-h-11 px-4 py-2.5 text-[11px]"
                      >
                        {t("publicEntry.shop.viewProduct")}
                      </Link>
                      {sellerSlug ? (
                        <Link
                          href={shopHref}
                          className="editorial-button editorial-button--secondary min-h-11 px-4 py-2.5 text-[11px]"
                        >
                          {t("publicEntry.shop.visitShop")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
