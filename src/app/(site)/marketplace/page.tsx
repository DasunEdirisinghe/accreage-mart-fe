import { getMarketplace, getMarketplaceCategories } from "@/app/actions/marketplace";
import { MarketplaceView } from "@/components/pages/marketplace/marketplace-view";
import { parseMarketplaceParams } from "@/lib/marketplace-query";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseMarketplaceParams(await searchParams);
  const [data, categories] = await Promise.all([getMarketplace(filters), getMarketplaceCategories()]);

  return <MarketplaceView data={data} filters={filters} categories={categories} />;
}
