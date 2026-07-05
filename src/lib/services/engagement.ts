/**
 * Reviews, inquiries, chat and notifications, mock implementation
 * (SRS 2.8, 2.9, 2.10). WIRING LATER: Frappe resources Review, Inquiry,
 * Chat Message + frappe.realtime for live chat.
 */

import { mutate, nextId } from "@/lib/store";
import type { DB } from "@/lib/store";
import type { Sentiment, InquiryStatus } from "@/lib/types";

/* ------------------------------- reviews ------------------------------- */

/** Naive stand-in for the AI sentiment model (SRS 2.8 REQ-3). */
export function analyzeSentiment(text: string, rating: number): Sentiment {
  const negativeWords = ["bad", "poor", "late", "delay", "fraud", "worst", "cancel", "damaged", "rotten"];
  const hit = negativeWords.some((w) => text.toLowerCase().includes(w));
  if (rating <= 2 || hit) return "negative";
  if (rating >= 4) return "positive";
  return "neutral";
}

export function submitReview(
  orderId: string,
  sellerId: string,
  buyerId: string,
  rating: number,
  comment: string
): void {
  const sentiment = analyzeSentiment(comment, rating);
  mutate((db) => {
    db.reviews.unshift({
      id: nextId("r"),
      orderId,
      sellerId,
      buyerId,
      rating,
      comment,
      sentiment,
      flagged: sentiment === "negative" && rating <= 1,
      createdAt: new Date().toISOString(),
    });
    // dynamic trust score update (SRS 2.8 REQ-4)
    const seller = db.sellerProfiles.find((s) => s.id === sellerId);
    if (seller) {
      const ratings = db.reviews.filter((r) => r.sellerId === sellerId).map((r) => r.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      seller.trustScore = Math.round(avg * 10) / 10;
    }
  });
}

export function setReviewFlag(reviewId: string, flagged: boolean): void {
  mutate((db) => {
    const r = db.reviews.find((x) => x.id === reviewId);
    if (r) r.flagged = flagged;
  });
}

export function deleteReview(reviewId: string): void {
  mutate((db) => {
    db.reviews = db.reviews.filter((r) => r.id !== reviewId);
  });
}

/* ------------------------------ inquiries ------------------------------ */

export function submitInquiry(
  userId: string,
  subject: string,
  category: "Product" | "Order" | "Payment" | "Platform" | "Other",
  message: string
): void {
  mutate((db) => {
    db.inquiries.unshift({
      id: nextId("inq"),
      userId,
      subject,
      category,
      message,
      status: "open",
      createdAt: new Date().toISOString(),
    });
  });
}

export function updateInquiry(inquiryId: string, status: InquiryStatus, response?: string): void {
  mutate((db) => {
    const i = db.inquiries.find((x) => x.id === inquiryId);
    if (!i) return;
    i.status = status;
    if (response !== undefined) i.response = response;
  });
}

/* --------------------------------- chat -------------------------------- */

export function getOrCreateThread(db: DB, buyerId: string, sellerId: string, listingId?: string): string {
  const existing = db.chats.find((c) => c.buyerId === buyerId && c.sellerId === sellerId);
  if (existing) return existing.id;
  const id = nextId("ct");
  mutate((d) => {
    d.chats.push({ id, buyerId, sellerId, listingId, messages: [] });
  });
  return id;
}

export function sendMessage(threadId: string, senderId: string, text: string): void {
  mutate((db) => {
    const t = db.chats.find((c) => c.id === threadId);
    if (!t) return;
    t.messages.push({
      id: nextId("m"),
      senderId,
      text,
      sentAt: new Date().toISOString(),
    });
  });
}

/* ----------------------------- notifications ---------------------------- */

export function markNotificationsRead(userId: string): void {
  mutate((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
}
