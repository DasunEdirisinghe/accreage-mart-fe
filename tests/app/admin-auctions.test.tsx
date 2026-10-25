import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/listing-review", () => ({
  getReviewQueue: vi.fn(),
}));
vi.mock("@/app/actions/auctions", () => ({
  reviewAuction: vi.fn(),
  cancelAuction: vi.fn(),
}));

import { getReviewQueue } from "@/app/actions/listing-review";
import { cancelAuction, reviewAuction } from "@/app/actions/auctions";
import AuctionApprovalsPage from "@/app/admin/auctions/page";
import type { ReviewQueueItem, ReviewQueueResponse } from "@/types/listing-review.type";

const mockGetReviewQueue = vi.mocked(getReviewQueue);
const mockReviewAuction = vi.mocked(reviewAuction);
const mockCancelAuction = vi.mocked(cancelAuction);

const EMPTY: ReviewQueueResponse = {
  items: [],
  counts: { "Pending Approval": 0, Approved: 0, Rejected: 0, Hidden: 0, Suspended: 0, Archived: 0 },
  total: 0,
  page: 1,
  page_size: 12,
  has_more: false,
};

const pendingItem = (): ReviewQueueItem => ({
  name: "lst-pending",
  title: "Pending Lot",
  status: "Pending Approval",
  selling_type: "Auction",
  category_title: "Vegetables",
  unit: "kg",
  price_per_unit: null,
  quantity_available: 100,
  cover_image: null,
  seller_business_name: "Green Farm",
  submitted_on: "2026-10-20 10:00:00",
  modified: "2026-10-20 10:00:00",
  previous_rejections: 0,
  resubmitted: false,
  auction: {
    name: "auc-pending",
    min_bid: 100,
    start_time: "2099-01-01 10:00:00",
    end_time: "2099-01-02 10:00:00",
    start_passed: false,
    end_passed: false,
    cancelled: false,
  },
});

const activeItem = (over: Partial<ReviewQueueItem["auction"]> = {}): ReviewQueueItem => ({
  name: "lst-active",
  title: "Live Lot",
  status: "Approved",
  selling_type: "Auction",
  category_title: "Vegetables",
  unit: "kg",
  price_per_unit: null,
  quantity_available: 200,
  cover_image: null,
  seller_business_name: "Blue Farm",
  submitted_on: "2026-10-18 10:00:00",
  modified: "2026-10-18 10:00:00",
  previous_rejections: 0,
  resubmitted: false,
  auction: {
    name: "auc-active",
    min_bid: 150,
    start_time: "2026-10-01 10:00:00",
    end_time: "2099-01-02 10:00:00",
    start_passed: true,
    end_passed: false,
    cancelled: false,
    ...over,
  },
});

function mockQueues(pending: ReviewQueueItem[], approved: ReviewQueueItem[]) {
  mockGetReviewQueue.mockImplementation(async (query) => {
    if (query?.status === "Approved") return { ...EMPTY, items: approved };
    return { ...EMPTY, items: pending };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin auctions: Cancel control", () => {
  it("shows no Cancel button for an auction that has already ended or been cancelled", async () => {
    mockQueues([], [activeItem({ end_passed: true }), activeItem({ cancelled: true, name: "auc-cancelled" })]);
    render(<AuctionApprovalsPage />);
    await waitFor(() => expect(mockGetReviewQueue).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /Cancel/ })).not.toBeInTheDocument();
  });

  it("shows a Cancel button only for a scheduled/live auction, requires a reason, and calls cancel_auction", async () => {
    mockQueues([], [activeItem()]);
    mockCancelAuction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AuctionApprovalsPage />);

    await screen.findByText("Live Lot");
    await user.click(screen.getByRole("button", { name: /Cancel/ }));

    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Cancel auction" });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Reason for cancellation/), "Seller requested withdrawal.");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    await waitFor(() =>
      expect(mockCancelAuction).toHaveBeenCalledWith("auc-active", "Seller requested withdrawal."),
    );
  });

  it("reloads the queues after a successful cancellation", async () => {
    mockQueues([], [activeItem()]);
    mockCancelAuction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AuctionApprovalsPage />);

    await screen.findByText("Live Lot");
    await user.click(screen.getByRole("button", { name: /Cancel/ }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Reason for cancellation/), "Duplicate listing.");
    await user.click(within(dialog).getByRole("button", { name: "Cancel auction" }));

    await waitFor(() => expect(mockGetReviewQueue).toHaveBeenCalledTimes(4));
  });

  it("still wires Approve/Reject for pending auctions via review_auction", async () => {
    mockQueues([pendingItem()], []);
    mockReviewAuction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AuctionApprovalsPage />);

    await screen.findByText("Pending Lot");
    await user.click(screen.getByRole("button", { name: /Approve/ }));
    await waitFor(() => expect(mockReviewAuction).toHaveBeenCalledWith("auc-pending", "approve"));
  });
});
