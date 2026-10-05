import { getMarketplace, getMarketplaceCategories } from "@/app/actions/marketplace";
import { LandingContent } from "@/components/pages/landing/landing-content";
import { pickLandingCategories } from "@/lib/marketplace-format";

export default async function LandingPage() {
  const [featured, auctions, categories] = await Promise.all([
    getMarketplace({ sort: "newest", page: 1 }, 8),
    getMarketplace({ type: "Auction", sort: "newest", page: 1 }, 2),
    getMarketplaceCategories(),
  ]);

  return (
    <LandingContent
      featured={featured.items}
      auctions={auctions.items}
      categories={pickLandingCategories(categories)}
      categoryCount={categories.length}
    />
  );
}
