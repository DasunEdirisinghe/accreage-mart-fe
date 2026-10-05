import { notFound } from "next/navigation";

import { getPublicListing } from "@/app/actions/marketplace";
import { PublicListingDetail } from "@/components/pages/marketplace/public-listing-detail";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicListing(decodeURIComponent(id));

  // A listing that doesn't exist, or that this viewer may not even know about (pending, rejected).
  if (!data) notFound();

  return <PublicListingDetail data={data} />;
}
