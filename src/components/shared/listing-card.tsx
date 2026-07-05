"use client";

import Link from "next/link";
import { MapPin, Gavel, ShieldCheck } from "lucide-react";

import { cn, formatLKR } from "@/lib/utils";
import type { Listing, SellerProfile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";

interface ListingCardProps {
  listing: Listing;
  seller?: SellerProfile;
  href?: string;
}

export function ListingCard({ listing, seller, href }: ListingCardProps) {
  return (
    <Link href={href ?? `/marketplace/${listing.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div
          className={cn(
            "flex h-36 items-center justify-center bg-gradient-to-br text-6xl",
            listing.imageGradient
          )}
        >
          <span className="transition-transform group-hover:scale-110">{listing.image}</span>
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{listing.title}</h3>
            {listing.sellingType === "auction" ? (
              <Badge variant="accent" className="shrink-0">
                <Gavel className="mr-1 h-3 w-3" /> Auction
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Direct
              </Badge>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {listing.location}, {listing.district}
            {listing.organic && (
              <Badge variant="success" className="ml-1 px-1.5 py-0 text-[10px]">
                Organic
              </Badge>
            )}
          </p>
          {seller && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {seller.verified && <ShieldCheck className="h-3 w-3 text-primary" />}
              <span className="truncate">{seller.businessName}</span>
              <RatingStars rating={seller.trustScore} />
            </div>
          )}
          <div className="flex items-baseline justify-between pt-1">
            {listing.sellingType === "direct" ? (
              <p className="text-base font-bold text-primary">
                {formatLKR(listing.pricePerUnit)}
                <span className="text-xs font-normal text-muted-foreground">/{listing.unit}</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-accent-foreground">
                Bidding open
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              min {listing.minOrderQty} {listing.unit}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
