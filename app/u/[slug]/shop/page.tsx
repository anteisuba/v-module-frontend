// app/u/[slug]/shop/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getProducts } from "@/domain/shop/services";
import ProductList from "@/features/shop/ProductList";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG, resolveBackgroundStyle } from "@/domain/page-config/constants";
import {
  findE2EPublicPageState,
  getE2EPublicPageProducts,
  getE2EPublicSiteState,
} from "@/lib/e2e/publicPageState";

export default async function UserShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e2eSiteState = await getE2EPublicSiteState();
  const e2ePageState = findE2EPublicPageState(e2eSiteState, slug);
  const e2eProducts = getE2EPublicPageProducts(e2eSiteState, slug);

  const user = e2ePageState
    ? {
        id: `e2e-user-${slug}`,
        slug,
        displayName: e2ePageState.displayName,
        page: {
          publishedConfig: e2ePageState.publishedConfig,
        },
      }
    : await getUserPageDataBySlug(slug);

  if (!user) {
    notFound();
  }

  // 获取页面配置（用于背景样式）
  let config: PageConfig = EMPTY_PAGE_CONFIG;
  if (user.page?.publishedConfig) {
    try {
      config = user.page.publishedConfig as PageConfig;
    } catch (e) {
      console.error("Failed to parse publishedConfig:", e);
    }
  }

  // 获取已发布的商品
  const productData =
    e2eProducts !== null
      ? { products: e2eProducts }
      : await getProducts({
          userId: user.id,
          status: "PUBLISHED",
          limit: 100,
        });

  // 调试信息（开发环境）
  if (process.env.NODE_ENV === "development") {
    console.log(`[Shop Page] User slug: ${slug}, User ID: ${user.id}, Found ${productData.products.length} published products`);
    if (productData.products.length === 0) {
      // 检查是否有其他状态的商品
      const allProductData = await getProducts({
        userId: user.id,
        limit: 10,
      });
      console.log(`[Shop Page] Total products (all statuses): ${allProductData.products.length}`);
    }
  }

  const backgroundStyle = resolveBackgroundStyle(config?.shopBackground, config?.newsBackground);

  return <ProductList products={productData.products} userSlug={slug} backgroundStyle={backgroundStyle} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e2ePageState = findE2EPublicPageState(
    await getE2EPublicSiteState(),
    slug
  );
  const user = e2ePageState
    ? {
        slug,
        displayName: e2ePageState.displayName,
      }
    : await getUserPageDataBySlug(slug);

  if (!user) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${user.displayName || user.slug}'s Shop`,
    description: `Products by ${user.displayName || user.slug}`,
  };
}
