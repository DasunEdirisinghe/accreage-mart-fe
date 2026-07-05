"use client";

import Link from "next/link";
import { Package, Tags, Wallet, Star, ArrowRight, Plus, BrainCircuit } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT } from "@/lib/services/orders";
import { formatLKR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ForecastChart } from "@/components/shared/forecast-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function SellerDashboard() {
  const db = useDB();
  const { user, sellerProfile } = useAuth();
  if (!sellerProfile) return null;

  const myListings = db.listings.filter((l) => l.sellerId === sellerProfile.id);
  const myOrders = db.orders.filter((o) => o.sellerId === sellerProfile.id);
  const revenue = myOrders
    .filter((o) => ["paid", "completed"].includes(o.status))
    .reduce((s, o) => s + o.totalPrice, 0);
  const pendingActions =
    myOrders.filter((o) => o.status === "pending_confirmation").length +
    db.paymentProofs.filter(
      (p) => p.status === "submitted" && myOrders.some((o) => o.id === p.orderId)
    ).length;
  const forecast = db.forecasts[0];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name.split(" ")[0]}`}
        description={`${sellerProfile.businessName} · trust score ${sellerProfile.trustScore.toFixed(1)}/5.0`}
      >
        <Button asChild>
          <Link href="/seller/listings/new">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active listings" value={String(myListings.filter((l) => l.status === "approved").length)} icon={Tags} sub={`${myListings.length} total`} />
        <StatCard label="Orders to action" value={String(pendingActions)} icon={Package} sub="Confirmations + payment reviews" />
        <StatCard label="Revenue" value={formatLKR(revenue)} icon={Wallet} sub="Paid & completed" />
        <StatCard label="Trust score" value={sellerProfile.trustScore.toFixed(1)} icon={Star} sub={`${sellerProfile.totalSales} completed sales`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* forecast */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-primary" />
              Price forecast — {forecast.commodity}
            </CardTitle>
            <CardDescription>
              Facebook Prophet · 30-day forecast with 90% interval · MAPE {forecast.mape}% ·{" "}
              {forecast.unit}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastChart forecast={forecast} />
            <p className="mt-2 text-xs text-muted-foreground">
              Solid line: actual market price. Dashed: model forecast. Use{" "}
              <Link href="/seller/reports" className="text-primary hover:underline">
                Reports &amp; AI
              </Link>{" "}
              for all commodities.
            </p>
          </CardContent>
        </Card>

        {/* recent orders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Incoming orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seller/orders">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myOrders.slice(0, 5).map((o) => {
              const listing = db.listings.find((l) => l.id === o.listingId);
              const buyer = db.buyerProfiles.find((b) => b.id === o.buyerId);
              return (
                <Link
                  key={o.id}
                  href={`/seller/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listing?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {buyer?.businessName} · {formatLKR(o.totalPrice)}
                    </p>
                  </div>
                  <Badge variant={ORDER_STATUS_VARIANT[o.status]} className="shrink-0">
                    {ORDER_STATUS_LABEL[o.status].split(" — ")[0]}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* listings snapshot */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Listing status</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/listings">
              Manage listings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myListings.slice(0, 5).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="max-w-64">
                    <span className="block truncate font-medium">
                      {l.image} {l.title}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{l.sellingType}</TableCell>
                  <TableCell>
                    {l.quantityAvailable.toLocaleString()} {l.unit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.status === "approved" ? "success" : l.status === "pending" ? "warning" : "destructive"
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(l.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
