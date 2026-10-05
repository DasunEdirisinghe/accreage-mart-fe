import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/actions/listing-review", () => ({
  approveListing: vi.fn(),
  rejectListing: vi.fn(),
  suspendListing: vi.fn(),
}));

import { approveListing, rejectListing, suspendListing } from "@/app/actions/listing-review";
import { ListingReviewView } from "@/components/pages/listing-review/listing-review-view";
import { blockedAction, makeReview } from "../../helpers/review";
import type { ReviewListingResponse } from "@/types/listing-review.type";

const mockApprove = vi.mocked(approveListing);
const mockReject = vi.mocked(rejectListing);
const mockSuspend = vi.mocked(suspendListing);

beforeEach(() => vi.clearAllMocks());

const withListing = (over: Record<string, unknown>, rest: Record<string, unknown> = {}): ReviewListingResponse => {
  const base = makeReview();
  return { ...base, ...rest, listing: { ...base.listing, ...over } } as ReviewListingResponse;
};

const auctionReview = (over: Record<string, unknown> = {}, rest: Record<string, unknown> = {}) =>
  withListing(
    {
      selling_type: "Auction",
      price_per_unit: null,
      min_order_qty: null,
      auction: {
        min_bid: 180,
        start_time: "2099-01-01 10:00:00",
        end_time: "2099-01-01 22:00:00",
        duration_hours: 12,
        status: "pending",
        bidding_enabled: false,
      },
      ...over,
    },
    rest,
  );

describe("ListingReviewView: the whole listing before any decision", () => {
  it("shows the listing as buyers will see it", () => {
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByText("As buyers will see it")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getAllByText(/Rs\. 150/).length).toBeGreaterThan(0);
    expect(screen.getByText(/400 kg available · minimum order 25 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Grade A carrots\./)).toBeInTheDocument();
    expect(screen.getByText("Carrot")).toBeInTheDocument();
    expect(screen.getByText(/Nuwara Eliya market, Nuwara Eliya/)).toBeInTheDocument();
    expect(screen.getByText("SLS organic 1234")).toBeInTheDocument();
    expect(screen.getByText("Organic")).toBeInTheDocument();
  });

  it("links the map pin to Google Maps", () => {
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByRole("link", { name: /Open in Google Maps/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=6.97,80.77",
    );
  });

  it("lets the reviewer step through the photos, the cover first", async () => {
    const user = userEvent.setup();
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByRole("img", { name: "Fresh Carrots" })).toHaveAttribute("src", expect.stringContaining("/files/lst-a.png"));
    await user.click(screen.getByRole("button", { name: "Show photo 2" }));
    expect(screen.getByRole("img", { name: "Fresh Carrots" })).toHaveAttribute("src", expect.stringContaining("/files/lst-b.png"));
    expect(screen.getByRole("button", { name: "Show photo 1 (cover)" })).toBeInTheDocument();
  });

  it("shows an auction's terms and lot", () => {
    render(<ListingReviewView data={auctionReview()} />);
    expect(screen.getByText("Auction")).toBeInTheDocument();
    expect(screen.getByText(/Min bid/)).toHaveTextContent("Rs. 180");
    expect(screen.getByText(/400 kg lot/)).toHaveTextContent("12 hours");
  });

  it("shows the seller's context", () => {
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByText("seller@farms.lk")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText(/125,000/)).toBeInTheDocument();
  });

  it("warns when the seller's account isn't verified or active", () => {
    const review = makeReview();
    review.review.seller = { ...review.review.seller, verified: false, account_status: "suspended" };
    render(<ListingReviewView data={review} />);
    expect(screen.getByText("Not verified")).toBeInTheDocument();
    expect(screen.getByText("suspended")).toBeInTheDocument();
  });
});

