import { getCategories, getCommodities } from "@/app/actions/pricing";
import { PageHeader } from "@/components/shared/page-header";
import { CategoriesTable } from "@/components/shared/categories-table";

export default async function AdminCategoriesPage() {
  const [categories, commodities] = await Promise.all([getCategories(), getCommodities()]);

  return (
    <>
      <PageHeader
        title="Categories"
        description="Manage the categories sellers pick from when listing, and link them to a priced commodity for AI price suggestions."
      />
      <CategoriesTable categories={categories} commodities={commodities} />
    </>
  );
}
