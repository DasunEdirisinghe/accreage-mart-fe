import { getMyListings } from "@/app/actions/listings";
import { MyListingsView } from "@/components/pages/listings/my-listings-view";
import type { MyListingsTab } from "@/types/listing.type";

const TABS: MyListingsTab[] = ["pending", "live", "hidden", "rejected", "suspended", "archived"];

interface SearchParams {
  tab?: string;
  q?: string;
  page?: string;
  submitted?: string;
  updated?: string;
}

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tab = TABS.find((candidate) => candidate === params.tab);
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getMyListings({ tab, search, page });

  return (
    <MyListingsView
      data={data}
      tab={tab}
      search={search}
      flash={{ submitted: params.submitted, updated: params.updated }}
    />
  );
}
