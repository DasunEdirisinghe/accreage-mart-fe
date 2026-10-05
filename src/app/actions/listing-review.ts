"use server";

import { revalidateTag } from "next/cache";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { REVIEW_METHODS } from "@/lib/methods";
import { LISTING_TAGS } from "@/lib/tags";
import type { ListingStatusLabel } from "@/types/listing.type";
import type {
  DecisionResult,
  ReviewListingResponse,
  ReviewQueueQuery,
  ReviewQueueResponse,
} from "@/types/listing-review.type";

const EMPTY_COUNTS: Record<ListingStatusLabel, number> = {
  "Pending Approval": 0,
  Approved: 0,
  Rejected: 0,
  Hidden: 0,
  Suspended: 0,
  Archived: 0,
};

const EMPTY_QUEUE: ReviewQueueResponse = {
  items: [],
  counts: EMPTY_COUNTS,
  total: 0,
  page: 1,
  page_size: 12,
  has_more: false,
};

/** The staff queue for one status (Pending Approval by default). Empty on any failure. */
export async function getReviewQueue(query: ReviewQueueQuery = {}): Promise<ReviewQueueResponse> {
  try {
    const res = await frappeFetch(REVIEW_METHODS.LIST, {
      method: "POST",
      body: { status: query.status, search: query.search, page: query.page ?? 1 },
      cache: "no-store",
    });
    return ((await res.json()) as { message: ReviewQueueResponse }).message ?? EMPTY_QUEUE;
  } catch {
    return EMPTY_QUEUE;
  }
}

/** One listing in full for review. Null when it doesn't exist or the caller isn't staff. */
export async function getListingForReview(name: string): Promise<ReviewListingResponse | null> {
  try {
    const res = await frappeFetch(REVIEW_METHODS.GET, {
      method: "POST",
      body: { name },
      cache: "no-store",
    });
    return ((await res.json()) as { message: ReviewListingResponse }).message ?? null;
  } catch {
    return null;
  }
}

const STALE = /changed after you opened it/i;

async function decide(method: REVIEW_METHODS, body: Record<string, unknown>): Promise<DecisionResult> {
  try {
    await frappeFetch(method, { method: "POST", body });
    revalidateTag(LISTING_TAGS.PUBLIC);
    revalidateTag(LISTING_TAGS.MINE);
    return { ok: true };
  } catch (error) {
    const message = frappeErrorMessage(error);
    return { ok: false, error: message, stale: STALE.test(message) };
  }
}

/** Publish a pending listing (or reinstate a suspended one). The note is optional. */
export async function approveListing(
  name: string,
  expectedModified: string,
  note?: string,
): Promise<DecisionResult> {
  return decide(REVIEW_METHODS.APPROVE, {
    name,
    expected_modified: expectedModified,
    note: note?.trim() || undefined,
  });
}

export async function rejectListing(
  name: string,
  expectedModified: string,
  reason: string,
): Promise<DecisionResult> {
  return decide(REVIEW_METHODS.REJECT, { name, expected_modified: expectedModified, reason: reason.trim() });
}

export async function suspendListing(
  name: string,
  expectedModified: string,
  reason: string,
): Promise<DecisionResult> {
  return decide(REVIEW_METHODS.SUSPEND, { name, expected_modified: expectedModified, reason: reason.trim() });
}