describe("ListingReviewView: price reference", () => {
  it("shows the AI range and how the seller's price compares", () => {
    const { rerender } = render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByText(/Suggested range at submission/)).toHaveTextContent("Rs. 100 – Rs. 140");
    expect(screen.getByText(/above the suggested range/)).toBeInTheDocument();

    rerender(<ListingReviewView data={withListing({ price_per_unit: 120 })} />);
    expect(screen.getByText(/within the suggested range/)).toBeInTheDocument();
    rerender(<ListingReviewView data={withListing({ price_per_unit: 90 })} />);
    expect(screen.getByText(/below the suggested range/)).toBeInTheDocument();
  });

  it("says when there was no suggestion", () => {
    const review = makeReview();
    review.review.ai_suggested_min = null;
    review.review.ai_suggested_max = null;
    render(<ListingReviewView data={review} />);
    expect(screen.getByText(/No price suggestion was available/)).toBeInTheDocument();
  });

  it("shows an auction's fair value", () => {
    const review = auctionReview();
    review.review.ai_fair_value = 195;
    render(<ListingReviewView data={review} />);
    expect(screen.getByText(/Fair value at the start date/)).toHaveTextContent("Rs. 195");
  });
});

describe("ListingReviewView: history", () => {
  it("shows earlier rejection reasons and the seller's resubmission note", () => {
    const review = makeReview();
    review.review.resubmission_note = "Replaced the photos.";
    review.review.history = [
      { name: "LRV-2", action: "Resubmitted", reason: null, seller_note: "Replaced the photos.", reviewer: "s@x.lk", reviewer_name: "Seller", reviewed_on: "2026-10-05 12:00:00" },
      { name: "LRV-1", action: "Rejected", reason: "Photos are blurry.", seller_note: null, reviewer: "staff@x.lk", reviewer_name: "Test Staff", reviewed_on: "2026-10-04 09:00:00" },
    ];
    render(<ListingReviewView data={review} />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText(/by Test Staff/)).toBeInTheDocument();
    expect(screen.getByText("Reason: Photos are blurry.")).toBeInTheDocument();
    expect(screen.getByText("Resubmitted by the seller")).toBeInTheDocument();
    expect(screen.getAllByText(/Replaced the photos\./).length).toBeGreaterThanOrEqual(2); // the note card and the history row
    expect(screen.getByText("Seller's note", { selector: "div" })).toBeInTheDocument();
  });

  it("says when there are no earlier decisions or edits", () => {
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByText("No earlier decisions on this listing.")).toBeInTheDocument();
    expect(screen.getByText("No edits recorded.")).toBeInTheDocument();
  });

  it("shows what the seller changed", () => {
    const review = makeReview();
    review.review.edit_history = [
      { user: "seller@farms.lk", at: "2026-10-05 10:00:00", changes: [{ field: "Title", old: "Carrots", new: "Fresh Carrots" }], table_rows_changed: 1 },
    ];
    render(<ListingReviewView data={review} />);
    expect(screen.getByText(/Title:/).parentElement).toHaveTextContent("Carrots → Fresh Carrots");
    expect(screen.getByText("Photos changed")).toBeInTheDocument();
  });
});

