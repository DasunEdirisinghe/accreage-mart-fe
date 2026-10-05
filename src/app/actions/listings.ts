"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { editRestriction } from "@/lib/listing-edit";
import { toBackendDateTime } from "@/lib/listing-time";
import {
  formDataToValues,
  makeListingSchema,
  toCreateBody,
  toUpdateValues,
} from "@/lib/listing-schema";
import { LISTING_METHODS } from "@/lib/methods";
import { toPriceSuggestionView, type RawPriceSuggestion } from "@/lib/price-suggestion";
import { LISTING_TAGS } from "@/lib/tags";
import type {
  ActionResult,
  GetListingResponse,
  ListingActionInfo,
  ListingCategoryOption,
  ListingFormState,
  ListingHistoryEntry,
  MyListingsQuery,
  MyListingsResponse,
  PriceSuggestionView,
} from "@/types/listing.type";

/** Categories for the searchable dropdown. Empty list on any failure. */
export async function getListingCategories(): Promise<ListingCategoryOption[]> {
  try {
    const res = await frappeFetch(LISTING_METHODS.LIST_CATEGORIES, { cache: "no-store" });
    return ((await res.json()) as { message: ListingCategoryOption[] }).message ?? [];
  } catch {
    return [];
  }
}

/** The price-suggestion box's data for a category: no reference / unreliable / available. */
export async function getPriceSuggestion(category: string): Promise<PriceSuggestionView> {
  try {
    const res = await frappeFetch(LISTING_METHODS.GET_PRICE_SUGGESTION, {
      method: "POST",
      body: { category },
      cache: "no-store",
    });
    return toPriceSuggestionView(((await res.json()) as { message: RawPriceSuggestion }).message);
  } catch {
    return { state: "none", reason: "error" };
  }
}

export async function uploadListingImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file was chosen." };

  const body = new FormData();
  body.append("file", file, file.name);
  try {
    const res = await frappeFetch(LISTING_METHODS.UPLOAD_IMAGE, { method: "POST", body });
    const data = ((await res.json()) as { message: { url: string } }).message;
    return { ok: true, url: data.url };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}

