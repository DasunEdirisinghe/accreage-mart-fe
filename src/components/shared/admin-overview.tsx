"use client";

import Link from "next/link";
import {
  Users,
  Tags,
  Gavel,
  Receipt,
  ArrowRight,
  ClipboardCheck,
  Wallet,
  TriangleAlert,
} from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { formatLKR } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AdminOverview({
  registeredUsers,
  sellerCount,
  buyerCount,
}: {
  registeredUsers: number;
  sellerCount: number;
  buyerCount: number;
}) {
  const db = useDB();

  const pendingListings = db.listings.filter((l) => l.status === "pending");
  const pendingAuctions = db.auctions.filter((a) => a.status === "pending");
  const pendingProofs = db.paymentProofs.filter((p) => p.status === "submitted");
  const openInquiries = db.inquiries.filter((i) => i.status !== "resolved");
  const flaggedReviews = db.reviews.filter((r) => r.flagged);
  const gmv = db.orders
    .filter((o) => ["paid", "completed"].includes(o.status))
    .reduce((s, o) => s + o.totalPrice, 0);

  const queues = [
    { href: "/admin/approvals", icon: ClipboardCheck, label: "Listings awaiting approval", count: pendingListings.length, variant: "warning" as const },
    { href: "/admin/auctions", icon: Gavel, label: "Auctions awaiting approval", count: pendingAuctions.length, variant: "warning" as const },
    { href: "/admin/payments", icon: Receipt, label: "Payment proofs to review", count: pendingProofs.length, variant: "info" as const },
    { href: "/admin/inquiries", icon: TriangleAlert, label: "Open inquiries", count: openInquiries.length, variant: "info" as const },
    { href: "/admin/reviews", icon: TriangleAlert, label: "Flagged reviews", count: flaggedReviews.length, variant: "destructive" as const },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered users"
          value={String(registeredUsers)}
          icon={Users}
          sub={`${sellerCount} sellers · ${buyerCount} buyers`}
        />
        <StatCard label="Active listings" value={String(db.listings.filter((l) => l.status === "approved").length)} icon={Tags} sub={`${pendingListings.length} pending review`} />
        <StatCard label="Live auctions" value={String(db.auctions.filter((a) => a.status === "live").length)} icon={Gavel} sub={`${db.bids.length} total bids`} />
        <StatCard label="Platform GMV" value={formatLKR(gmv)} icon={Wallet} sub="Paid & completed orders" />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Action queues</CardTitle>
          <CardDescription>Items waiting on staff review, ordered by urgency.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {queues.map((q) => (
            <Link
              key={q.href + q.label}
              href={q.href}
              className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-secondary/50"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <q.icon className="h-4 w-4 text-primary" /> {q.label}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant={q.count > 0 ? q.variant : "muted"}>{q.count}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
