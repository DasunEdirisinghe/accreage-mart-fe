"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Star,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import {
  getOrderDetails,
  setOrderStatus,
  uploadPaymentProof,
  reviewPaymentProof,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VARIANT,
} from "@/lib/services/orders";
import { submitReview } from "@/lib/services/engagement";
import { cn, formatLKR, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const STEPS = ["pending_confirmation", "confirmed", "payment_review", "paid", "completed"] as const;

/** Shared order detail for buyer and seller (SRS 2.5). */
export function OrderDetailView({
  orderId,
  perspective,
  backHref,
}: {
  orderId: string;
  perspective: "buyer" | "seller";
  backHref: string;
}) {
  const db = useDB();
  const details = getOrderDetails(db, orderId);

  const [fileName, setFileName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");

  if (!details) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Order not found</p>
        <Button variant="link" asChild>
          <Link href={backHref}>Back to orders</Link>
        </Button>
      </div>
    );
  }

  const { order, listing, buyerName, sellerName, proof } = details;
  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "cancelled";
  const existingReview = db.reviews.find((r) => r.orderId === order.id);

  const upload = () => {
    uploadPaymentProof(order.id, fileName || "payment-slip.jpg", note || undefined);
    toast.success("Payment proof submitted", {
      description: "The seller will review it and confirm your payment.",
    });
    setFileName("");
    setNote("");
  };

  const review = (decision: "approved" | "rejected") => {
    if (!proof) return;
    reviewPaymentProof(proof.id, decision);
    toast.success(decision === "approved" ? "Payment approved — invoice generated" : "Payment proof rejected");
  };

  const sendReview = () => {
    submitReview(order.id, order.sellerId, order.buyerId, rating, comment);
    toast.success("Review submitted", { description: "Thanks — this updates the seller's trust score." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={backHref}>
            <ChevronLeft className="h-4 w-4" /> Orders
          </Link>
        </Button>
        <Badge variant={ORDER_STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Order {order.id}</h1>
        <p className="text-sm text-muted-foreground">
          Placed {formatDateTime(order.createdAt)} · {perspective === "buyer" ? `Seller: ${sellerName}` : `Buyer: ${buyerName}`}
        </p>
      </div>

      {/* progress */}
      {!cancelled && (
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                    i <= stepIdx
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <span className="hidden text-[10px] text-muted-foreground sm:block">
                  {ORDER_STATUS_LABEL[s].split(" — ")[0]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mb-4 h-0.5 flex-1", i < stepIdx ? "bg-primary" : "bg-muted")} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* line item */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br text-3xl",
                    listing.imageGradient
                  )}
                >
                  {listing.image}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="font-semibold hover:text-primary hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {order.quantity.toLocaleString()} {listing.unit} × {formatLKR(order.unitPrice)}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary">{formatLKR(order.totalPrice)}</p>
              </div>
              {order.invoiceNo && (
                <>
                  <Separator className="my-4" />
                  <p className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-primary" />
                    Invoice <span className="font-mono font-medium">{order.invoiceNo}</span>
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => toast.info("Invoice PDF download will be generated by the Frappe backend.") }>
                      Download PDF
                    </Button>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* payment proof section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment proof</CardTitle>
              <CardDescription>
                Payments are settled directly (bank transfer / cash). Proof is verified manually
                in this phase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proof ? (
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <FileText className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{proof.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(proof.submittedAt)}
                      {proof.note && ` · "${proof.note}"`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      proof.status === "approved"
                        ? "success"
                        : proof.status === "rejected"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {proof.status}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment proof uploaded yet.</p>
              )}

              {/* buyer: upload */}
              {perspective === "buyer" &&
                ["confirmed", "payment_review"].includes(order.status) &&
                proof?.status !== "submitted" && (
                  <div className="space-y-3 rounded-md bg-secondary/50 p-4">
                    <p className="text-sm font-medium">Upload payment proof</p>
                    <div className="space-y-2">
                      <Label>File name (demo — no real upload)</Label>
                      <Input
                        placeholder="e.g. boc-transfer-slip.jpg"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Input
                        placeholder="Reference number, remarks…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={upload}>
                      <Upload className="h-4 w-4" /> Submit proof
                    </Button>
                  </div>
                )}

              {/* seller: review */}
              {perspective === "seller" && proof?.status === "submitted" && (
                <div className="flex gap-2">
                  <Button onClick={() => review("approved")}>
                    <CheckCircle2 className="h-4 w-4" /> Approve payment
                  </Button>
                  <Button variant="destructive" onClick={() => review("rejected")}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* buyer: review after paid/completed */}
          {perspective === "buyer" && ["paid", "completed"].includes(order.status) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rate this transaction</CardTitle>
                <CardDescription>
                  Verified-purchase reviews update the seller&apos;s trust score. Reviews run
                  through AI sentiment analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingReview ? (
                  <p className="text-sm text-muted-foreground">
                    You reviewed this order ({existingReview.rating}/5). Thank you!
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} onClick={() => setRating(i)} type="button">
                          <Star
                            className={cn(
                              "h-7 w-7 transition-colors",
                              i <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="How was the produce quality, communication and delivery?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button onClick={sendReview} disabled={rating === 0 || !comment.trim()}>
                      Submit review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* actions sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {perspective === "seller" && order.status === "pending_confirmation" && (
                <>
                  <Button onClick={() => { setOrderStatus(order.id, "confirmed"); toast.success("Order confirmed — buyer notified to make payment"); }}>
                    Confirm order
                  </Button>
                  <Button variant="destructive" onClick={() => { setOrderStatus(order.id, "cancelled"); toast.info("Order cancelled"); }}>
                    Decline order
                  </Button>
                </>
              )}
              {perspective === "seller" && order.status === "paid" && (
                <Button onClick={() => { setOrderStatus(order.id, "completed"); toast.success("Order marked completed"); }}>
                  Mark as completed
                </Button>
              )}
              {perspective === "buyer" && ["pending_confirmation", "confirmed"].includes(order.status) && (
                <Button variant="destructive" onClick={() => { setOrderStatus(order.id, "cancelled"); toast.info("Order cancelled"); }}>
                  Cancel order
                </Button>
              )}
              {cancelled && <p className="text-sm text-muted-foreground">This order was cancelled.</p>}
              {!cancelled &&
                order.status === "completed" && (
                  <p className="text-sm text-muted-foreground">Order complete. No further actions.</p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current status</span>
                <span className="font-medium">{ORDER_STATUS_LABEL[order.status]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placed</span>
                <span className="font-medium">{formatDateTime(order.createdAt)}</span>
              </div>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                Status changes trigger email + SMS alerts via Gmail SMTP and Send.lk in
                production.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
