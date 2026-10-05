import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getListingCategories } from "@/app/actions/listings";
import { ListingForm } from "@/components/pages/listings/listing-form";
import { Button } from "@/components/ui/button";

export default async function NewListingPage() {
  const categories = await getListingCategories();

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/seller/listings">
          <ChevronLeft className="h-4 w-4" /> My listings
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All listings are reviewed by staff before they are published.
        </p>
      </div>

      <ListingForm mode="create" categories={categories} />
    </>
  );
}
