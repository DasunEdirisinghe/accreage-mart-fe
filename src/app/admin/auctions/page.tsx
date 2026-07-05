"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Gavel } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { reviewAuction } from "@/lib/services/auctions";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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

export default function AuctionApprovalsPage() {
  const db = useDB();
  const pending = db.auctions.filter((a) => a.status === "pending");

  return (
    <>
      <PageHeader
        title="Auction approvals"
        description="Only staff-approved auctions are scheduled and become visible to buyers (SRS 2.4 REQ-2/3/4)."
      />

      {pending.length === 0 ? (
        <EmptyState icon={Gavel} title="No auctions waiting" description="New auction requests from sellers will appear here." />
      ) : (
        <div className="mb-6 space-y-3">
          {pending.map((a) => {
            const listing = db.listings.find((l) => l.id === a.listingId)!;
            const seller = db.sellerProfiles.find((s) => s.id === listing.sellerId);
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{listing.image} {listing.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {seller?.businessName} · min bid {formatLKR(a.minBid)}/{listing.unit} ·{" "}
                      {formatDateTime(a.startTime)} → {formatDateTime(a.endTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => { reviewAuction(a.id, "scheduled"); toast.success("Auction approved & scheduled"); }}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { reviewAuction(a.id, "rejected"); toast.info("Auction rejected"); }}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Auction</TableHead>
                <TableHead>Min bid</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.auctions.map((a) => {
                const listing = db.listings.find((l) => l.id === a.listingId)!;
                const bids = db.bids.filter((b) => b.auctionId === a.id);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-56 pl-4">
                      <Link href={`/auctions/${a.id}`} className="block truncate font-medium text-primary hover:underline">
                        {listing.title}
                      </Link>
                    </TableCell>
                    <TableCell>{formatLKR(a.minBid)}/{listing.unit}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(a.startTime)} → {formatDateTime(a.endTime)}
                    </TableCell>
                    <TableCell>{bids.length}</TableCell>
                    <TableCell className="pr-4">
                      <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
