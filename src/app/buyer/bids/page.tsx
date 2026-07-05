"use client";

import Link from "next/link";
import { Gavel } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function BuyerBidsPage() {
  const db = useDB();
  const { buyerProfile } = useAuth();
  if (!buyerProfile) return null;

  const myBids = db.bids
    .filter((b) => b.buyerId === buyerProfile.id)
    .sort((a, b) => b.bidTime.localeCompare(a.bidTime));

  return (
    <>
      <PageHeader title="My bids" description="Every bid you've placed across live and past auctions." />
      {myBids.length === 0 ? (
        <EmptyState icon={Gavel} title="No bids yet" description="Join a live auction to start bidding.">
          <Button asChild>
            <Link href="/auctions">View live auctions</Link>
          </Button>
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Auction lot</TableHead>
                  <TableHead>Your bid</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="pr-4">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBids.map((b) => {
                  const auction = db.auctions.find((a) => a.id === b.auctionId)!;
                  const listing = db.listings.find((l) => l.id === auction.listingId)!;
                  const highest = db.bids
                    .filter((x) => x.auctionId === b.auctionId)
                    .sort((x, y) => y.amount - x.amount)[0];
                  const leading = highest?.id === b.id;
                  const won = auction.winnerBidId === b.id;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="max-w-60 pl-4">
                        <Link href={`/auctions/${auction.id}`} className="block truncate font-medium text-primary hover:underline">
                          {listing.title}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatLKR(b.amount)}/{listing.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(b.bidTime)}</TableCell>
                      <TableCell className="pr-4">
                        {won ? (
                          <Badge variant="success">Won</Badge>
                        ) : auction.status === "ended" ? (
                          <Badge variant="muted">Lost</Badge>
                        ) : leading ? (
                          <Badge variant="success">Leading</Badge>
                        ) : (
                          <Badge variant="warning">Outbid</Badge>
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
