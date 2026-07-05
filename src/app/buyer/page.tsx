"use client";

import Link from "next/link";
import { Package, Gavel, Star, Wallet, ArrowRight } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT } from "@/lib/services/orders";
import { formatLKR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ListingCard } from "@/components/shared/listing-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function BuyerDashboard() {
  const db = useDB();
  const { user, buyerProfile } = useAuth();
  if (!buyerProfile) return null;

  const myOrders = db.orders.filter((o) => o.buyerId === buyerProfile.id);
  const active = myOrders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const myBids = db.bids.filter((b) => b.buyerId === buyerProfile.id);
  const liveBids = myBids.filter((b) => {
    const a = db.auctions.find((x) => x.id === b.auctionId);
    return a?.status === "live";
  });
  const spend = myOrders
    .filter((o) => ["paid", "completed"].includes(o.status))
    .reduce((s, o) => s + o.totalPrice, 0);
  const myReviews = db.reviews.filter((r) => r.buyerId === buyerProfile.id);

  const recommended = db.listings.filter((l) => l.status === "approved").slice(0, 4);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name.split(" ")[0]}`}
        description={`${buyerProfile.businessName} · ${buyerProfile.buyerType}`}
      >
        <Button asChild>
          <Link href="/marketplace">Browse marketplace</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active orders" value={String(active.length)} icon={Package} sub={`${myOrders.length} total orders`} />
        <StatCard label="Live bids" value={String(liveBids.length)} icon={Gavel} sub={`${myBids.length} bids placed`} />
        <StatCard label="Total spend" value={formatLKR(spend)} icon={Wallet} sub="Paid & completed orders" />
        <StatCard label="Reviews given" value={String(myReviews.length)} icon={Star} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/buyer/orders">
                All orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myOrders.slice(0, 5).map((o) => {
                  const listing = db.listings.find((l) => l.id === o.listingId);
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/buyer/orders/${o.id}`} className="hover:text-primary hover:underline">
                          <span className="font-medium">{listing?.title.slice(0, 28)}…</span>
                          <span className="block text-xs text-muted-foreground">
                            {o.id} · {formatDate(o.createdAt)}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{formatLKR(o.totalPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={ORDER_STATUS_VARIANT[o.status]}>
                          {ORDER_STATUS_LABEL[o.status].split(", ")[0]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Your auction activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auctions">
                Auctions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myBids.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You haven&apos;t placed any bids yet.
              </p>
            )}
            {Array.from(new Set(myBids.map((b) => b.auctionId))).map((aid) => {
              const a = db.auctions.find((x) => x.id === aid)!;
              const listing = db.listings.find((l) => l.id === a.listingId)!;
              const highest = db.bids
                .filter((b) => b.auctionId === aid)
                .sort((x, y) => y.amount - x.amount)[0];
              const mine = db.bids
                .filter((b) => b.auctionId === aid && b.buyerId === buyerProfile.id)
                .sort((x, y) => y.amount - x.amount)[0];
              const leading = highest?.buyerId === buyerProfile.id;
              return (
                <Link
                  key={aid}
                  href={`/auctions/${aid}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Your bid {formatLKR(mine.amount)}/{listing.unit}
                    </p>
                  </div>
                  {a.status === "live" ? (
                    <Badge variant={leading ? "success" : "warning"}>
                      {leading ? "Leading" : "Outbid"}
                    </Badge>
                  ) : (
                    <Badge variant="muted">{a.status}</Badge>
                  )}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Recommended for you</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {recommended.map((l) => (
            <ListingCard key={l.id} listing={l} seller={db.sellerProfiles.find((s) => s.id === l.sellerId)} />
          ))}
        </div>
      </div>
    </>
  );
}