/** Best effort: removes an upload the seller dropped before saving. */
export async function discardListingImage(url: string): Promise<{ ok: boolean }> {
  try {
    await frappeFetch(LISTING_METHODS.DISCARD_IMAGE, { method: "POST", body: { url } });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** The caller's view of one listing, or null when it doesn't exist / isn't theirs to see. */
export async function getOwnListing(name: string): Promise<GetListingResponse | null> {
  try {
    const res = await frappeFetch(LISTING_METHODS.GET, {
      method: "POST",
      body: { name },
      cache: "no-store",
    });
    return ((await res.json()) as { message: GetListingResponse }).message ?? null;
  } catch {
    return null;
  }
}

function revalidateListings() {
  revalidateTag(LISTING_TAGS.MINE);
  revalidateTag(LISTING_TAGS.PUBLIC);
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = makeListingSchema({ requireAcknowledgement: true }).safeParse(
    formDataToValues(formData),
  );
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  let name = "";
  try {
    const res = await frappeFetch(LISTING_METHODS.CREATE, {
      method: "POST",
      body: toCreateBody(parsed.data),
    });
    name = ((await res.json()) as { message: { name: string } }).message.name;
    revalidateListings();
  } catch (error) {
    return { success: false, message: frappeErrorMessage(error) };
  }

  redirect(`/seller/listings?submitted=${encodeURIComponent(name)}`);
}

export async function updateListing(
  name: string,
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const current = await getOwnListing(name);
  if (!current?.listing || current.viewer !== "owner") {
    return { success: false, message: "Listing not found." };
  }
  const restriction = editRestriction(current.listing);
  if (!restriction.canEdit) {
    return { success: false, message: restriction.blockedReason };
  }

  // The selling type can't change, so it comes from the stored listing, not the form.
  const values = { ...formDataToValues(formData), selling_type: current.listing.selling_type };
  const parsed = makeListingSchema({
    requireAcknowledgement: false,
    skipAuctionTerms: restriction.termsLocked,
  }).safeParse(values);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await frappeFetch(LISTING_METHODS.UPDATE, {
      method: "POST",
      body: {
        name,
        values: toUpdateValues(parsed.data, {
          termsLocked: restriction.termsLocked,
          lotLocked: restriction.lotLocked,
        }),
      },
    });
    revalidateListings();
  } catch (error) {
    return { success: false, message: frappeErrorMessage(error) };
  }

  redirect(`/seller/listings?updated=${encodeURIComponent(name)}`);
}

// -- the seller's own listings -----------------------------------------------------------------

const EMPTY_MINE: MyListingsResponse = {
  items: [],
  counts: { pending: 0, live: 0, hidden: 0, rejected: 0, suspended: 0, archived: 0 },
  total: 0,
  page: 1,
  page_size: 12,
  has_more: false,
};

/** The seller's listings (optionally one tab / search / type). Empty on any failure. */
export async function getMyListings(query: MyListingsQuery = {}): Promise<MyListingsResponse> {
  try {
    const res = await frappeFetch(LISTING_METHODS.LIST_MINE, {
      method: "POST",
      body: {
        tab: query.tab,
        search: query.search,
        selling_type: query.selling_type,
        exclude_archived: query.exclude_archived ? 1 : 0,
        page: query.page ?? 1,
        page_size: query.page_size,
      },
      cache: "no-store",
    });
    return ((await res.json()) as { message: MyListingsResponse }).message ?? EMPTY_MINE;
  } catch {
    return EMPTY_MINE;
  }
}

/** Whether hide / archive / unhide are possible now, with the warning text. Null on failure. */
export async function getListingActionInfo(name: string): Promise<ListingActionInfo | null> {
  try {
    const res = await frappeFetch(LISTING_METHODS.GET_ACTION_INFO, {
      method: "POST",
      body: { name },
      cache: "no-store",
    });
    return ((await res.json()) as { message: ListingActionInfo }).message ?? null;
  } catch {
    return null;
  }
}

/** The decisions and resubmissions on one listing, newest first. Empty on failure. */
export async function getListingHistory(name: string): Promise<ListingHistoryEntry[]> {
  try {
    const res = await frappeFetch(LISTING_METHODS.GET_HISTORY, {
      method: "POST",
      body: { name },
      cache: "no-store",
    });
    return ((await res.json()) as { message: ListingHistoryEntry[] }).message ?? [];
  } catch {
    return [];
  }
}

async function runAction(
  method: LISTING_METHODS,
  body: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const res = await frappeFetch(method, { method: "POST", body });
    const message = ((await res.json()) as { message?: { name?: string } }).message;
    revalidateListings();
    return { ok: true, name: message?.name };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}

export async function hideListing(name: string, acknowledged: boolean): Promise<ActionResult> {
  return runAction(LISTING_METHODS.HIDE, { name, acknowledged: acknowledged ? 1 : 0 });
}

export async function unhideListing(name: string): Promise<ActionResult> {
  return runAction(LISTING_METHODS.UNHIDE, { name });
}

/** The seller's "delete": archives the listing. */
export async function archiveListing(name: string, acknowledged: boolean): Promise<ActionResult> {
  return runAction(LISTING_METHODS.ARCHIVE, { name, acknowledged: acknowledged ? 1 : 0 });
}

export async function resubmitListing(name: string, note: string): Promise<ActionResult> {
  return runAction(LISTING_METHODS.RESUBMIT, { name, note: note.trim() || undefined });
}

export async function updateStock(name: string, quantity: number): Promise<ActionResult> {
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, error: "Enter a quantity of zero or more." };
  }
  return runAction(LISTING_METHODS.UPDATE_STOCK, { name, quantity_available: quantity });
}

/** A new Pending listing from an archived one. An auction needs fresh terms. */
export async function duplicateListing(
  name: string,
  options: {
    acknowledged?: boolean;
    minBid?: number;
    startTime?: string;
    endTime?: string;
  } = {},
): Promise<ActionResult> {
  return runAction(LISTING_METHODS.DUPLICATE, {
    name,
    auction_terms_acknowledged: options.acknowledged ? 1 : 0,
    min_bid: options.minBid,
    start_time: options.startTime ? toBackendDateTime(options.startTime) : undefined,
    end_time: options.endTime ? toBackendDateTime(options.endTime) : undefined,
  });
}
