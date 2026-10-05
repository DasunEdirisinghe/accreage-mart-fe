/** Backend response shapes for the staff review endpoints (api/listing_review.py). */

import type { ListingStatusLabel, OwnListingDetail, SellingType } from "@/types/listing.type";

export interface ReviewQueueItem {
  name: string;
  title: string;
  status: ListingStatusLabel;
  selling_type: SellingType;
  category_title: string | null;
  unit: string;
  price_per_unit: number | null;
  quantity_available: number;
  cover_image: string | null;
  seller_business_name: string;
  submitted_on: string | null;
  modified: string;
  previous_rejections: number;
  resubmitted: boolean;
  auction: {
    min_bid: number;
    start_time: string;
    end_time: string;
    start_passed: boolean;
  } | null;
}

export type ReviewStatusKey = ListingStatusLabel;

export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  counts: Record<ListingStatusLabel, number>;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ReviewQueueQuery {
  status?: ListingStatusLabel;
  search?: string;
  page?: number;
}

export interface ReviewHistoryEntry {
  name: string;
  action: "Approved" | "Rejected" | "Suspended" | "Resubmitted";
  reason: string | null;
  seller_note: string | null;
  reviewer: string;
  reviewer_name: string;
  reviewed_on: string;
}

export interface EditHistoryEntry {
  user: string;
  at: string;
  changes: { field: string; old: string | null; new: string | null }[];
  table_rows_changed: number;
}

export interface ReviewSellerContext {
  email: string;
  business_name: string;
  district: string;
  verified: boolean;
  trust_score: number;
  total_sales: number;
  member_since: string;
  account_status: string;
}

export interface ReviewActionState {
  allowed: boolean;
  blocked_reason: string | null;
}

/** The listing as buyers will see it, from api.marketplace.build_listing_detail (staff view). */
export type ReviewListingDetail = OwnListingDetail & {
  map_url: string | null;
  in_stock: boolean;
  seller: { public_id: string; business_name: string; district: string; trust_score: number; verified: boolean };
};

export interface ReviewListingResponse {
  listing: ReviewListingDetail;
  /** Sent back with every decision: if the seller changed the listing since, it is refused. */
  expected_modified: string;
  review: {
    submitted_on: string | null;
    ai_suggested_min: number | null;
    ai_suggested_max: number | null;
    ai_fair_value: number | null;
    resubmission_note: string | null;
    reviewed_by: string | null;
    reviewed_on: string | null;
    seller: ReviewSellerContext;
    history: ReviewHistoryEntry[];
    edit_history: EditHistoryEntry[];
  };
  actions: { approve: ReviewActionState; reject: ReviewActionState; suspend: ReviewActionState };
}

export type DecisionResult =
  | { ok: true }
  /** `stale` is true when the seller changed the listing after the reviewer opened it. */
  | { ok: false; error: string; stale: boolean };
