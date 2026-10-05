import { getMyListings } from "@/app/actions/listings";
import { InventoryView } from "@/components/pages/listings/inventory-view";

export default async function SellerInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const data = await getMyListings({
    selling_type: "Direct",
    exclude_archived: true,
    page: Math.max(1, Number(page) || 1),
    page_size: 24,
  });

  return <InventoryView data={data} />;
}
