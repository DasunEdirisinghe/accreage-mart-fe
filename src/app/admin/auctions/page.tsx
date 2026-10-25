"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Gavel } from "lucide-react";
import { toast } from "sonner";

import { getReviewQueue } from "@/app/actions/listing-review";
import { reviewAuction } from "@/app/actions/auctions";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewQueueItem } from "@/types/listing-review.type";

/** Pending Auction-type listings only — the same staff queue /admin/approvals reads,
 * narrowed here so review decisions can go through api.auctions.review_auction (the
 * auction-specific endpoint Epic 07 built), which /admin/approvals's generic
 * approve/reject does not use. */
export default function AuctionApprovalsPage() {
  const [pending, setPending] = React.useState<ReviewQueueItem[] | null>(null);

  const load = React.useCallback(() => {
    getReviewQueue({ status: "Pending Approval" }).then((data) => {
      setPending(data.items.filter((item) => item.selling_type === "Auction"));
    });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const decide = async (auctionName: string, decision: "approve" | "reject") => {
    const res = await reviewAuction(auctionName, decision);
    if (res.ok) {
      toast.success(decision === "approve" ? "Auction approved & scheduled" : "Auction rejected");
      load();
    } else {
      toast.error("Could not update the auction", { description: res.error });
    }
  };

  return (
    <>
      <PageHeader
        title="Auction approvals"
        description="Only staff-approved auctions are scheduled and become visible to buyers."
      />

      {pending === null ? null : pending.length === 0 ? (
        <EmptyState icon={Gavel} title="No auctions waiting" description="New auction requests from sellers will appear here." />
      ) : (
        <div className="mb-6 space-y-3">
          {pending.map((item) => {
            const auction = item.auction!;
            return (
              <Card key={item.name}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Link href={`/auctions/${auction.name}`} className="font-semibold hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.seller_business_name} · min bid {formatLKR(auction.min_bid)}/{item.unit} ·{" "}
                      {formatDateTime(auction.start_time)} → {formatDateTime(auction.end_time)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => decide(auction.name, "approve")}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => decide(auction.name, "reject")}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
