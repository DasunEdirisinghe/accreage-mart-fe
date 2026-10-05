import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { MarketplaceFilterForm } from "@/components/pages/marketplace/marketplace-filters";
import { PublicListingCard } from "@/components/pages/marketplace/public-listing-card";
import { activeFilterCount, marketplaceHref, type MarketplaceFilters } from "@/lib/marketplace-query";
import type { ListingCategoryOption } from "@/types/listing.type";
import type { MarketplaceResponse } from "@/types/marketplace.type";

export function MarketplaceView({
  data,
  filters,
  categories,
}: {
  data: MarketplaceResponse;
  filters: MarketplaceFilters;
  categories: ListingCategoryOption[];
}) {
  const filtered = activeFilterCount(filters) > 0;
  const category = categories.find((c) => c.name === filters.category);

  return (
    <div className="container py-8">
      <PageHeader
        title={category ? category.title : "Marketplace"}
        description="Published wholesale listings from verified agricultural sellers across Sri Lanka."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <MarketplaceFilterForm filters={filters} categories={categories} />

        <div>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {data.total} listing{data.total === 1 ? "" : "s"} found
          </p>

          {data.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={filtered ? "No listings match your filters" : "No listings yet"}
              description={
                filtered
                  ? "Try widening the category, district or price range."
                  : "Published listings will appear here."
              }
            >
              {filtered && (
                <Button asChild variant="outline">
                  <Link href="/marketplace">Clear filters</Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((listing) => (
                <PublicListingCard key={listing.name} listing={listing} />
              ))}
            </div>
          )}

          {(data.page > 1 || data.has_more) && (
            <nav aria-label="Pages" className="mt-8 flex items-center justify-between text-sm">
              {data.page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={marketplaceHref({ ...filters, page: data.page - 1 })}>Previous</Link>
                </Button>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground">Page {data.page}</span>
              {data.has_more ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={marketplaceHref({ ...filters, page: data.page + 1 })}>Next</Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
