"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { editRestriction } from "@/lib/listing-edit";
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
  GetListingResponse,
  ListingCategoryOption,
  ListingFormState,
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
