import { notFound } from "next/navigation";

import { getMarketplace, getPublicSeller } from "@/app/actions/marketplace";
import { PublicSellerView } from "@/components/pages/marketplace/public-seller-view";
import { parseMarketplaceParams } from "@/lib/marketplace-query";

export default async function SellerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const publicId = decodeURIComponent(id);
  const { page } = parseMarketplaceParams(await searchParams);

  const seller = await getPublicSeller(publicId);
  if (!seller) notFound();

  const listings = await getMarketplace({ seller: publicId, sort: "newest", page }, 8);
  return <PublicSellerView seller={seller} listings={listings} />;
}
