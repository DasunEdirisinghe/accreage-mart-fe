"use client";

import { Star } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RatingStars } from "@/components/shared/rating-stars";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BuyerReviewsPage() {
  const db = useDB();
  const { buyerProfile } = useAuth();
  if (!buyerProfile) return null;

  const myReviews = db.reviews.filter((r) => r.buyerId === buyerProfile.id);

  return (
    <>
      <PageHeader
        title="My reviews"
        description="Reviews you've left after verified purchases. Each review runs through AI sentiment analysis."
      />
      {myReviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="After an order is paid or completed you can rate the seller from the order page."
        />
      ) : (
        <div className="space-y-4">
          {myReviews.map((r) => {
            const seller = db.sellerProfiles.find((s) => s.id === r.sellerId);
            return (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{seller?.businessName}</p>
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
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