describe("ListingReviewView: which decisions are offered", () => {
  it("pending: approve and reject", () => {
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
  });

  it("published: only suspend", () => {
    const review = withListing(
      { status: "Approved" },
      { actions: { approve: blockedAction("x"), reject: blockedAction("y"), suspend: { allowed: true, blocked_reason: null } } },
    );
    render(<ListingReviewView data={review} />);
    expect(screen.getByRole("button", { name: "Suspend" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("suspended: the approve button becomes Reinstate", () => {
    const review = withListing(
      { status: "Suspended", status_reason: "Misleading photos." },
      { actions: { approve: { allowed: true, blocked_reason: null }, reject: blockedAction("y"), suspend: blockedAction("z") } },
    );
    render(<ListingReviewView data={review} />);
    expect(screen.getByRole("button", { name: "Reinstate" })).toBeEnabled();
    expect(screen.getByText(/last reason: Misleading photos\./)).toBeInTheDocument();
  });

  it("rejected and archived listings offer no decision", () => {
    render(<ListingReviewView data={withListing({ status: "Rejected" })} />);
    expect(screen.queryByRole("button", { name: /Approve|Reject|Suspend|Reinstate/ })).not.toBeInTheDocument();
  });

  it("disables approve and explains when an auction's start time has passed", () => {
    const review = auctionReview(
      {},
      { actions: { approve: blockedAction("The auction's start time has already passed. Ask the seller to reschedule it."), reject: { allowed: true, blocked_reason: null }, suspend: blockedAction("n/a") } },
    );
    render(<ListingReviewView data={review} />);
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("start time has already passed");
  });

  it("disables suspend and explains when a started auction has bids", () => {
    const review = auctionReview(
      { status: "Approved" },
      { actions: { approve: blockedAction("n/a"), reject: blockedAction("n/a"), suspend: blockedAction("This auction has bids and cannot be stopped.") } },
    );
    render(<ListingReviewView data={review} />);
    expect(screen.getByRole("button", { name: "Suspend" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("has bids and cannot be stopped");
  });
});

describe("ListingReviewView: deciding", () => {
  it("approves with an optional note, then returns to the queue with a banner", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValue({ ok: true });
    render(<ListingReviewView data={makeReview()} />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Approve this listing?");
    await user.type(within(dialog).getByLabelText(/Note to the seller/), "Looks good.");
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith("LST-00001", "2026-10-05 09:00:00.123456", "Looks good."));
    expect(push).toHaveBeenCalledWith("/admin/approvals?decided=LST-00001&as=approve");
  });

  it("can approve without any note", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValue({ ok: true });
    render(<ListingReviewView data={makeReview()} />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith("LST-00001", "2026-10-05 09:00:00.123456", ""));
  });

  it("rejecting needs a reason", async () => {
    const user = userEvent.setup();
    mockReject.mockResolvedValue({ ok: true });
    render(<ListingReviewView data={makeReview()} />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Reject listing" });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Reason for rejection/), "   ");
    expect(confirm).toBeDisabled();
    await user.clear(within(dialog).getByLabelText(/Reason for rejection/));
    await user.type(within(dialog).getByLabelText(/Reason for rejection/), "Photos are blurry.");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    await waitFor(() => expect(mockReject).toHaveBeenCalledWith("LST-00001", "2026-10-05 09:00:00.123456", "Photos are blurry."));
    expect(push).toHaveBeenCalledWith("/admin/approvals?decided=LST-00001&as=reject");
  });

  it("suspending needs a reason and says buyers with orders can still see it", async () => {
    const user = userEvent.setup();
    mockSuspend.mockResolvedValue({ ok: true });
    const review = withListing(
      { status: "Approved" },
      { actions: { approve: blockedAction("x"), reject: blockedAction("y"), suspend: { allowed: true, blocked_reason: null } } },
    );
    render(<ListingReviewView data={review} />);
    await user.click(screen.getByRole("button", { name: "Suspend" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/Buyers who already ordered it can still see it/);
    const confirm = within(dialog).getByRole("button", { name: "Suspend listing" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Reason for suspension/), "Misleading.");
    await user.click(confirm);
    await waitFor(() => expect(mockSuspend).toHaveBeenCalledWith("LST-00001", "2026-10-05 09:00:00.123456", "Misleading."));
  });

  it("reinstating a suspended listing is worded as such", async () => {
    const user = userEvent.setup();
    const review = withListing(
      { status: "Suspended" },
      { actions: { approve: { allowed: true, blocked_reason: null }, reject: blockedAction("y"), suspend: blockedAction("z") } },
    );
    render(<ListingReviewView data={review} />);
    await user.click(screen.getByRole("button", { name: "Reinstate" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Reinstate this listing?");
  });

  it("shows the backend's reason and stays put when a decision is refused", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValue({ ok: false, error: "The auction's start time has already passed.", stale: false });
    render(<ListingReviewView data={makeReview()} />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("start time has already passed");
    expect(push).not.toHaveBeenCalled();
  });

  it("asks the reviewer to reload when the seller changed the listing meanwhile", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValue({ ok: false, error: "This listing changed after you opened it.", stale: true });
    render(<ListingReviewView data={makeReview()} />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve" }));

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("This listing changed after you opened it. Reload it to review the latest version.");
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
    expect(push).not.toHaveBeenCalled();

    await user.click(within(banner).getByRole("button", { name: "Reload" }));
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("links back to the queue", () => {
    render(<ListingReviewView data={makeReview()} />);
    expect(screen.getByRole("link", { name: /Listing approvals/ })).toHaveAttribute("href", "/admin/approvals");
  });

  it("never nests a block element in a paragraph", () => {
    const review = makeReview();
    review.review.history = [{ name: "LRV-1", action: "Rejected", reason: "Blurry.", seller_note: null, reviewer: "s", reviewer_name: "Staff", reviewed_on: "2026-10-04 09:00:00" }];
    const { container } = render(<ListingReviewView data={review} />);
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});
