"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getMarketplace } from "@/app/actions/marketplace";
import { PublicListingCard } from "@/components/pages/marketplace/public-listing-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseMarketplaceParams } from "@/lib/marketplace-query";
import type { MarketplaceCard } from "@/types/marketplace.type";

/**
 * The newest published listings, for dashboards (which are client components). Loads through the
 * same public action as the marketplace, so it shows real listings and never mock ones.
 */
export function LatestListings({ limit = 4 }: { limit?: number }) {
  const [items, setItems] = React.useState<MarketplaceCard[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getMarketplace(parseMarketplaceParams({}), limit).then((result) => {
      if (!cancelled) setItems(result.items);
    });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (items === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: limit }, (_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No listings are published yet.{" "}
        <Button variant="link" asChild className="h-auto p-0">
          <Link href="/marketplace">
            Open the marketplace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((listing) => (
        <PublicListingCard key={listing.name} listing={listing} />
      ))}
    </div>
  );
}
