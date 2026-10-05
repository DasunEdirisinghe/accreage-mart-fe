import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import {
  archiveListing,
  createListing,
  discardListingImage,
  duplicateListing,
  getListingActionInfo,
  getListingCategories,
  getListingHistory,
  getMyListings,
  getOwnListing,
  getPriceSuggestion,
  hideListing,
  resubmitListing,
  unhideListing,
  updateListing,
  updateStock,
  uploadListingImage,
} from "@/app/actions/listings";
import { frappeFetch } from "@/lib/frappe";
import { siteNow } from "@/lib/listing-time";
import { LISTING_METHODS } from "@/lib/methods";
import { LISTING_TAGS } from "@/lib/tags";
import { revalidateTag } from "next/cache";

const mockFetch = vi.mocked(frappeFetch);
const mockRevalidate = vi.mocked(revalidateTag);

const reply = (message: unknown) => ({ json: async () => ({ message }) }) as Response;

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const directFields = {
  selling_type: "Direct",
  category: "cat-1",
  title: "Fresh Carrots",
  description: "Grade A",
  unit: "kg",
  quantity_available: "500",
  price_per_unit: "120",
  district: "Kandy",
  location: "Kandy market",
  images: JSON.stringify([{ image: "/files/lst-a.png", is_cover: true }]),
};

describe("getListingCategories", () => {
  it("returns the rows from the backend", async () => {
    mockFetch.mockResolvedValueOnce(reply([{ name: "c1", title: "Carrot", area: "Vegetables" }]));
    expect(await getListingCategories()).toEqual([{ name: "c1", title: "Carrot", area: "Vegetables" }]);
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.LIST_CATEGORIES);
  });

  it("returns an empty list on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await getListingCategories()).toEqual([]);
  });
});

describe("getPriceSuggestion", () => {
  it("asks the backend by category and returns the view", async () => {
    mockFetch.mockResolvedValueOnce(reply({ available: false, reason: "no_commodity_linked" }));
    expect(await getPriceSuggestion("cat-1")).toEqual({ state: "none", reason: "no_commodity" });
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe(LISTING_METHODS.GET_PRICE_SUGGESTION);
    expect((init as { body: unknown }).body).toEqual({ category: "cat-1" });
  });

  it("reports an error state instead of throwing", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await getPriceSuggestion("cat-1")).toEqual({ state: "none", reason: "error" });
  });
});

describe("uploadListingImage", () => {
  it("forwards the file as multipart and returns its URL", async () => {
    mockFetch.mockResolvedValueOnce(reply({ url: "/files/lst-abc.png" }));
    const data = new FormData();
    data.set("file", new File(["img"], "photo.png", { type: "image/png" }));
    const result = await uploadListingImage(data);
    expect(result).toEqual({ ok: true, url: "/files/lst-abc.png" });
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe(LISTING_METHODS.UPLOAD_IMAGE);
    const body = (init as { body: FormData }).body;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get("file") as File).name).toBe("photo.png");
  });

  it("refuses a missing or empty file without calling the backend", async () => {
    expect(await uploadListingImage(new FormData())).toMatchObject({ ok: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns the backend's message when the upload is rejected", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"_server_messages":"[\\"{\\\\\\"message\\\\\\": \\\\\\"This file is not a valid image.\\\\\\"}\\"]"}'),
    );
    const data = new FormData();
    data.set("file", new File(["x"], "bad.png", { type: "image/png" }));
    expect(await uploadListingImage(data)).toEqual({ ok: false, error: "This file is not a valid image." });
  });
});

describe("discardListingImage", () => {
  it("asks the backend to drop an upload and never throws", async () => {
    mockFetch.mockResolvedValueOnce(reply({ ok: true }));
    expect(await discardListingImage("/files/lst-a.png")).toEqual({ ok: true });
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await discardListingImage("/files/lst-a.png")).toEqual({ ok: false });
  });
});

