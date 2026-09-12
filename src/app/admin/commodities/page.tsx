import { getCommoditiesOverview } from "@/app/actions/pricing";
import { PageHeader } from "@/components/shared/page-header";
import { CommoditiesList } from "@/components/shared/commodities-list";

export default async function AdminCommoditiesPage() {
  const commodities = await getCommoditiesOverview();

  return (
    <>
      <PageHeader
        title="Commodities"
        description="Priced commodities tracked by the AI forecasting pipeline. View-only — commodities are created by the ingestion pipeline, not from here."
      />
      <CommoditiesList commodities={commodities} />
    </>
  );
}
