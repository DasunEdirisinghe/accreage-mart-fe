"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Receipt, FileText } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { reviewPaymentProof } from "@/lib/services/orders";
import { formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PaymentReviewPage() {
  const db = useDB();
  const submitted = db.paymentProofs.filter((p) => p.status === "submitted");
  const history = db.paymentProofs.filter((p) => p.status !== "submitted");

  const renderProof = (id: string, actions: boolean) => {
    const p = db.paymentProofs.find((x) => x.id === id)!;
    const order = db.orders.find((o) => o.id === p.orderId);
    const buyer = order ? db.buyerProfiles.find((b) => b.id === order.buyerId) : null;
    const seller = order ? db.sellerProfiles.find((s) => s.id === order.sellerId) : null;
    return (
      <Card key={p.id}>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <FileText className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.fileName}</p>
            <p className="text-sm text-muted-foreground">
              Order{" "}
              <Link href={`/seller/orders/${p.orderId}`} className="font-mono text-primary hover:underline">
                {p.orderId}
              </Link>{" "}
              · {buyer?.businessName} → {seller?.businessName}
              {order && ` · ${formatLKR(order.totalPrice)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Submitted {formatDateTime(p.submittedAt)}
              {p.note && ` · "${p.note}"`}
            </p>
          </div>
          {actions ? (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={() => { reviewPaymentProof(p.id, "approved"); toast.success("Payment approved, order marked paid"); }}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { reviewPaymentProof(p.id, "rejected"); toast.info("Proof rejected, buyer asked to re-upload"); }}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          ) : (
            <Badge variant={p.status === "approved" ? "success" : "destructive"} className="shrink-0">
              {p.status}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Payment proof review"
        description="Manual payment verification for phase 1, approve valid bank slips to release orders (SRS 2.5 REQ-6)."
      />
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">To review ({submitted.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-4 space-y-3">
          {submitted.length === 0 ? (
            <EmptyState icon={Receipt} title="No proofs waiting" description="Uploaded payment proofs will appear here for verification." />
          ) : (
            submitted.map((p) => renderProof(p.id, true))
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4 space-y-3">
          {history.map((p) => renderProof(p.id, false))}
        </TabsContent>
      </Tabs>
    </>
  );
}