describe("getOwnListing", () => {
  it("returns the response, or null on failure", async () => {
    mockFetch.mockResolvedValueOnce(reply({ viewer: "owner", listing: { name: "LST-1" } }));
    expect((await getOwnListing("LST-1"))?.viewer).toBe("owner");
    mockFetch.mockRejectedValueOnce(new Error("404"));
    expect(await getOwnListing("LST-2")).toBeNull();
  });
});

describe("createListing", () => {
  it("returns field errors without calling the backend", async () => {
    const state = await createListing({}, form({ ...directFields, title: "", price_per_unit: "0" }));
    expect(state.success).toBe(false);
    expect(state.errors?.title).toBeTruthy();
    expect(state.errors?.price_per_unit).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("creates a direct listing, refreshes the lists and redirects", async () => {
    mockFetch.mockResolvedValueOnce(reply({ name: "LST-00007" }));
    await expect(createListing({}, form(directFields))).rejects.toThrow("NEXT_REDIRECT:/seller/listings?submitted=LST-00007");

    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe(LISTING_METHODS.CREATE);
    expect((init as { method: string }).method).toBe("POST");
    expect((init as { body: Record<string, unknown> }).body).toMatchObject({
      selling_type: "Direct",
      category: "cat-1",
      quantity_available: 500,
      price_per_unit: 120,
      images: [{ image: "/files/lst-a.png", is_cover: true }],
      min_bid: null,
    });
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.MINE);
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.PUBLIC);
  });

  it("creates an auction listing with its terms and acknowledgement", async () => {
    mockFetch.mockResolvedValueOnce(reply({ name: "LST-00008" }));
    const start = siteNow(new Date(Date.now() + 30 * 3_600_000));
    const end = siteNow(new Date(Date.now() + 42 * 3_600_000));
    await expect(
      createListing(
        {},
        form({
          ...directFields,
          selling_type: "Auction",
          price_per_unit: "",
          min_bid: "300",
          start_time: start,
          end_time: end,
          auction_terms_acknowledged: "on",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    const body = (mockFetch.mock.calls[0][1] as { body: Record<string, unknown> }).body;
    expect(body).toMatchObject({ selling_type: "Auction", min_bid: 300, auction_terms_acknowledged: 1, price_per_unit: null });
    expect(String(body.start_time)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/);
  });

  it("refuses an auction without the acknowledgement", async () => {
    const state = await createListing(
      {},
      form({ ...directFields, selling_type: "Auction", min_bid: "300", start_time: siteNow(new Date(Date.now() + 30 * 3_600_000)), end_time: siteNow(new Date(Date.now() + 42 * 3_600_000)) }),
    );
    expect(state.errors?.auction_terms_acknowledged).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows the backend's message when the request fails", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"_server_messages":"[\\"{\\\\\\"message\\\\\\": \\\\\\"Only verified sellers can manage listings.\\\\\\"}\\"]"}'),
    );
    const state = await createListing({}, form(directFields));
    expect(state).toEqual({ success: false, message: "Only verified sellers can manage listings." });
  });
});

describe("updateListing", () => {
  const owner = (listing: Record<string, unknown>) =>
    reply({ viewer: "owner", listing: { selling_type: "Direct", status: "Approved", auction: null, status_reason: null, ...listing } });

  it("refuses a listing that isn't the caller's", async () => {
    mockFetch.mockResolvedValueOnce(reply({ viewer: "public", listing: null }));
    expect(await updateListing("LST-1", {}, form(directFields))).toEqual({ success: false, message: "Listing not found." });
  });

  it("refuses to edit an archived listing", async () => {
    mockFetch.mockResolvedValueOnce(owner({ status: "Archived" }));
    const state = await updateListing("LST-1", {}, form(directFields));
    expect(state.success).toBe(false);
    expect(state.message).toMatch(/Archived/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("validates, then updates only the fields that apply and redirects", async () => {
    mockFetch.mockResolvedValueOnce(owner({})).mockResolvedValueOnce(reply({ name: "LST-1" }));
    await expect(updateListing("LST-1", {}, form(directFields))).rejects.toThrow("NEXT_REDIRECT:/seller/listings?updated=LST-1");
    const [method, init] = mockFetch.mock.calls[1];
    expect(method).toBe(LISTING_METHODS.UPDATE);
    const body = (init as { body: { name: string; values: Record<string, unknown> } }).body;
    expect(body.name).toBe("LST-1");
    expect(body.values).toMatchObject({ title: "Fresh Carrots", price_per_unit: 120 });
    expect(body.values).not.toHaveProperty("min_bid");
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.MINE);
  });

  it("takes the selling type from the stored listing, not the form", async () => {
    mockFetch.mockResolvedValueOnce(owner({})).mockResolvedValueOnce(reply({ name: "LST-1" }));
    await expect(
      updateListing("LST-1", {}, form({ ...directFields, selling_type: "Auction" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    const body = (mockFetch.mock.calls[1][1] as { body: { values: Record<string, unknown> } }).body;
    expect(body.values).toHaveProperty("price_per_unit");
  });

  it("does not resend locked auction terms for a started auction", async () => {
    const started = {
      selling_type: "Auction",
      auction: { min_bid: 300, start_time: "2020-01-01 10:00:00.000000", end_time: "2030-01-01 10:00:00.000000" },
    };
    mockFetch.mockResolvedValueOnce(owner(started)).mockResolvedValueOnce(reply({ name: "LST-1" }));
    await expect(
      updateListing("LST-1", {}, form({ ...directFields, selling_type: "Auction", price_per_unit: "" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    const values = (mockFetch.mock.calls[1][1] as { body: { values: Record<string, unknown> } }).body.values;
    expect(values).not.toHaveProperty("min_bid");
    expect(values).not.toHaveProperty("start_time");
    expect(values).not.toHaveProperty("quantity_available");
  });

  it("returns field errors without calling update", async () => {
    mockFetch.mockResolvedValueOnce(owner({}));
    const state = await updateListing("LST-1", {}, form({ ...directFields, title: "" }));
    expect(state.errors?.title).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("getMyListings", () => {
  it("asks for the seller's listings with the filters and returns the response", async () => {
    mockFetch.mockResolvedValueOnce(reply({ items: [{ name: "LST-1" }], counts: {}, total: 1, page: 2, page_size: 12, has_more: false }));
    const result = await getMyListings({ tab: "live", search: "carrot", selling_type: "Direct", exclude_archived: true, page: 2 });
    expect(result.items).toHaveLength(1);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe(LISTING_METHODS.LIST_MINE);
    expect((init as { body: unknown }).body).toEqual({
      tab: "live",
      search: "carrot",
      selling_type: "Direct",
      exclude_archived: 1,
      page: 2,
      page_size: undefined,
    });
  });

  it("defaults to page 1 with nothing excluded", async () => {
    mockFetch.mockResolvedValueOnce(reply({ items: [] }));
    await getMyListings();
    expect((mockFetch.mock.calls[0][1] as { body: Record<string, unknown> }).body).toMatchObject({ page: 1, exclude_archived: 0 });
  });

  it("returns an empty, well-formed result on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    const result = await getMyListings();
    expect(result.items).toEqual([]);
    expect(result.counts).toEqual({ pending: 0, live: 0, hidden: 0, rejected: 0, suspended: 0, archived: 0 });
  });
});

describe("getListingActionInfo and getListingHistory", () => {
  it("return the backend's answer, or null / empty on failure", async () => {
    mockFetch.mockResolvedValueOnce(reply({ warning: "w", hide: { blocked_reason: null } }));
    expect((await getListingActionInfo("LST-1"))?.warning).toBe("w");
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.GET_ACTION_INFO);

    mockFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await getListingActionInfo("LST-1")).toBeNull();

    mockFetch.mockResolvedValueOnce(reply([{ action: "Rejected", by: "staff" }]));
    expect(await getListingHistory("LST-1")).toHaveLength(1);
    expect(mockFetch.mock.calls[2][0]).toBe(LISTING_METHODS.GET_HISTORY);

    mockFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await getListingHistory("LST-1")).toEqual([]);
  });
});

describe("seller actions", () => {
  const bodyOf = (index = 0) => (mockFetch.mock.calls[index][1] as { body: Record<string, unknown> }).body;

  it("hide and archive send the acknowledgement as 1 / 0", async () => {
    mockFetch.mockResolvedValue(reply({ name: "LST-1" }));
    expect(await hideListing("LST-1", true)).toEqual({ ok: true, name: "LST-1" });
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.HIDE);
    expect(bodyOf(0)).toEqual({ name: "LST-1", acknowledged: 1 });

    await archiveListing("LST-1", false);
    expect(mockFetch.mock.calls[1][0]).toBe(LISTING_METHODS.ARCHIVE);
    expect(bodyOf(1)).toEqual({ name: "LST-1", acknowledged: 0 });
  });

  it("unhide sends just the name", async () => {
    mockFetch.mockResolvedValueOnce(reply({ name: "LST-1" }));
    await unhideListing("LST-1");
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.UNHIDE);
    expect(bodyOf()).toEqual({ name: "LST-1" });
  });

  it("every successful action refreshes the listing caches", async () => {
    mockFetch.mockResolvedValue(reply({ name: "LST-1" }));
    await hideListing("LST-1", true);
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.MINE);
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.PUBLIC);
  });

  it("a failed action returns the backend's message and refreshes nothing", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"_server_messages":"[\\"{\\\\\\"message\\\\\\": \\\\\\"This auction has started and cannot be stopped from here. Please contact staff.\\\\\\"}\\"]"}'),
    );
    expect(await archiveListing("LST-1", true)).toEqual({
      ok: false,
      error: "This auction has started and cannot be stopped from here. Please contact staff.",
    });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it("resubmit trims the note and sends none when it is blank", async () => {
    mockFetch.mockResolvedValue(reply({ name: "LST-1" }));
    await resubmitListing("LST-1", "  Replaced the photos.  ");
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.RESUBMIT);
    expect(bodyOf(0)).toEqual({ name: "LST-1", note: "Replaced the photos." });
    await resubmitListing("LST-1", "   ");
    expect(bodyOf(1).note).toBeUndefined();
  });

  it("update stock validates the quantity before calling the backend", async () => {
    expect(await updateStock("LST-1", -1)).toMatchObject({ ok: false });
    expect(await updateStock("LST-1", Number.NaN)).toMatchObject({ ok: false });
    expect(mockFetch).not.toHaveBeenCalled();

    mockFetch.mockResolvedValueOnce(reply({ name: "LST-1" }));
    expect(await updateStock("LST-1", 0)).toMatchObject({ ok: true });
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.UPDATE_STOCK);
    expect(bodyOf()).toEqual({ name: "LST-1", quantity_available: 0 });
  });

  it("duplicate converts auction times to the backend format", async () => {
    mockFetch.mockResolvedValueOnce(reply({ name: "LST-9" }));
    const result = await duplicateListing("LST-1", {
      acknowledged: true,
      minBid: 300,
      startTime: "2026-10-07T10:30",
      endTime: "2026-10-07T22:30",
    });
    expect(result).toEqual({ ok: true, name: "LST-9" });
    expect(mockFetch.mock.calls[0][0]).toBe(LISTING_METHODS.DUPLICATE);
    expect(bodyOf()).toEqual({
      name: "LST-1",
      auction_terms_acknowledged: 1,
      min_bid: 300,
      start_time: "2026-10-07 10:30:00",
      end_time: "2026-10-07 22:30:00",
    });
  });

  it("duplicate of a direct listing sends no auction fields", async () => {
    mockFetch.mockResolvedValueOnce(reply({ name: "LST-9" }));
    await duplicateListing("LST-1");
    expect(bodyOf()).toEqual({
      name: "LST-1",
      auction_terms_acknowledged: 0,
      min_bid: undefined,
      start_time: undefined,
      end_time: undefined,
    });
  });
});
