"use client";

import * as React from "react";
import Link from "next/link";
import { Gavel } from "lucide-react";

import { getBuyerBids } from "@/app/actions/auctions";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { BuyerBidItem } from "@/types/auctions.type";

export default function BuyerBidsPage() {
  const [items, setItems] = React.useState<BuyerBidItem[] | null>(null);

  React.useEffect(() => {
    getBuyerBids().then((data) => setItems(data?.items ?? []));
  }, []);

  return (
    <>
      <PageHeader title="My bids" description="Every auction you've bid on, across live and past auctions." />
      {items === null ? null : items.length === 0 ? (
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
                  <TableHead>Your best bid</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="pr-4">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.name}>
                    <TableCell className="max-w-60 pl-4">
                      <Link href={`/auctions/${b.name}`} className="block truncate font-medium text-primary hover:underline">
                        {b.listing.title}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {b.my_highest_bid ? `${formatLKR(b.my_highest_bid.amount)}/${b.listing.unit}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {b.my_highest_bid ? formatDateTime(b.my_highest_bid.bid_time) : "-"}
                    </TableCell>
                    <TableCell className="pr-4">
                      {b.status === "cancelled" ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : b.status === "ended" ? (
                        <Badge variant={b.leading ? "success" : "muted"}>{b.leading ? "Won" : "Lost"}</Badge>
                      ) : b.leading ? (
                        <Badge variant="success">Leading</Badge>
                      ) : (
                        <Badge variant="warning">Outbid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
