/**
 * Listing service — mock implementation.
 * WIRING LATER: replace each function body with a Frappe REST call, e.g.
 *   GET  /api/resource/Listing?filters=[["status","=","approved"]]
 *   POST /api/resource/Listing
 * The signatures and return types should stay the same.
 */

import { getDB, mutate, nextId } from "@/lib/store";
import type { DB } from "@/lib/store";
import type { Listing, SellerProfile, Category, SellingType } from "@/lib/types";

export interface ListingDetails {
  listing: Listing;
  seller: SellerProfile;
  category: Category;
  avgRating: number | null;
  reviewCount: number;
}

export function getListingDetails(db: DB, listingId: string): ListingDetails | null {
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return null;
  const seller = db.sellerProfiles.find((s) => s.id === listing.sellerId)!;
  const category = db.categories.find((c) => c.id === listing.categoryId)!;
  const reviews = db.reviews.filter((r) => r.sellerId === listing.sellerId && !r.flagged);
  const avgRating =
    reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  return { listing, seller, category, avgRating, reviewCount: reviews.length };
}

export function approvedListings(db: DB): Listing[] {
  return db.listings.filter((l) => l.status === "approved");
}

export interface CreateListingInput {
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  sellingType: SellingType;
  unit: string;
  pricePerUnit: number;
  quantityAvailable: number;
  minOrderQty: number;
  location: string;
  district: string;
  organic: boolean;
  certification?: string;
  // auction-only fields
  minBid?: number;
  startTime?: string;
  endTime?: string;
}

/** REQ 2.1: new listings start in "pending" until staff approve them. */
export function createListing(input: CreateListingInput): string {
  const id = nextId("l");
  const category = getDB().categories.find((c) => c.id === input.categoryId);
  mutate((db) => {
    db.listings.push({
      id,
      sellerId: input.sellerId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      sellingType: input.sellingType,
      unit: input.unit,
      pricePerUnit: input.sellingType === "direct" ? input.pricePerUnit : 0,
      aiSuggestedPrice: suggestPrice(input.categoryId, input.pricePerUnit || input.minBid || 250),
      quantityAvailable: input.quantityAvailable,
      minOrderQty: input.minOrderQty,
      location: input.location,
      district: input.district,
      organic: input.organic,
      certification: input.certification,
      status: "pending",
      image: category?.icon ?? "🌱",
      imageGradient: "from-green-200 to-emerald-100",
      createdAt: new Date().toISOString(),
    });
    if (input.sellingType === "auction" && input.minBid && input.startTime && input.endTime) {
      db.auctions.push({
        id: nextId("a"),
        listingId: id,
        minBid: input.minBid,
        startTime: input.startTime,
        endTime: input.endTime,
        status: "pending",
        aiFairValue: Math.round(input.minBid * 1.14),
      });
    }
  });
  return id;
}

/** Mock of the Prophet price-suggestion endpoint. */
export function suggestPrice(
  categoryId: string,
  base: number
): { min: number; max: number } {
  const db = getDB();
  const fc = db.forecasts.find((f) => f.categoryId === categoryId) ?? db.forecasts[0];
  const latest = fc.points.find((p) => p.actual === undefined) ?? fc.points[fc.points.length - 1];
  const anchor = base > 0 ? (base + latest.yhat) / 2 : latest.yhat;
  return { min: Math.round(anchor * 0.95), max: Math.round(anchor * 1.07) };
}

export function updateListingStock(listingId: string, quantity: number): void {
  mutate((db) => {
    const l = db.listings.find((x) => x.id === listingId);
    if (l) l.quantityAvailable = quantity;
  });
}

export function deleteListing(listingId: string): void {
  mutate((db) => {
    db.listings = db.listings.filter((l) => l.id !== listingId);
    db.auctions = db.auctions.filter((a) => a.listingId !== listingId);
  });
}

/** Staff action — REQ 2.1/REQ-5. */
export function reviewListing(
  listingId: string,
  decision: "approved" | "rejected",
  feedback?: string
): void {
  mutate((db) => {
    const l = db.listings.find((x) => x.id === listingId);
    if (!l) return;
    l.status = decision;
    l.rejectionReason = decision === "rejected" ? feedback : undefined;
    const seller = db.sellerProfiles.find((s) => s.id === l.sellerId);
    if (seller) {
      db.notifications.unshift({
        id: nextId("n"),
        userId: seller.userId,
        type: "listing",
        message:
          decision === "approved"
            ? `Your listing '${l.title}' was approved and is now live.`
            : `Your listing '${l.title}' was rejected. ${feedback ?? ""}`,
        channel: "in_app",
        read: false,
        sentAt: new Date().toISOString(),
      });
    }
  });
}
