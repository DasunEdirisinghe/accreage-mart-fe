"use client";

import * as React from "react";
import { BrainCircuit, TrendingUp, Wallet, Package, Star } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { formatLKR } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ForecastChart } from "@/components/shared/forecast-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function SellerReportsPage() {
  const db = useDB();
  const { sellerProfile } = useAuth();
  const [commodity, setCommodity] = React.useState(db.forecasts[0].categoryId);
  if (!sellerProfile) return null;

  const forecast = db.forecasts.find((f) => f.categoryId === commodity) ?? db.forecasts[0];
  const myOrders = db.orders.filter((o) => o.sellerId === sellerProfile.id);
  const paid = myOrders.filter((o) => ["paid", "completed"].includes(o.status));
  const revenue = paid.reduce((s, o) => s + o.totalPrice, 0);
  const avgOrder = paid.length ? revenue / paid.length : 0;

  // simple demand signal from the forecast tail
  const future = forecast.points.filter((p) => p.actual === undefined);
  const first = future[0]?.yhat ?? 0;
  const last = future[future.length - 1]?.yhat ?? 0;
  const trendPct = first ? ((last - first) / first) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Reports & AI insights"
        description="Sales performance and Prophet-powered market forecasts (SRS 2.6, 2.7)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatLKR(revenue)} icon={Wallet} sub={`${paid.length} paid orders`} />
        <StatCard label="Avg. order value" value={formatLKR(Math.round(avgOrder))} icon={Package} />
        <StatCard
          label="30-day price trend"
          value={`${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}%`}
          icon={TrendingUp}
          sub={forecast.commodity}
        />
        <StatCard label="Trust score" value={sellerProfile.trustScore.toFixed(1)} icon={Star} sub="Updated from verified reviews" />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-primary" /> Demand & price forecast
            </CardTitle>
            <CardDescription>
              Facebook Prophet · trained on daily wholesale prices with diesel-price regressor ·
              MAPE {forecast.mape}%
            </CardDescription>
          </div>
          <Select value={commodity} onValueChange={setCommodity}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {db.forecasts.map((f) => (
                <SelectItem key={f.categoryId} value={f.categoryId}>
                  {f.commodity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ForecastChart forecast={forecast} height={320} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="font-semibold">{forecast.modelVersion}</p>
            </div>
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Holdout accuracy (MAPE)</p>
              <p className="font-semibold">{forecast.mape}%</p>
            </div>
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs text-muted-foreground">30-day outlook</p>
              <p className="font-semibold">
                {trendPct >= 1 ? "Prices rising, consider holding stock" : trendPct <= -1 ? "Prices easing, sell sooner" : "Stable market"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sales & revenue report</CardTitle>
          <CardDescription>Generated from your transaction log (SRS 2.7 REQ-1).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myOrders.map((o) => {
                const listing = db.listings.find((l) => l.id === o.listingId);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="max-w-52">
                      <span className="block truncate">{listing?.title}</span>
                    </TableCell>
                    <TableCell>
                      {o.quantity.toLocaleString()} {listing?.unit}
                    </TableCell>
                    <TableCell className="font-medium">{formatLKR(o.totalPrice)}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{o.status.replace(/_/g, " ")}</Badge>
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
