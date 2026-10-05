import Link from "next/link";
import { BadgeCheck, CalendarDays, ChevronLeft, MapPin, Package } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { RatingStars } from "@/components/shared/rating-stars";
import { PublicListingCard } from "@/components/pages/marketplace/public-listing-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketplaceHref } from "@/lib/marketplace-query";
import { formatDate, initials } from "@/lib/utils";
import type { MarketplaceResponse, PublicSeller } from "@/types/marketplace.type";

/** A seller's public page: their card and their published listings. No email, anywhere. */
export function PublicSellerView({
  seller,
  listings,
}: {
  seller: PublicSeller;
  listings: MarketplaceResponse;
}) {
  const base = `/sellers/${seller.public_id}`;

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/marketplace">
          <ChevronLeft className="h-4 w-4" /> Marketplace
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary via-emerald-600 to-teal-500" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="-mt-16 h-24 w-24 shrink-0 border-4 border-card shadow-md">
              <AvatarFallback className="bg-primary text-3xl font-semibold text-white">
                {initials(seller.business_name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
                {seller.business_name}
                {seller.verified && (
                  <Badge variant="info" className="gap-1">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </Badge>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {seller.district} district
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> Member since {formatDate(seller.member_since)}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" /> {seller.live_listing_count} live listing
                  {seller.live_listing_count === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RatingStars rating={seller.trust_score} />
                <span className="font-semibold text-foreground">{seller.trust_score.toFixed(1)}</span>
                <span className="text-muted-foreground">trust score</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {seller.description && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-bold">About</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{seller.description}</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">
          Listings from {seller.business_name}{" "}
          <span className="text-sm font-normal text-muted-foreground">({listings.total})</span>
        </h2>

        {listings.items.length === 0 ? (
          <EmptyState icon={Package} title="No live listings" description="This seller has no published listings right now." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.items.map((listing) => (
              <PublicListingCard key={listing.name} listing={listing} />
            ))}
          </div>
        )}

        {(listings.page > 1 || listings.has_more) && (
          <nav aria-label="Pages" className="mt-8 flex items-center justify-between text-sm">
            {listings.page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={marketplaceHref({ page: listings.page - 1 }, base)}>Previous</Link>
              </Button>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">Page {listings.page}</span>
            {listings.has_more ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={marketplaceHref({ page: listings.page + 1 }, base)}>Next</Link>
              </Button>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
