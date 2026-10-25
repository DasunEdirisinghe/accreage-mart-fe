import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  cancelAuction,
  getAuctionDetail,
  getBuyerBids,
  getSellerAuctions,
  placeBid,
  reviewAuction,
} from "@/app/actions/auctions";
import { frappeFetch } from "@/lib/frappe";

const mockFetch = vi.mocked(frappeFetch);

afterEach(() => vi.clearAllMocks());

describe("getAuctionDetail", () => {
  it("returns the auction + listing + bids from the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: {
          auction: {
            name: "AUC-1",
            min_bid: 100,
            start_time: "2026-01-01 10:00:00",
            end_time: "2026-01-02 10:00:00",
            status: "live",
            cancel_reason: null,
          },
          listing: {
            name: "LST-1",
            title: "Nuwara Eliya Carrots",
            unit: "kg",
            quantity_available: 200,
            seller_business_name: "Nuwara Fresh",
            seller: "pub-abc123",
          },
          bids: [],
          highest_bid: null,
        },
      }),
    } as Response);

    const detail = await getAuctionDetail("AUC-1");
    expect(detail?.auction.status).toBe("live");
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auctions.get_auction_detail");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ auction: "AUC-1" });
  });

  it("returns null on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 404 nope"));
    expect(await getAuctionDetail("AUC-404")).toBeNull();
  });
});

describe("placeBid", () => {
  it("posts the bid and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: {} }) } as Response);
    const result = await placeBid("AUC-1", 150);
    expect(result).toEqual({ ok: true });
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auctions.place_bid");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ auction: "AUC-1", amount: 150 });
  });

  it("reports the backend's error message on rejection", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message": "Your bid must exceed the current highest bid of 150."}'),
    );
    const result = await placeBid("AUC-1", 100);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("must exceed");
  });
});

describe("reviewAuction", () => {
  it("approves and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: {} }) } as Response);
    const result = await reviewAuction("AUC-1", "approve");
    expect(result).toEqual({ ok: true });
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auctions.review_auction");
    expect((init as { body: Record<string, unknown> }).body).toEqual({
      auction: "AUC-1",
      decision: "approve",
      reason: undefined,
    });
  });

  it("rejects with a reason", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: {} }) } as Response);
    await reviewAuction("AUC-1", "reject", "Lot details unclear");
    const [, init] = mockFetch.mock.calls[0];
    expect((init as { body: Record<string, unknown> }).body).toMatchObject({ reason: "Lot details unclear" });
  });
});

describe("cancelAuction", () => {
  it("cancels with a required reason", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: {} }) } as Response);
    const result = await cancelAuction("AUC-1", "Seller withdrew the lot");
    expect(result).toEqual({ ok: true });
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auctions.cancel_auction");
    expect((init as { body: Record<string, unknown> }).body).toEqual({
      auction: "AUC-1",
      reason: "Seller withdrew the lot",
    });
  });

  it("reports an error on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 417 nope"));
    const result = await cancelAuction("AUC-1", "reason");
    expect(result.ok).toBe(false);
  });
});

describe("getSellerAuctions", () => {
  it("returns the caller's auctions, paginated", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: { items: [], total: 0, page: 1, page_size: 12, has_more: false },
      }),
    } as Response);
    const data = await getSellerAuctions();
    expect(data?.items).toEqual([]);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auctions.list_seller_auctions");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ page: 1 });
  });

  it("returns null on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getSellerAuctions()).toBeNull();
  });
});

describe("getBuyerBids", () => {
  it("returns every auction the caller has bid on, paginated", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: { items: [], total: 0, page: 1, page_size: 12, has_more: false },
      }),
    } as Response);
    const data = await getBuyerBids(2);
    expect(data?.page).toBe(1); // mocked response, not re-derived — the call args are what matter here
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auctions.list_buyer_bids");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ page: 2 });
  });

  it("returns null on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getBuyerBids()).toBeNull();
  });
});
