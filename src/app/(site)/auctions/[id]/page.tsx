"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Gavel, Trophy, ImageOff } from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/components/providers/current-user-provider";
import { getAuctionDetail, placeBid } from "@/app/actions/auctions";
import { formatLKR, formatDateTime } from "@/lib/utils";
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="relative flex h-56 items-center justify-center rounded-xl bg-muted sm:h-72">
            <ImageOff className="h-10 w-10 text-muted-foreground" />
            <Badge
              variant={isLive ? "accent" : auction.status === "ended" ? "muted" : "info"}
              className="absolute left-4 top-4"
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
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{listing.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lot size {listing.quantity_available.toLocaleString()} {listing.unit}
            </p>
            {listing.seller_business_name && (
              <p className="mt-1 text-sm text-muted-foreground">{listing.seller_business_name}</p>
            )}
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
        <div className="space-y-4">
          <Card className={isLive ? "border-accent/60" : undefined}>
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

          <Card>
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
        </div>
      </div>
    </div>
  );
}
