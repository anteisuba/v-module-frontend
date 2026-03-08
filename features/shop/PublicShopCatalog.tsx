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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.5),_rgba(255,255,255,1)_36%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_54%,_#fff7ed_100%)] text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {t("publicEntry.shop.eyebrow")}
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t("publicEntry.shop.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {t("publicEntry.shop.description")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 xl:items-end">
            <div className="rounded-full border border-black/10 bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              {products.length} {t("publicEntry.shop.countSuffix")}
            </div>
            <Link
              href="/admin"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
            >
              {t("publicEntry.common.openAdmin")}
            </Link>
          </div>
        </header>

        {products.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-black/15 bg-white/70 px-6 py-16 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              {t("publicEntry.shop.emptyTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
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
                  className="overflow-hidden rounded-[28px] border border-black/10 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
                >
                  <Link
                    href={productHref}
                    className="relative block h-64 bg-slate-100"
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
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,_#dbeafe,_#fde68a)] text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                        SHOP
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col gap-5 p-5">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {t("publicEntry.common.creatorLabel")}
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-700">
                            {product.userDisplayName || (sellerSlug ? `@${sellerSlug}` : t("publicEntry.common.unknownCreator"))}
                          </div>
                        </div>
                        <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white">
                          {formatPrice(product.price, locale)}
                        </div>
                      </div>

                      <Link href={productHref} className="mt-4 block">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 transition-colors hover:text-slate-700">
                          {product.name}
                        </h2>
                      </Link>

                      {product.description ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                          {product.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-black/8 pt-4 text-sm">
                      <span
                        className={
                          product.stock === 0
                            ? "font-medium text-red-600"
                            : "text-slate-500"
                        }
                      >
                        {product.stock === 0
                          ? t("publicEntry.shop.outOfStock")
                          : `${t("publicEntry.shop.inStock")} ${product.stock}`}
                      </span>
                      {sellerSlug ? (
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          @{sellerSlug}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={productHref}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                      >
                        {t("publicEntry.shop.viewProduct")}
                      </Link>
                      {sellerSlug ? (
                        <Link
                          href={shopHref}
                          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
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
