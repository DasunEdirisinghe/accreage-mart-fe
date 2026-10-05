import { notFound } from "next/navigation";

import { getListingForReview } from "@/app/actions/listing-review";
import { ListingReviewView } from "@/components/pages/listing-review/listing-review-view";

export default async function ReviewListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getListingForReview(decodeURIComponent(id));
  if (!data) notFound();

  return <ListingReviewView data={data} />;
}
