"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  Star,
  Package,
  ShoppingBag,
  CalendarDays,
  MessageSquare,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { getOrCreateThread } from "@/lib/services/engagement";
import { cn, formatDate, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/shared/stat-card";
import { ListingCard } from "@/components/shared/listing-card";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";

const SENTIMENT_BADGE: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  positive: { label: "Positive", variant: "success" },
  neutral: { label: "Neutral", variant: "secondary" },
  negative: { label: "Critical", variant: "destructive" },
};

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const router = useRouter();
  const { user, buyerProfile, loginAs } = useAuth();

  const seller = db.sellerProfiles.find((s) => s.id === id);

  if (!seller) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Seller not found</p>
        <Button variant="link" asChild>
          <Link href="/marketplace">Back to marketplace</Link>
        </Button>
      </div>
    );
  }

  const account = db.users.find((u) => u.id === seller.userId);
  const listings = db.listings.filter((l) => l.sellerId === seller.id && l.status === "approved");
  const reviews = db.reviews.filter((r) => r.sellerId === seller.id && !r.flagged);
  const avgRating =
    reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;

  const startChat = () => {
    if (!buyerProfile) {
      toast.info("Sign in as a buyer to chat with sellers.");
      loginAs("buyer");
      return;
    }
    getOrCreateThread(db, buyerProfile.id, seller.id);
    router.push("/buyer/chat");
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/marketplace">
          <ChevronLeft className="h-4 w-4" /> Marketplace
        </Link>
      </Button>

      {/* header */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary via-emerald-600 to-teal-500" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="-mt-16 h-24 w-24 shrink-0 border-4 border-card shadow-md">
                <AvatarImage
                  src={`https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(seller.businessName)}`}
                  alt={seller.businessName}
                />
                <AvatarFallback
                  className={cn(account?.avatarColor ?? "bg-primary", "text-3xl font-semibold text-white")}
                >
                  {initials(seller.businessName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
                  {seller.businessName}
                  {seller.verified && (
                    <Badge variant="info" className="gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {seller.location}, {seller.district}
                  </span>
                  {account && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> Member since {formatDate(account.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RatingStars rating={seller.trustScore} />
                  <span className="font-semibold text-foreground">{seller.trustScore.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    trust score · {seller.totalSales} sales
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={startChat} size="lg" className="shrink-0">
              <MessageSquare className="h-4 w-4" /> Chat with seller
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trust score" value={`${seller.trustScore.toFixed(1)} / 5`} icon={Star} sub="Dynamic rating" />
        <StatCard label="Completed sales" value={String(seller.totalSales)} icon={ShoppingBag} />
        <StatCard label="Active listings" value={String(listings.length)} icon={Package} />
        <StatCard
          label="Avg. review"
          value={avgRating ? avgRating.toFixed(1) : "-"}
          icon={Star}
          sub={`${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
        />
      </div>

      {/* about */}
      <div className="mt-8">
        <h2 className="mb-2 text-lg font-bold">About</h2>
        <p className="leading-relaxed text-muted-foreground">{seller.description}</p>
      </div>

      {/* listings */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">
          Listings from {seller.businessName}{" "}
          <span className="text-sm font-normal text-muted-foreground">({listings.length})</span>
        </h2>
        {listings.length === 0 ? (
          <EmptyState icon={Package} title="No active listings" description="This seller has no live listings right now." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} seller={seller} />
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* reviews */}
      <div>
        <h2 className="mb-4 text-lg font-bold">
          Reviews{" "}
          {avgRating && (
            <span className="text-sm font-normal text-muted-foreground">
              ({avgRating.toFixed(1)} · {reviews.length})
            </span>
          )}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet for this seller.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => {
              const buyer = db.buyerProfiles.find((b) => b.id === r.buyerId);
              const s = SENTIMENT_BADGE[r.sentiment];
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{buyer?.businessName ?? "Verified buyer"}</p>
                      <RatingStars rating={r.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(r.createdAt)} · verified purchase</span>
                      {s && (
                        <Badge variant={s.variant} className="ml-auto px-1.5 py-0 text-[10px]">
                          {s.label}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
