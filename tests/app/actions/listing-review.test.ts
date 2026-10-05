import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import {
  approveListing,
  getListingForReview,
  getReviewQueue,
  rejectListing,
  suspendListing,
} from "@/app/actions/listing-review";
import { frappeFetch } from "@/lib/frappe";
import { REVIEW_METHODS } from "@/lib/methods";
import { LISTING_TAGS } from "@/lib/tags";
import { revalidateTag } from "next/cache";

const mockFetch = vi.mocked(frappeFetch);
const mockRevalidate = vi.mocked(revalidateTag);
const reply = (message: unknown) => ({ json: async () => ({ message }) }) as Response;
const bodyOf = (index = 0) => (mockFetch.mock.calls[index][1] as { body: Record<string, unknown> }).body;

/** A Frappe error like frappe.throw produces. */
const frappeError = (message: string) =>
  new Error(
    `Frappe request failed: 417 ${JSON.stringify({ _server_messages: JSON.stringify([JSON.stringify({ message })]) })}`,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("getReviewQueue", () => {
  it("asks for one status and returns the response", async () => {
    mockFetch.mockResolvedValueOnce(reply({ items: [{ name: "LST-1" }], total: 1 }));
    const result = await getReviewQueue({ status: "Suspended", search: "carrot", page: 2 });
    expect(result.items).toHaveLength(1);
    expect(mockFetch.mock.calls[0][0]).toBe(REVIEW_METHODS.LIST);
    expect(bodyOf()).toEqual({ status: "Suspended", search: "carrot", page: 2 });
  });

  it("defaults to page 1", async () => {
    mockFetch.mockResolvedValueOnce(reply({ items: [] }));
    await getReviewQueue();
    expect(bodyOf()).toMatchObject({ page: 1 });
  });

  it("returns an empty, well-formed queue on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    const result = await getReviewQueue();
    expect(result.items).toEqual([]);
    expect(result.counts["Pending Approval"]).toBe(0);
  });
});

describe("getListingForReview", () => {
  it("returns the review payload, or null when it can't be read", async () => {
    mockFetch.mockResolvedValueOnce(reply({ expected_modified: "t", listing: { name: "LST-1" } }));
    expect((await getListingForReview("LST-1"))?.expected_modified).toBe("t");
    expect(mockFetch.mock.calls[0][0]).toBe(REVIEW_METHODS.GET);
    expect(bodyOf()).toEqual({ name: "LST-1" });

    mockFetch.mockRejectedValueOnce(new Error("404"));
    expect(await getListingForReview("LST-2")).toBeNull();
  });
});

describe("decisions", () => {
  it("approve sends the version staff looked at and an optional trimmed note", async () => {
    mockFetch.mockResolvedValue(reply({ name: "LST-1" }));
    expect(await approveListing("LST-1", "2026-10-05 09:00:00.1", "  Looks good.  ")).toEqual({ ok: true });
    expect(mockFetch.mock.calls[0][0]).toBe(REVIEW_METHODS.APPROVE);
    expect(bodyOf(0)).toEqual({ name: "LST-1", expected_modified: "2026-10-05 09:00:00.1", note: "Looks good." });

    await approveListing("LST-1", "t", "   ");
    expect(bodyOf(1).note).toBeUndefined();
  });

  it("reject and suspend send a trimmed reason", async () => {
    mockFetch.mockResolvedValue(reply({ name: "LST-1" }));
    await rejectListing("LST-1", "t", "  Photos are blurry.  ");
    expect(mockFetch.mock.calls[0][0]).toBe(REVIEW_METHODS.REJECT);
    expect(bodyOf(0)).toEqual({ name: "LST-1", expected_modified: "t", reason: "Photos are blurry." });

    await suspendListing("LST-1", "t", "Misleading.");
    expect(mockFetch.mock.calls[1][0]).toBe(REVIEW_METHODS.SUSPEND);
    expect(bodyOf(1)).toEqual({ name: "LST-1", expected_modified: "t", reason: "Misleading." });
  });

  it("refreshes the public and seller listing caches after a decision", async () => {
    mockFetch.mockResolvedValue(reply({ name: "LST-1" }));
    await approveListing("LST-1", "t");
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.PUBLIC);
    expect(mockRevalidate).toHaveBeenCalledWith(LISTING_TAGS.MINE);
  });

  it("returns the backend's message for a refused decision, without refreshing anything", async () => {
    mockFetch.mockRejectedValueOnce(frappeError("The auction's start time has already passed. Ask the seller to reschedule it."));
    expect(await approveListing("LST-1", "t")).toEqual({
      ok: false,
      error: "The auction's start time has already passed. Ask the seller to reschedule it.",
      stale: false,
    });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it("flags a stale decision, so the page can ask the reviewer to reload", async () => {
    mockFetch.mockRejectedValueOnce(
      frappeError("This listing changed after you opened it. Reload it and review the latest version."),
    );
    const result = await rejectListing("LST-1", "old", "No");
    expect(result).toMatchObject({ ok: false, stale: true });
  });
});
