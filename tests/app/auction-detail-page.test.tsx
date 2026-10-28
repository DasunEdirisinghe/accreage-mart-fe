import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "auc-1" }),
}));
vi.mock("@/app/actions/auctions", () => ({
  getAuctionDetail: vi.fn(),
  placeBid: vi.fn(),
}));

import { getAuctionDetail, placeBid } from "@/app/actions/auctions";
import AuctionDetailPage from "@/app/(site)/auctions/[id]/page";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import type { CurrentUserInfo } from "@/lib/current-user-info";
import type { AuctionDetailResponse } from "@/types/auctions.type";

const mockGetAuctionDetail = vi.mocked(getAuctionDetail);
const mockPlaceBid = vi.mocked(placeBid);

const buyer: CurrentUserInfo = {
  id: "buyer@demo.accreagemart.lk",
  email: "buyer@demo.accreagemart.lk",
  fullName: "Demo Buyer",
  phone: "+94 77 000 0000",
  role: "buyer",
  status: "active",
  verified: true,
};

function renderAsBuyer() {
  return render(
    <CurrentUserProvider initialUser={buyer}>
      <AuctionDetailPage />
    </CurrentUserProvider>,
  );
}

const detail = (over: Partial<AuctionDetailResponse["auction"]> = {}): AuctionDetailResponse => ({
  auction: {
    name: "auc-1",
    min_bid: 100,
    start_time: "2026-01-01 10:00:00",
    end_time: "2099-01-01 10:00:00",
    status: "live",
    cancel_reason: null,
    ...over,
  },
  listing: {
    name: "lst-1",
    title: "Fresh Carrots Lot",
    description: "Freshly harvested carrots, graded and ready for wholesale.",
    category: { name: "cat-1", title: "Carrot", area: "Vegetables" },
    unit: "kg",
    quantity_available: 300,
    district: "Nuwara Eliya",
    location: "Nuwara Eliya market",
    latitude: null,
    longitude: null,
    map_url: null,
    organic: false,
    certification: null,
    images: [],
    cover_image: null,
    created: "2026-01-01 09:00:00",
    seller: { public_id: "pub-1", business_name: "Green Farm", trust_score: 4.5, district: "Nuwara Eliya", verified: true },
  },
  bids: [],
  highest_bid: null,
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("auction detail page: silent polling", () => {
  it("polls while live without ever re-showing a loading state, and updates the highest bid in place", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const updated: AuctionDetailResponse = {
      ...detail(),
      highest_bid: {
        name: "bid-1",
        auction: "auc-1",
        bidder: "other@x.lk",
        amount: 150,
        bid_time: "2026-10-25 10:00:00",
      },
    };
    mockGetAuctionDetail.mockResolvedValueOnce(detail()).mockResolvedValueOnce(updated);

    renderAsBuyer();

    expect(await screen.findByText("Fresh Carrots Lot")).toBeInTheDocument();
    expect(screen.getByText("Starting bid")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });

    await waitFor(() => expect(screen.getByText("Current highest bid")).toBeInTheDocument());
    // The page never unmounts/remounts on a poll refresh: the same heading stays in the DOM.
    expect(screen.getByText("Fresh Carrots Lot")).toBeInTheDocument();
    expect(mockGetAuctionDetail).toHaveBeenCalledTimes(2);
  });

  it("stops polling once the auction is no longer live", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetAuctionDetail.mockResolvedValue(detail({ status: "ended" }));

    renderAsBuyer();
    await screen.findByText("Fresh Carrots Lot");
    expect(mockGetAuctionDetail).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(mockGetAuctionDetail).toHaveBeenCalledTimes(1);
  });

  it("ignores a transient failed poll instead of flashing to a not-found state", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetAuctionDetail.mockResolvedValueOnce(detail()).mockResolvedValueOnce(null);

    renderAsBuyer();
    await screen.findByText("Fresh Carrots Lot");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });
    await waitFor(() => expect(mockGetAuctionDetail).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Fresh Carrots Lot")).toBeInTheDocument();
    expect(screen.queryByText("Auction not found")).not.toBeInTheDocument();
  });
});

describe("auction detail page: bid-form validation", () => {
  it("rejects a bid that doesn't exceed min_bid with no bids yet, before any submit", async () => {
    mockGetAuctionDetail.mockResolvedValue(detail());
    const user = userEvent.setup();
    renderAsBuyer();

    const input = await screen.findByLabelText(/Your bid/);
    await user.type(input, "100");

    expect(screen.getByRole("alert")).toHaveTextContent(/must be more than/i);
    expect(screen.getByRole("button", { name: /Place bid/ })).toBeDisabled();
    expect(mockPlaceBid).not.toHaveBeenCalled();
  });

  it("rejects a bid at or below the current highest bid", async () => {
    mockGetAuctionDetail.mockResolvedValue({
      ...detail(),
      highest_bid: { name: "bid-1", auction: "auc-1", bidder: "other@x.lk", amount: 200, bid_time: "2026-10-25 10:00:00" },
    });
    const user = userEvent.setup();
    renderAsBuyer();

    const input = await screen.findByLabelText(/Your bid/);
    await user.type(input, "200");
    expect(screen.getByRole("alert")).toHaveTextContent(/must be more than/i);
    expect(screen.getByRole("button", { name: /Place bid/ })).toBeDisabled();
  });

  it("allows a bid that exceeds the current highest and submits it", async () => {
    mockGetAuctionDetail.mockResolvedValue({
      ...detail(),
      highest_bid: { name: "bid-1", auction: "auc-1", bidder: "other@x.lk", amount: 200, bid_time: "2026-10-25 10:00:00" },
    });
    mockPlaceBid.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderAsBuyer();

    const input = await screen.findByLabelText(/Your bid/);
    await user.type(input, "201");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Place bid/ });
    expect(button).toBeEnabled();

    await user.click(button);
    await waitFor(() => expect(mockPlaceBid).toHaveBeenCalledWith("auc-1", 201));
  });
});
