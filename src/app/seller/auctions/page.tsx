"use client";

import Link from "next/link";
import { Gavel, Plus } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TimeLeft } from "@/components/shared/time-left";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT = {
  pending: "warning",
  scheduled: "info",
  live: "accent",
  ended: "muted",
  rejected: "destructive",
} as const;

export default function SellerAuctionsPage() {
  const db = useDB();
  const { sellerProfile } = useAuth();
  if (!sellerProfile) return null;

  const myAuctions = db.auctions.filter((a) => {
    const listing = db.listings.find((l) => l.id === a.listingId);
    return listing?.sellerId === sellerProfile.id;
  });

  return (
    <>
      <PageHeader
        title="My auctions"
        description="Auctions require staff approval before going live. The system auto-closes them and notifies the winner."
      >
        <Button asChild>
          <Link href="/seller/listings/new">
            <Plus className="h-4 w-4" /> New auction listing
          </Link>
        </Button>
      </PageHeader>

      {myAuctions.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No auctions yet"
          description="Create a listing with selling type 'Auction' to start competitive bidding."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Lot</TableHead>
                  <TableHead>Min bid</TableHead>
                  <TableHead>Highest bid</TableHead>
                  <TableHead>Bids</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Window</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAuctions.map((a) => {
                  const listing = db.listings.find((l) => l.id === a.listingId)!;
                  const bids = db.bids.filter((b) => b.auctionId === a.id);
                  const highest = [...bids].sort((x, y) => y.amount - x.amount)[0];
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="max-w-56 pl-4">
                        <Link href={`/auctions/${a.id}`} className="block truncate font-medium text-primary hover:underline">
                          {listing.image} {listing.title}
                        </Link>
                      </TableCell>
                      <TableCell>{formatLKR(a.minBid)}/{listing.unit}</TableCell>
                      <TableCell className="font-medium">
                        {highest ? `${formatLKR(highest.amount)}/${listing.unit}` : "—"}
                      </TableCell>
                      <TableCell>{bids.length}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[a.status]}>
                          {a.status === "pending" ? "pending approval" : a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                        {a.status === "live" ? (
                          <TimeLeft endTime={a.endTime} prefix="closes in " />
                        ) : (
                          <>
                            {formatDateTime(a.startTime)} → {formatDateTime(a.endTime)}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
