/**
 * Order & payment-proof service, mock implementation (SRS 2.5).
 * WIRING LATER:
 *   POST /api/resource/Order
 *   PUT  /api/resource/Order/<id>
 *   POST /api/method/accreage.api.upload_payment_proof (multipart)
 */

import { mutate, nextId } from "@/lib/store";
import type { DB } from "@/lib/store";
import type { Order, OrderStatus, PaymentProof, Listing } from "@/lib/types";

export interface OrderDetails {
  order: Order;
  listing: Listing;
  buyerName: string;
  sellerName: string;
  proof: PaymentProof | null;
}

export function getOrderDetails(db: DB, orderId: string): OrderDetails | null {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const listing = db.listings.find((l) => l.id === order.listingId)!;
  const buyer = db.buyerProfiles.find((b) => b.id === order.buyerId);
  const seller = db.sellerProfiles.find((s) => s.id === order.sellerId);
  const proof =
    db.paymentProofs
      .filter((p) => p.orderId === orderId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ?? null;
  return {
    order,
    listing,
    buyerName: buyer?.businessName ?? "Unknown buyer",
    sellerName: seller?.businessName ?? "Unknown seller",
    proof,
  };
}

/** REQ 2.5-1: quantity must meet the seller's minimum. */
export function placeOrder(
  listingId: string,
  buyerProfileId: string,
  quantity: number
): { ok: boolean; orderId?: string; error?: string } {
  let result: { ok: boolean; orderId?: string; error?: string } = { ok: false };
  mutate((db) => {
    const listing = db.listings.find((l) => l.id === listingId);
    if (!listing || listing.status !== "approved") {
      result = { ok: false, error: "Listing is not available." };
      return;
    }
    if (quantity < listing.minOrderQty) {
      result = {
        ok: false,
        error: `Minimum order quantity is ${listing.minOrderQty} ${listing.unit}.`,
      };
      return;
    }
    if (quantity > listing.quantityAvailable) {
      result = {
        ok: false,
        error: `Only ${listing.quantityAvailable} ${listing.unit} available.`,
      };
      return;
    }
    const id = nextId("o");
    db.orders.unshift({
      id,
      listingId,
      buyerId: buyerProfileId,
      sellerId: listing.sellerId,
      quantity,
      unitPrice: listing.pricePerUnit,
      totalPrice: quantity * listing.pricePerUnit,
      status: "pending_confirmation",
      createdAt: new Date().toISOString(),
    });
    const seller = db.sellerProfiles.find((s) => s.id === listing.sellerId);
    if (seller) {
      db.notifications.unshift({
        id: nextId("n"),
        userId: seller.userId,
        type: "order",
        message: `New order ${id} received for ${listing.title} (${quantity} ${listing.unit}).`,
        channel: "in_app",
        read: false,
        sentAt: new Date().toISOString(),
      });
    }
    result = { ok: true, orderId: id };
  });
  return result;
}

export function setOrderStatus(orderId: string, status: OrderStatus): void {
  mutate((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return;
    o.status = status;
    if (status === "completed" && !o.invoiceNo) {
      o.invoiceNo = `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    }
  });
}

/** Buyer uploads a payment proof → order moves to payment_review (REQ 2.5-5). */
export function uploadPaymentProof(orderId: string, fileName: string, note?: string): void {
  mutate((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return;
    db.paymentProofs.push({
      id: nextId("pp"),
      orderId,
      fileName,
      note,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
    o.status = "payment_review";
  });
}

/** Seller/staff reviews the proof (REQ 2.5-6). Approval finalises stock + invoice. */
export function reviewPaymentProof(proofId: string, decision: "approved" | "rejected"): void {
  mutate((db) => {
    const proof = db.paymentProofs.find((p) => p.id === proofId);
    if (!proof) return;
    proof.status = decision;
    proof.reviewedAt = new Date().toISOString();
    const order = db.orders.find((o) => o.id === proof.orderId);
    if (!order) return;
    if (decision === "approved") {
      order.status = "paid";
      order.invoiceNo = order.invoiceNo ?? `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const listing = db.listings.find((l) => l.id === order.listingId);
      if (listing) {
        listing.quantityAvailable = Math.max(0, listing.quantityAvailable - order.quantity);
      }
    } else {
      order.status = "confirmed"; // buyer must re-upload
    }
    const buyer = db.buyerProfiles.find((b) => b.id === order.buyerId);
    if (buyer) {
      db.notifications.unshift({
        id: nextId("n"),
        userId: buyer.userId,
        type: "payment",
        message:
          decision === "approved"
            ? `Payment for order ${order.id} approved. Invoice ${order.invoiceNo} generated.`
            : `Payment proof for order ${order.id} was rejected. Please re-upload.`,
        channel: "in_app",
        read: false,
        sentAt: new Date().toISOString(),
      });
    }
  });
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "Pending confirmation",
  confirmed: "Confirmed, awaiting payment",
  payment_review: "Payment under review",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  "success" | "warning" | "info" | "muted" | "destructive"
> = {
  pending_confirmation: "warning",
  confirmed: "info",
  payment_review: "warning",
  paid: "success",
  completed: "success",
  cancelled: "destructive",
};
