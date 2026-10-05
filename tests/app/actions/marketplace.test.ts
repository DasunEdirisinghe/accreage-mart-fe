import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));

import {
  getMarketplace,
  getMarketplaceCategories,
  getPublicListing,
  getPublicSeller,
} from "@/app/actions/marketplace";
import { frappeFetch } from "@/lib/frappe";
import { parseMarketplaceParams } from "@/lib/marketplace-query";
import { LISTING_METHODS, MARKETPLACE_METHODS } from "@/lib/methods";
import { LISTING_TAGS } from "@/lib/tags";

const mockFetch = vi.mocked(frappeFetch);
const reply = (message: unknown) => ({ json: async () => ({ message }) }) as Response;
const initOf = (index = 0) => mockFetch.mock.calls[index][1] as Record<string, unknown>;

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("getMarketplace", () => {
  it("sends the filters with no session, and caches the public result under the listing tag", async () => {
    mockFetch.mockResolvedValueOnce(reply({ items: [{ name: "LST-1" }], total: 1, page: 1, page_size: 12, has_more: false }));
    const filters = parseMarketplaceParams({ q: "carrot", type: "Direct", page: "2" });
    const result = await getMarketplace(filters, 8);

    expect(result.items).toHaveLength(1);
    expect(mockFetch.mock.calls[0][0]).toBe(MARKETPLACE_METHODS.LIST);
    expect(initOf()).toMatchObject({
      method: "POST",
      auth: false,
      next: { tags: [LISTING_TAGS.PUBLIC], revalidate: 60 },
    });
    expect(initOf().body).toMatchObject({ search: "carrot", selling_type: "Direct", page: 2, page_size: 8, sort: "newest" });
  });

  it("returns an empty, well-formed page on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    const result = await getMarketplace(parseMarketplaceParams({}));
    expect(result).toEqual({ items: [], total: 0, page: 1, page_size: 12, has_more: false });
  });
});

describe("getMarketplaceCategories", () => {
  it("is public and cached, and empty on failure", async () => {
    mockFetch.mockResolvedValueOnce(reply([{ name: "c1", title: "Carrot", area: "Vegetables" }]));
    expect(await getMarketplaceCategories()).toHaveLength(1);
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.LIST_CATEGORIES);
    expect(initOf()).toMatchObject({ auth: false, next: { tags: [LISTING_TAGS.PUBLIC], revalidate: 300 } });

    mockFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await getMarketplaceCategories()).toEqual([]);
  });
});

describe("getPublicListing", () => {
  it("sends the session and is never cached, because owners and staff see more than the public", async () => {
    mockFetch.mockResolvedValueOnce(reply({ availability: "available", listing: { name: "LST-1" } }));
    const result = await getPublicListing("LST-1");
    expect(result?.availability).toBe("available");
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.GET);
    expect(initOf()).toMatchObject({ method: "POST", cache: "no-store", body: { name: "LST-1" } });
    expect(initOf().auth).toBeUndefined(); // the session is attached by default
  });

  it("returns null for a listing that isn't there", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 404 not found"));
    expect(await getPublicListing("LST-404")).toBeNull();
  });
});

describe("getPublicSeller", () => {
  it("asks by public id with no session and returns the card, or null", async () => {
    mockFetch.mockResolvedValueOnce(reply({ public_id: "abc", business_name: "Test Farms" }));
    expect((await getPublicSeller("abc"))?.business_name).toBe("Test Farms");
    expect(mockFetch.mock.calls[0][0]).toBe(MARKETPLACE_METHODS.PUBLIC_SELLER);
    expect(initOf()).toMatchObject({ auth: false, body: { public_id: "abc" } });

    mockFetch.mockRejectedValueOnce(new Error("404"));
    expect(await getPublicSeller("zzz")).toBeNull();
  });
});
