"use client";

import { Star, Flag, FlagOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { setReviewFlag, deleteReview } from "@/lib/services/engagement";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RatingStars } from "@/components/shared/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FeedbackModerationPage() {
  const db = useDB();

  return (
    <>
      <PageHeader
        title="Feedback moderation"
        description="AI sentiment analysis flags potentially abusive or unfair reviews for staff action (SRS 2.8)."
      />
      {db.reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" />
      ) : (
        <div className="space-y-4">
          {db.reviews.map((r) => {
            const seller = db.sellerProfiles.find((s) => s.id === r.sellerId);
            const buyer = db.buyerProfiles.find((b) => b.id === r.buyerId);
            return (
              <Card key={r.id} className={r.flagged ? "border-destructive/50" : undefined}>
                <CardContent className="p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        {buyer?.businessName} → {seller?.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Order {r.orderId} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={r.rating} />
                      <Badge
                        variant={
                          r.sentiment === "positive" ? "success" : r.sentiment === "negative" ? "destructive" : "muted"
                        }
                      >
                        AI: {r.sentiment}
                      </Badge>
                      {r.flagged && <Badge variant="destructive">flagged</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                  <div className="mt-3 flex gap-2">
                    {r.flagged ? (
                      <Button size="sm" variant="outline" onClick={() => { setReviewFlag(r.id, false); toast.success("Review restored"); }}>
                        <FlagOff className="h-3.5 w-3.5" /> Unflag
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setReviewFlag(r.id, true); toast.info("Review flagged & hidden from public"); }}>
                        <Flag className="h-3.5 w-3.5" /> Flag
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => { deleteReview(r.id); toast.info("Review deleted"); }}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
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
