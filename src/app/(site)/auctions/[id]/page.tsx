"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Gavel, BrainCircuit, Trophy, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { getAuctionDetails, placeBid } from "@/lib/services/auctions";
import { cn, formatLKR, formatDateTime } from "@/lib/utils";
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

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const { user, buyerProfile, loginAs } = useAuth();
  const [amount, setAmount] = React.useState("");

  const details = getAuctionDetails(db, id);

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

  const { auction, listing, bids, highestBid } = details;
  const seller = db.sellerProfiles.find((s) => s.id === listing.sellerId);
  const isLive = auction.status === "live";
  const winnerBid = auction.winnerBidId ? db.bids.find((b) => b.id === auction.winnerBidId) : null;
  const winnerBuyer = winnerBid ? db.buyerProfiles.find((b) => b.id === winnerBid.buyerId) : null;
  const myHighest =
    buyerProfile && bids.length
      ? bids.find((b) => b.buyerId === buyerProfile.id)
      : null;

  const handleBid = () => {
    if (!buyerProfile) return;
    const res = placeBid(auction.id, buyerProfile.id, Number(amount));
    if (res.ok) {
      toast.success(`Bid of ${formatLKR(Number(amount))}/${listing.unit} placed`);
      setAmount("");
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

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div
            className={cn(
              "relative flex h-56 items-center justify-center rounded-xl bg-gradient-to-br text-7xl sm:h-72",
              listing.imageGradient
            )}
          >
            {listing.image}
            <Badge
              variant={isLive ? "accent" : auction.status === "ended" ? "muted" : "info"}
              className="absolute left-4 top-4"
            >
              {isLive && (
                <span className="mr-1.5 inline-flex h-2 w-2 animate-pulse rounded-full bg-accent-foreground" />
              )}
              {isLive ? "LIVE" : auction.status === "ended" ? "Ended" : "Scheduled"}
            </Badge>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {listing.location}, {listing.district} · Lot size{" "}
              {listing.quantityAvailable.toLocaleString()} {listing.unit}
            </p>
            {seller && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                {seller.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
                {seller.businessName} · trust score {seller.trustScore.toFixed(1)}
              </p>
            )}
          </div>

          <p className="text-muted-foreground">{listing.description}</p>

          {/* bid history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bid history</CardTitle>
              <CardDescription>
                All bids are binding. Identities are partially masked for fairness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No bids yet — be the first.
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
                    {bids.map((b, i) => {
                      const bp = db.buyerProfiles.find((x) => x.id === b.buyerId);
                      const masked = bp
                        ? `${bp.businessName.slice(0, 3)}•••• (${bp.buyerType})`
                        : "Buyer ••••";
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            {buyerProfile?.id === b.buyerId ? "You" : masked}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {formatLKR(b.amount)}/{listing.unit}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {formatDateTime(b.bidTime)}
                          </TableCell>
                          <TableCell>
                            {i === 0 && <Badge variant="success">Highest</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* bid panel */}
        <div className="space-y-4">
          <Card className={cn(isLive && "border-accent/60")}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {highestBid ? "Current highest bid" : "Starting bid"}
                  </p>
                  <p className="text-3xl font-extrabold text-primary">
                    {formatLKR(highestBid ? highestBid.amount : auction.minBid)}
                    <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
                  </p>
                </div>
                {isLive && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Closes in</p>
                    <p className="font-bold text-accent-foreground">
                      <TimeLeft endTime={auction.endTime} />
                    </p>
                  </div>
                )}
              </div>

              {auction.aiFairValue && (
                <p className="flex items-center gap-1.5 rounded-md bg-secondary p-2.5 text-xs">
                  <BrainCircuit className="h-4 w-4 shrink-0 text-primary" />
                  AI fair-value estimate: {formatLKR(auction.aiFairValue)}/{listing.unit} (Prophet
                  forecast)
                </p>
              )}

              <Separator />

              {auction.status === "ended" ? (
                <div className="rounded-md bg-secondary p-4 text-center">
                  <Trophy className="mx-auto mb-2 h-6 w-6 text-accent" />
                  {winnerBid && winnerBuyer ? (
                    <>
                      <p className="font-semibold">
                        Won by {winnerBuyer.businessName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        at {formatLKR(winnerBid.amount)}/{listing.unit}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Auction closed with no winning bid.</p>
                  )}
                </div>
              ) : auction.status === "scheduled" ? (
                <p className="rounded-md bg-secondary p-4 text-center text-sm">
                  Bidding opens {formatDateTime(auction.startTime)}
                </p>
              ) : user?.role === "buyer" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Your bid (LKR per {listing.unit})</Label>
                    <Input
                      type="number"
                      placeholder={String((highestBid ? highestBid.amount : auction.minBid) + 5)}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" size="lg" variant="accent" onClick={handleBid} disabled={!amount}>
                    <Gavel className="h-4 w-4" /> Place bid
                  </Button>
                  {myHighest && (
                    <p className="text-center text-xs text-muted-foreground">
                      Your best bid: {formatLKR(myHighest.amount)}/{listing.unit}
                      {highestBid?.buyerId === buyerProfile?.id && " — you're leading!"}
                    </p>
                  )}
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={() => loginAs("buyer")}>
                  Sign in as buyer to bid
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
                <span className="font-medium">{formatDateTime(auction.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ends</span>
                <span className="font-medium">{formatDateTime(auction.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum bid</span>
                <span className="font-medium">{formatLKR(auction.minBid)}/{listing.unit}</span>
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
