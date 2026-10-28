"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, ChevronLeft, ExternalLink, Gavel, MapPin, ShieldCheck, Trophy } from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/components/providers/current-user-provider";
import { getAuctionDetail, placeBid } from "@/app/actions/auctions";
import { PublicListingGallery } from "@/components/pages/marketplace/public-listing-gallery";
import { RatingStars } from "@/components/shared/rating-stars";
import { cn, formatLKR, formatDateTime, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeLeft } from "@/components/shared/time-left";
import type { AuctionDetailResponse } from "@/types/auctions.type";

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

/** Poll every 10-15s while the auction is live. */
const POLL_INTERVAL_MS = 12000;

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [details, setDetails] = React.useState<AuctionDetailResponse | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [amount, setAmount] = React.useState("");

  // First load: shows the page's own "not found" / loading states.
  const load = React.useCallback(() => {
    getAuctionDetail(id).then((data) => {
      setDetails(data);
      setLoaded(true);
    });
  }, [id]);

  // Background refresh: never flips a loading flag and never nulls out `details` on a
  // transient failure, so a poll can only ever update numbers in place, never flash/remount.
  const refresh = React.useCallback(() => {
    getAuctionDetail(id).then((data) => {
      if (data) setDetails(data);
    });
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const isLive = details?.auction.status === "live";

  React.useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLive, refresh]);

  if (!loaded) return null;

  if (!details) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Auction not found</p>
        <Button variant="link" asChild>
          <Link href="/auctions">Back to auctions</Link>
        </Button>
      </div>
    );
  }

  const { auction, listing, bids, highest_bid: highestBid } = details;
  const myHighest = user && bids.length ? bids.find((b) => b.bidder === user.email) : null;

  // Mirrors Story 7.1's server-side rule: must simply exceed the current highest (or min_bid
  // if there are no bids yet), no minimum raise.
  const minRequired = highestBid ? highestBid.amount : auction.min_bid;
  const amountNumber = amount.trim() === "" ? null : Number(amount);
  const bidError =
    amountNumber !== null && (Number.isNaN(amountNumber) || amountNumber <= minRequired)
      ? `Your bid must be more than ${formatLKR(minRequired)}/${listing.unit}.`
      : null;

  const handleBid = async () => {
    if (amountNumber === null || bidError) return;
    const res = await placeBid(auction.name, amountNumber);
    if (res.ok) {
      toast.success(`Bid of ${formatLKR(amountNumber)}/${listing.unit} placed`);
      setAmount("");
      refresh();
    } else {
      toast.error("Bid rejected", { description: res.error });
    }
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/auctions">
          <ChevronLeft className="h-4 w-4" /> Auctions
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <PublicListingGallery images={listing.images} title={listing.title} />

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{listing.category.title}</Badge>
              <Badge variant="accent">
                <Gavel className="mr-1 h-3 w-3" /> Auction listing
              </Badge>
              <Badge
                variant={isLive ? "accent" : auction.status === "ended" ? "muted" : "info"}
              >
                {isLive && (
                  <span className="mr-1.5 inline-flex h-2 w-2 animate-pulse rounded-full bg-accent-foreground" />
                )}
                {isLive
                  ? "LIVE"
                  : auction.status === "ended"
                    ? "Ended"
                    : auction.status === "cancelled"
                      ? "Cancelled"
                      : "Scheduled"}
              </Badge>
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
            <Fact label="Lot" value={`${listing.quantity_available.toLocaleString()} ${listing.unit}`} />
            <Fact label="Unit" value={listing.unit} />
            <Fact label="Type" value="Auction" />
          </div>

          {auction.status === "cancelled" && auction.cancel_reason && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              This auction was cancelled. Reason: {auction.cancel_reason}
            </p>
          )}

          {/* bid history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bid history</CardTitle>
              <CardDescription>All bids are binding.</CardDescription>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No bids yet, be the first.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bidder</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Time</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((b, i) => (
                      <TableRow key={b.name}>
                        <TableCell className="font-medium">
                          {user?.email === b.bidder ? "You" : "Buyer ••••"}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatLKR(b.amount)}/{listing.unit}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {formatDateTime(b.bid_time)}
                        </TableCell>
                        <TableCell>
                          {i === 0 && <Badge variant="success">Highest</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* bid panel */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:flex lg:flex-col lg:self-start lg:space-y-0 lg:gap-4">
          <Card className={cn(isLive ? "border-accent/60" : undefined, "lg:order-2")}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {highestBid ? "Current highest bid" : "Starting bid"}
                  </p>
                  <p className="text-3xl font-extrabold text-primary">
                    {formatLKR(highestBid ? highestBid.amount : auction.min_bid)}
                    <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
                  </p>
                </div>
                {isLive && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Closes in</p>
                    <p className="font-bold text-accent-foreground">
                      <TimeLeft endTime={auction.end_time} />
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {auction.status === "ended" ? (
                <div className="rounded-md bg-secondary p-4 text-center">
                  <Trophy className="mx-auto mb-2 h-6 w-6 text-accent" />
                  {highestBid ? (
                    <>
                      <p className="font-semibold">Won at {formatLKR(highestBid.amount)}/{listing.unit}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.email === highestBid.bidder ? "You won this auction." : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Auction closed with no winning bid.</p>
                  )}
                </div>
              ) : auction.status === "cancelled" ? (
                <p className="rounded-md bg-secondary p-4 text-center text-sm">
                  This auction has been cancelled.
                </p>
              ) : auction.status === "scheduled" ? (
                <p className="rounded-md bg-secondary p-4 text-center text-sm">
                  Bidding opens {formatDateTime(auction.start_time)}
                </p>
              ) : user?.role === "buyer" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="bid-amount">Your bid (LKR per {listing.unit})</Label>
                    <Input
                      id="bid-amount"
                      type="number"
                      placeholder={String(minRequired + 5)}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      aria-invalid={!!bidError}
                    />
                    {bidError && (
                      <p role="alert" className="text-xs text-destructive">
                        {bidError}
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="accent"
                    onClick={handleBid}
                    disabled={!amount || !!bidError}
                  >
                    <Gavel className="h-4 w-4" /> Place bid
                  </Button>
                  {myHighest && (
                    <p className="text-center text-xs text-muted-foreground">
                      Your best bid: {formatLKR(myHighest.amount)}/{listing.unit}
                      {highestBid?.bidder === user?.email && ", you're leading!"}
                    </p>
                  )}
                </div>
              ) : (
                <Button className="w-full" size="lg" asChild>
                  <Link href="/login">Sign in as buyer to bid</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="lg:order-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Auction details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Starts</span>
                <span className="font-medium">{formatDateTime(auction.start_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ends</span>
                <span className="font-medium">{formatDateTime(auction.end_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum bid</span>
                <span className="font-medium">{formatLKR(auction.min_bid)}/{listing.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total bids</span>
                <span className="font-medium">{bids.length}</span>
              </div>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                The highest valid bid at closing wins. Winning buyers must complete the order and
                upload payment proof within 24 hours.
              </p>
            </CardContent>
          </Card>

          <Card className="lg:order-3">
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
