"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  Gavel,
  MessageSquare,
  ShoppingCart,
  BrainCircuit,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { getListingDetails } from "@/lib/services/listings";
import { placeOrder } from "@/lib/services/orders";
import { getOrCreateThread } from "@/lib/services/engagement";
import { cn, formatLKR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RatingStars } from "@/components/shared/rating-stars";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const router = useRouter();
  const { user, buyerProfile, loginAs } = useAuth();

  const details = getListingDetails(db, id);
  const [qty, setQty] = React.useState("");
  const [open, setOpen] = React.useState(false);

  if (!details) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Listing not found</p>
        <Button variant="link" asChild>
          <Link href="/marketplace">Back to marketplace</Link>
        </Button>
      </div>
    );
  }

  const { listing, seller, category, avgRating, reviewCount } = details;
  const auction = db.auctions.find((a) => a.listingId === listing.id);
  const reviews = db.reviews.filter((r) => r.sellerId === seller.id && !r.flagged);

  const total = qty ? Number(qty) * listing.pricePerUnit : 0;

  const handleOrder = () => {
    if (!buyerProfile) return;
    const res = placeOrder(listing.id, buyerProfile.id, Number(qty));
    if (res.ok) {
      toast.success(`Order ${res.orderId} placed`, {
        description: "The seller has been notified and will confirm shortly.",
      });
      setOpen(false);
      router.push(`/buyer/orders/${res.orderId}`);
    } else {
      toast.error("Could not place order", { description: res.error });
    }
  };

  const startChat = () => {
    if (!buyerProfile) {
      toast.info("Sign in as a buyer to chat with sellers.");
      return;
    }
    getOrCreateThread(db, buyerProfile.id, seller.id, listing.id);
    router.push("/buyer/chat");
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/marketplace">
          <ChevronLeft className="h-4 w-4" /> Marketplace
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* main */}
        <div className="space-y-6">
          <div
            className={cn(
              "flex h-64 items-center justify-center rounded-xl bg-gradient-to-br text-8xl sm:h-80",
              listing.imageGradient
            )}
          >
            {listing.image}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {category.icon} {category.name}
              </Badge>
              {listing.sellingType === "auction" ? (
                <Badge variant="accent">
                  <Gavel className="mr-1 h-3 w-3" /> Auction listing
                </Badge>
              ) : (
                <Badge variant="secondary">Direct sale</Badge>
              )}
              {listing.organic && <Badge variant="success">Organic</Badge>}
              {listing.certification && (
                <Badge variant="info">
                  <BadgeCheck className="mr-1 h-3 w-3" /> {listing.certification}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {listing.location}, {listing.district} district ·
              listed {formatDate(listing.createdAt)}
            </p>
          </div>

          <p className="leading-relaxed text-muted-foreground">{listing.description}</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "Available", v: `${listing.quantityAvailable.toLocaleString()} ${listing.unit}` },
              { k: "Min. order", v: `${listing.minOrderQty} ${listing.unit}` },
              { k: "Unit", v: listing.unit },
              { k: "Type", v: listing.sellingType === "direct" ? "Direct" : "Auction" },
            ].map((item) => (
              <Card key={item.k}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{item.k}</p>
                  <p className="font-semibold capitalize">{item.v}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* reviews */}
          <div>
            <h2 className="mb-3 text-lg font-bold">
              Seller reviews {avgRating && <span className="text-sm font-normal text-muted-foreground">({avgRating.toFixed(1)} · {reviewCount})</span>}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet for this seller.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const buyer = db.buyerProfiles.find((b) => b.id === r.buyerId);
                  return (
                    <Card key={r.id}>
                      <CardContent className="p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-semibold">{buyer?.businessName ?? "Verified buyer"}</p>
                          <RatingStars rating={r.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground">{r.comment}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(r.createdAt)} · verified purchase</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              {listing.sellingType === "direct" ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Wholesale price</p>
                    <p className="text-3xl font-extrabold text-primary">
                      {formatLKR(listing.pricePerUnit)}
                      <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
                    </p>
                  </div>
                  {listing.aiSuggestedPrice && (
                    <p className="flex items-center gap-1.5 rounded-md bg-secondary p-2.5 text-xs text-secondary-foreground">
                      <BrainCircuit className="h-4 w-4 shrink-0 text-primary" />
                      AI market range: {formatLKR(listing.aiSuggestedPrice.min)} – {formatLKR(listing.aiSuggestedPrice.max)} per {listing.unit}
                    </p>
                  )}
                  <Separator />
                  {user?.role === "buyer" ? (
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          <ShoppingCart className="h-4 w-4" /> Place order
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Place wholesale order</DialogTitle>
                          <DialogDescription>
                            {listing.title} — minimum {listing.minOrderQty} {listing.unit}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Quantity ({listing.unit})</Label>
                            <Input
                              type="number"
                              min={listing.minOrderQty}
                              placeholder={String(listing.minOrderQty)}
                              value={qty}
                              onChange={(e) => setQty(e.target.value)}
                            />
                          </div>
                          {total > 0 && (
                            <p className="rounded-md bg-secondary p-3 text-sm">
                              Estimated total:{" "}
                              <span className="font-bold text-primary">{formatLKR(total)}</span>
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleOrder} disabled={!qty}>
                            Confirm order
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button className="w-full" size="lg" onClick={() => loginAs("buyer")}>
                      Sign in as buyer to order
                    </Button>
                  )}
                </>
              ) : auction ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Sold via live auction</p>
                    <p className="text-2xl font-extrabold text-primary">
                      From {formatLKR(auction.minBid)}
                      <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
                    </p>
                  </div>
                  <Button className="w-full" size="lg" variant="accent" asChild>
                    <Link href={`/auctions/${auction.id}`}>
                      <Gavel className="h-4 w-4" /> Go to auction
                    </Link>
                  </Button>
                </>
              ) : null}
              <Button variant="outline" className="w-full" onClick={startChat}>
                <MessageSquare className="h-4 w-4" /> Chat with seller
              </Button>
            </CardContent>
          </Card>

          {/* seller card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="flex items-center gap-1.5 font-semibold">
                {seller.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
                {seller.businessName}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <RatingStars rating={seller.trustScore} />
                <span className="font-medium">{seller.trustScore.toFixed(1)}</span>
                <span className="text-muted-foreground">trust score</span>
              </div>
              <p className="text-sm text-muted-foreground">{seller.description}</p>
              <p className="text-xs text-muted-foreground">
                {seller.totalSales} completed sales · {seller.location}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
