import Link from "next/link";
import {
  BadgeCheck,
  ChevronLeft,
  ExternalLink,
  Gavel,
  Info,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { PublicListingGallery } from "@/components/pages/marketplace/public-listing-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { auctionPhaseText } from "@/lib/marketplace-format";
import { formatDate, formatDateTime, formatLKR } from "@/lib/utils";
import type { PublicListingResponse } from "@/types/marketplace.type";

const wall = (value: string) => value.slice(0, 19).replace(" ", "T");

/** Shown when this viewer isn't allowed to see the listing itself (hidden, suspended, archived). */
export function ListingUnavailable({ message }: { message: string | null }) {
  return (
    <div className="container py-20 text-center">
      <p className="text-lg font-semibold">{message ?? "This listing is unavailable."}</p>
      <Button variant="link" asChild>
        <Link href="/marketplace">Back to marketplace</Link>
      </Button>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

/** One listing, as this viewer may see it. Server-rendered; only the photo gallery is interactive. */
export function PublicListingDetail({ data }: { data: PublicListingResponse }) {
  const { listing, message, viewer } = data;
  if (!listing) return <ListingUnavailable message={message} />;

  const isAuction = listing.selling_type === "Auction";
  const auction = listing.auction;
  const images = listing.images;

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/marketplace">
          <ChevronLeft className="h-4 w-4" /> Marketplace
        </Link>
      </Button>

      {message && (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <Info className="h-4 w-4 shrink-0" />
          <span className="flex-1">{message}</span>
          {viewer === "owner" && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/seller/listings">My listings</Link>
            </Button>
          )}
          {viewer === "staff" && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/approvals/${listing.name}`}>Open in review</Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <PublicListingGallery images={images} title={listing.title} />

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{listing.category.title}</Badge>
              {isAuction ? (
                <Badge variant="accent">
                  <Gavel className="mr-1 h-3 w-3" /> Auction listing
                </Badge>
              ) : (
                <Badge variant="secondary">Direct sale</Badge>
              )}
              {listing.organic && <Badge variant="success">Organic</Badge>}
              {listing.organic && listing.certification && (
                <Badge variant="info">
                  <BadgeCheck className="mr-1 h-3 w-3" /> {listing.certification}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{listing.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {listing.location}, {listing.district} district
              </span>
              {listing.map_url && (
                <a
                  href={listing.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline"
                >
                  View on Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span>listed {formatDate(listing.created)}</span>
            </div>
          </div>

          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{listing.description}</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact
              label={isAuction ? "Lot" : "Available"}
              value={`${listing.quantity_available.toLocaleString()} ${listing.unit}`}
            />
            {!isAuction && (
              <Fact label="Min. order" value={`${listing.min_order_qty ?? 1} ${listing.unit}`} />
            )}
            <Fact label="Unit" value={listing.unit} />
            <Fact label="Type" value={isAuction ? "Auction" : "Direct"} />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              {isAuction && auction ? (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Sold by auction · whole lot to the winner</div>
                    <div className="text-3xl font-extrabold text-primary">
                      From {formatLKR(auction.min_bid)}
                      <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
                    </div>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd><Badge variant={auction.status === "live" ? "success" : "outline"}>{auctionPhaseText(auction)}</Badge></dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Starts</dt>
                      <dd>{formatDateTime(wall(auction.start_time))}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Ends</dt>
                      <dd>{formatDateTime(wall(auction.end_time))}</dd>
                    </div>
                  </dl>
                  <Button className="w-full" size="lg" variant="accent" disabled>
                    <Gavel className="h-4 w-4" /> Bidding opens soon
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Wholesale price</div>
                    <div className="text-3xl font-extrabold text-primary">
                      {formatLKR(listing.price_per_unit ?? 0)}
                      <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    {listing.in_stock ? (
                      <Badge variant="success">In stock</Badge>
                    ) : (
                      <Badge variant="destructive">Out of stock</Badge>
                    )}
                  </div>
                  <Button className="w-full" size="lg" disabled>
                    {listing.in_stock ? "Ordering opens soon" : "Out of stock"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/sellers/${listing.seller.public_id}`}
                className="flex items-center gap-1.5 font-semibold hover:underline"
              >
                {listing.seller.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
                {listing.seller.business_name}
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <RatingStars rating={listing.seller.trust_score} />
                <span className="font-medium">{listing.seller.trust_score.toFixed(1)}</span>
                <span className="text-muted-foreground">trust score</span>
              </div>
              <div className="text-sm text-muted-foreground">{listing.seller.district} district</div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/sellers/${listing.seller.public_id}`}>View seller profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
