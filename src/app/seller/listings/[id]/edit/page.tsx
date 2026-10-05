import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getListingCategories, getOwnListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/pages/listings/listing-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { detailToFormValues, editRestriction } from "@/lib/listing-edit";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [response, categories] = await Promise.all([getOwnListing(id), getListingCategories()]);

  // Someone else's listing (or one that doesn't exist) is "not found" — never a hint it exists.
  if (!response?.listing || response.viewer !== "owner") notFound();

  const listing = response.listing;
  const restriction = editRestriction(listing);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/seller/listings">
          <ChevronLeft className="h-4 w-4" /> My listings
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">{listing.title}</p>
      </div>

      {restriction.canEdit ? (
        <ListingForm
          mode="edit"
          categories={categories}
          initial={detailToFormValues(listing)}
          listingName={listing.name}
          restriction={restriction}
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{restriction.blockedReason}</CardContent>
        </Card>
      )}
    </>
  );
}
