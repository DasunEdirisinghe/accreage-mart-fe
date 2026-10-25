"use client";

import * as React from "react";
import Link from "next/link";
import { Gavel, Plus } from "lucide-react";

import { getSellerAuctions } from "@/app/actions/auctions";
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
import type { SellerAuctionItem } from "@/types/auctions.type";

const STATUS_VARIANT = {
  pending: "warning",
  scheduled: "info",
  live: "accent",
  ended: "muted",
  rejected: "destructive",
  cancelled: "destructive",
} as const;

export default function SellerAuctionsPage() {
  const [items, setItems] = React.useState<SellerAuctionItem[] | null>(null);

  React.useEffect(() => {
    getSellerAuctions().then((data) => setItems(data?.items ?? []));
  }, []);

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

      {items === null ? null : items.length === 0 ? (
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
                {items.map((a) => (
                  <TableRow key={a.name}>
                    <TableCell className="max-w-56 pl-4">
                      <Link href={`/auctions/${a.name}`} className="block truncate font-medium text-primary hover:underline">
                        {a.listing.title}
                      </Link>
                    </TableCell>
                    <TableCell>{formatLKR(a.min_bid)}/{a.listing.unit}</TableCell>
                    <TableCell className="font-medium">
                      {a.highest_bid ? `${formatLKR(a.highest_bid.amount)}/${a.listing.unit}` : "-"}
                    </TableCell>
                    <TableCell>{a.bid_count}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[a.status]}>
                        {a.status === "pending" ? "pending approval" : a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                      {a.status === "live" ? (
                        <TimeLeft endTime={a.end_time} prefix="closes in " />
                      ) : (
                        <>
                          {formatDateTime(a.start_time)} → {formatDateTime(a.end_time)}
                        </>
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
