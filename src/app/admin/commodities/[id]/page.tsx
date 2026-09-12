import { notFound } from "next/navigation";

import { getCommodity } from "@/app/actions/pricing";
import { CommodityDetailView } from "@/components/shared/commodity-detail-view";

export default async function AdminCommodityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const commodity = await getCommodity(decodeURIComponent(id));
  if (!commodity) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return <CommodityDetailView commodity={commodity} today={today} />;
}
