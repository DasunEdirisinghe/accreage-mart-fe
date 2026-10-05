import { getReviewQueue } from "@/app/actions/listing-review";
import { ReviewQueueView } from "@/components/pages/listing-review/review-queue-view";
import { reviewTabFor, type DecisionKind } from "@/lib/review-tabs";

const KINDS: DecisionKind[] = ["approve", "reject", "suspend"];

interface SearchParams {
  tab?: string;
  q?: string;
  page?: string;
  decided?: string;
  as?: string;
}

export default async function ListingApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tab = reviewTabFor(params.tab);
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const kind = KINDS.find((candidate) => candidate === params.as);

  const data = await getReviewQueue({ status: tab.status, search, page });

  return (
    <ReviewQueueView
      data={data}
      tab={tab.slug}
      search={search}
      decided={params.decided && kind ? { name: params.decided, kind } : undefined}
    />
  );
}
