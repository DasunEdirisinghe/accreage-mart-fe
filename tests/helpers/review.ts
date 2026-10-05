import type { ReviewListingResponse, ReviewQueueItem, ReviewQueueResponse } from "@/types/listing-review.type";

export function makeQueueItem(over: Partial<ReviewQueueItem> = {}): ReviewQueueItem {
  return {
    name: "LST-00001",
    title: "Fresh Carrots",
    status: "Pending Approval",
    selling_type: "Direct",
    category_title: "Carrot",
    unit: "kg",
    price_per_unit: 150,
    quantity_available: 400,
    cover_image: null,
    seller_business_name: "Test Farms",
    submitted_on: "2026-10-05 09:00:00.000000",
    modified: "2026-10-05 09:00:00.000000",
    previous_rejections: 0,
    resubmitted: false,
    auction: null,
    ...over,
  };
}

export function makeQueue(items: ReviewQueueItem[] = [makeQueueItem()], over: Partial<ReviewQueueResponse> = {}): ReviewQueueResponse {
  return {
    items,
    counts: { "Pending Approval": 3, Approved: 5, Rejected: 1, Hidden: 0, Suspended: 2, Archived: 4 },
    total: items.length,
    page: 1,
    page_size: 12,
    has_more: false,
    ...over,
  };
}

const allowed = { allowed: true, blocked_reason: null };
const blocked = (reason: string) => ({ allowed: false, blocked_reason: reason });

/** A pending Direct listing, as api.listing_review.get_listing_for_review returns it. */
export function makeReview(over: Record<string, unknown> = {}): ReviewListingResponse {
  const base: ReviewListingResponse = {
    listing: {
      name: "LST-00001",
      title: "Fresh Carrots",
      description: "Grade A carrots.\nHarvested this week.",
      selling_type: "Direct",
      category: { name: "cat-1", title: "Carrot", area: "Vegetables" },
      unit: "kg",
      price_per_unit: 150,
      min_order_qty: 25,
      quantity_available: 400,
      low_stock_level: 0,
      district: "Nuwara Eliya",
      location: "Nuwara Eliya market",
      latitude: 6.97,
      longitude: 80.77,
      map_url: "https://www.google.com/maps?q=6.97,80.77",
      in_stock: true,
      organic: true,
      certification: "SLS organic 1234",
      images: [
        { url: "/files/lst-a.png", is_cover: true },
        { url: "/files/lst-b.png", is_cover: false },
      ],
      seller: { public_id: "abc", business_name: "Test Farms", district: "Kandy", trust_score: 4.5, verified: true },
      auction: null,
      status: "Pending Approval",
      status_reason: null,
      resubmission_note: null,
    },
    expected_modified: "2026-10-05 09:00:00.123456",
    review: {
      submitted_on: "2026-10-05 09:00:00.000000",
      ai_suggested_min: 100,
      ai_suggested_max: 140,
      ai_fair_value: null,
      resubmission_note: null,
      reviewed_by: null,
      reviewed_on: null,
      seller: {
        email: "seller@farms.lk",
        business_name: "Test Farms",
        district: "Kandy",
        verified: true,
        trust_score: 4.5,
        total_sales: 125000,
        member_since: "2026-01-10 10:00:00.000000",
        account_status: "active",
      },
      history: [],
      edit_history: [],
    },
    actions: {
      approve: allowed,
      reject: allowed,
      suspend: blocked("Only a published or hidden listing can be suspended."),
    },
  };
  return { ...base, ...over } as ReviewListingResponse;
}

export const blockedAction = blocked;
