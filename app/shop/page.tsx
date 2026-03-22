import type { Metadata } from "next";
import { getProducts } from "@/domain/shop";
import PublicShopCatalog from "@/features/shop/PublicShopCatalog";
import { getE2EPublicShopCatalog, getE2EPublicSiteState } from "@/lib/e2e/publicPageState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse products from creators.",
  openGraph: { title: "Shop", description: "Browse products from creators." },
};

export default async function ShopPage() {
  const e2eSiteState = await getE2EPublicSiteState();
  const e2eProducts = getE2EPublicShopCatalog(e2eSiteState);
  const productData =
    e2eProducts !== null
      ? { products: e2eProducts }
      : await getProducts({
          status: "PUBLISHED",
          limit: 60,
        });

  return <PublicShopCatalog products={productData.products} />;
}
