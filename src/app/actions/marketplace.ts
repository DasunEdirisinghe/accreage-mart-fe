"use server";

import { frappeFetch } from "@/lib/frappe";
import { LISTING_METHODS, MARKETPLACE_METHODS } from "@/lib/methods";
import { toBackendQuery, type MarketplaceFilters } from "@/lib/marketplace-query";
import { LISTING_TAGS } from "@/lib/tags";
import type { ListingCategoryOption } from "@/types/listing.type";
import type { MarketplaceResponse, PublicListingResponse, PublicSeller } from "@/types/marketplace.type";

const EMPTY: MarketplaceResponse = { items: [], total: 0, page: 1, page_size: 12, has_more: false };

/**
 * Published listings, public data: no session is sent, so the result is shared and cached
 * (refreshed by the listing tag whenever a listing is approved, hidden, edited...).
 */
export async function getMarketplace(
  filters: MarketplaceFilters,
  pageSize?: number,
): Promise<MarketplaceResponse> {
  try {
    const res = await frappeFetch(MARKETPLACE_METHODS.LIST, {
      method: "POST",
      auth: false,
      body: toBackendQuery(filters, pageSize),
      next: { tags: [LISTING_TAGS.PUBLIC], revalidate: 60 },
    });
    return ((await res.json()) as { message: MarketplaceResponse }).message ?? EMPTY;
  } catch (error) {
    // An empty marketplace is the right thing to show, but the cause must not vanish silently.
    console.error("getMarketplace failed:", error);
    return EMPTY;
  }
}

/** Category names for the filter and the landing page. Public data, cached. */
export async function getMarketplaceCategories(): Promise<ListingCategoryOption[]> {
  try {
    const res = await frappeFetch(LISTING_METHODS.LIST_CATEGORIES, {
      auth: false,
      next: { tags: [LISTING_TAGS.PUBLIC], revalidate: 300 },
    });
    return ((await res.json()) as { message: ListingCategoryOption[] }).message ?? [];
  } catch {
    return [];
  }
}

/**
 * One listing as THIS viewer may see it (the owner and staff see more than the public), so the
 * session is sent and nothing is cached. Null when it doesn't exist (or isn't theirs to know about).
 */
export async function getPublicListing(name: string): Promise<PublicListingResponse | null> {
  try {
    const res = await frappeFetch(LISTING_METHODS.GET, {
      method: "POST",
      body: { name },
      cache: "no-store",
    });
    return ((await res.json()) as { message: PublicListingResponse }).message ?? null;
  } catch {
    return null;
  }
}

/** A seller's public card by opaque id. Null when unknown or no longer active. */
export async function getPublicSeller(publicId: string): Promise<PublicSeller | null> {
  try {
    const res = await frappeFetch(MARKETPLACE_METHODS.PUBLIC_SELLER, {
      method: "POST",
      auth: false,
      body: { public_id: publicId },
      next: { tags: [LISTING_TAGS.PUBLIC], revalidate: 60 },
    });
    return ((await res.json()) as { message: PublicSeller }).message ?? null;
  } catch {
    return null;
  }
}
