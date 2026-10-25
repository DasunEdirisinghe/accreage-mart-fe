"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Gavel, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { getReviewQueue } from "@/app/actions/listing-review";
import { cancelAuction, reviewAuction } from "@/app/actions/auctions";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewQueueItem } from "@/types/listing-review.type";

/** Pending Auction-type listings reuse the same staff queue /admin/approvals reads, narrowed
 * here so review decisions can go through api.auctions.review_auction (the auction-specific
 * endpoint Epic 07 built), which /admin/approvals's generic approve/reject does not use.
 * Already-approved auctions that are still scheduled or live are listed separately so staff
 * can cancel one with a reason via api.auctions.cancel_auction. */
export default function AuctionApprovalsPage() {
  const [pending, setPending] = React.useState<ReviewQueueItem[] | null>(null);
  const [active, setActive] = React.useState<ReviewQueueItem[] | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<ReviewQueueItem | null>(null);

  const load = React.useCallback(() => {
    Promise.all([
      getReviewQueue({ status: "Pending Approval" }),
      getReviewQueue({ status: "Approved" }),
    ]).then(([pendingQueue, approvedQueue]) => {
      setPending(pendingQueue.items.filter((item) => item.selling_type === "Auction"));
      setActive(
        approvedQueue.items.filter(
          (item) =>
            item.selling_type === "Auction" &&
            item.auction &&
            !item.auction.cancelled &&
            !item.auction.end_passed,
        ),
      );
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

  const nothingToShow = pending !== null && pending.length === 0 && active !== null && active.length === 0;

  return (
    <>
      <PageHeader
        title="Auction approvals"
        description="Only staff-approved auctions are scheduled and become visible to buyers."
      />

      {nothingToShow ? (
        <EmptyState
          icon={Gavel}
          title="No auctions to review"
          description="New auction requests from sellers, and scheduled or live auctions, will appear here."
        />
      ) : (
        <>
          {pending !== null && pending.length > 0 && (
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

          {active !== null && active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Scheduled &amp; live auctions</h2>
              {active.map((item) => {
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
                          {auction.start_passed ? "live" : "scheduled"} · ends {formatDateTime(auction.end_time)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="destructive" onClick={() => setCancelTarget(item)}>
                          <Ban className="h-4 w-4" /> Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <CancelAuctionDialog
        item={cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onCancelled={() => {
          setCancelTarget(null);
          load();
        }}
      />
    </>
  );
}

function CancelAuctionDialog({
  item,
  onOpenChange,
  onCancelled,
}: {
  item: ReviewQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (item) {
      setReason("");
      setError(null);
    }
  }, [item]);

  const canSubmit = !busy && reason.trim() !== "";

  const submit = async () => {
    if (!item?.auction) return;
    setBusy(true);
    setError(null);
    const res = await cancelAuction(item.auction.name, reason.trim());
    setBusy(false);
    if (res.ok) {
      toast.success("Auction cancelled");
      onCancelled();
    } else {
      setError(res.error ?? "Could not cancel the auction.");
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this auction?</DialogTitle>
          <DialogDescription>{item?.title}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Bidding stops immediately. The seller and every bidder are notified with your reason.
        </p>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason for cancellation *</Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this auction is being cancelled"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button variant="destructive" disabled={!canSubmit} onClick={submit}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Cancel auction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
