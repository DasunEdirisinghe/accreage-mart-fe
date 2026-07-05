"use client";

import * as React from "react";
import { BrainCircuit, Users, Wallet, Package, Gavel } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { useDB } from "@/hooks/use-db";
import { formatLKR } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ForecastChart } from "@/components/shared/forecast-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function AdminReportsPage() {
  const db = useDB();
  const [commodity, setCommodity] = React.useState(db.forecasts[0].categoryId);
  const forecast = db.forecasts.find((f) => f.categoryId === commodity) ?? db.forecasts[0];

  const gmv = db.orders
    .filter((o) => ["paid", "completed"].includes(o.status))
    .reduce((s, o) => s + o.totalPrice, 0);

  const salesByCategory = db.categories
    .map((c) => {
      const total = db.orders
        .filter((o) => ["paid", "completed"].includes(o.status))
        .filter((o) => db.listings.find((l) => l.id === o.listingId)?.categoryId === c.id)
        .reduce((s, o) => s + o.totalPrice, 0);
      return { name: c.name.split(" ")[0], total: total / 1000 };
    })
    .filter((d) => d.total > 0);

  return (
    <>
      <PageHeader
        title="Platform reports"
        description="Sales, user activity and AI market analysis (SRS 2.7)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GMV" value={formatLKR(gmv)} icon={Wallet} sub="Paid & completed" />
        <StatCard label="Orders" value={String(db.orders.length)} icon={Package} sub={`${db.orders.filter((o) => o.status === "completed").length} completed`} />
        <StatCard label="Auction bids" value={String(db.bids.length)} icon={Gavel} sub={`${db.auctions.length} auctions`} />
        <StatCard label="Users" value={String(db.users.length)} icon={Users} sub={`${db.users.filter((u) => u.status === "active").length} active`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sales by category</CardTitle>
            <CardDescription>Paid & completed order value ('000 LKR)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByCategory} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 12% 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [`Rs. ${(v * 1000).toLocaleString()}`, "Sales"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total" fill="hsl(146 55% 30%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-primary" /> Market forecast
              </CardTitle>
              <CardDescription>Prophet · MAPE {forecast.mape}% · {forecast.unit}</CardDescription>
            </div>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger className="w-48">
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
            <ForecastChart forecast={forecast} height={280} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
