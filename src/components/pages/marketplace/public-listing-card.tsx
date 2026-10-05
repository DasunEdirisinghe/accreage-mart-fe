import Link from "next/link";
import { Gavel, ImageOff, MapPin, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { auctionPhaseText, biddingNote } from "@/lib/marketplace-format";
import { mediaUrl } from "@/lib/media";
import { formatDateTime, formatLKR } from "@/lib/utils";
import type { MarketplaceCard } from "@/types/marketplace.type";

const wall = (value: string) => value.slice(0, 19).replace(" ", "T");

/** One listing in the marketplace grid. Server-rendered: no client state. */
export function PublicListingCard({ listing }: { listing: MarketplaceCard }) {
  const isAuction = listing.selling_type === "Auction";
  const auction = listing.auction;

  return (
    <Link href={`/marketplace/${listing.name}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-muted">
          {listing.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(listing.cover_image)}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          )}
          {!listing.in_stock && !isAuction && (
            <Badge variant="destructive" className="absolute left-2 top-2">Out of stock</Badge>
          )}
        </div>

        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{listing.title}</h3>
            {isAuction ? (
              <Badge variant="accent" className="shrink-0">
                <Gavel className="mr-1 h-3 w-3" /> Auction
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">Direct</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {listing.location}, {listing.district}
            {listing.organic && (
              <Badge variant="success" className="ml-1 px-1.5 py-0 text-[10px]">Organic</Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {/* Only verified, active sellers appear on the marketplace at all. */}
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span className="truncate">{listing.seller.business_name}</span>
          </div>

          {isAuction && auction ? (
            <div className="space-y-0.5 pt-1">
              <div className="text-base font-bold text-primary">
                From {formatLKR(auction.min_bid)}
                <span className="text-xs font-normal text-muted-foreground">/{listing.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {auctionPhaseText(auction)}
                {auction.status === "scheduled" && ` · starts ${formatDateTime(wall(auction.start_time))}`}
                {biddingNote(auction) && ` · ${biddingNote(auction)}`}
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between pt-1">
              <div className="text-base font-bold text-primary">
                {formatLKR(listing.price_per_unit ?? 0)}
                <span className="text-xs font-normal text-muted-foreground">/{listing.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {listing.quantity_available.toLocaleString()} {listing.unit} available
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
