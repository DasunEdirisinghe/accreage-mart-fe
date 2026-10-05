import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/listings", () => ({
  unhideListing: vi.fn(async () => ({ ok: true })),
  hideListing: vi.fn(),
  archiveListing: vi.fn(),
  resubmitListing: vi.fn(),
  updateStock: vi.fn(),
  duplicateListing: vi.fn(),
  getListingActionInfo: vi.fn(async () => null),
  getListingHistory: vi.fn(async () => []),
}));

import { unhideListing } from "@/app/actions/listings";
import { MyListingsView } from "@/components/pages/listings/my-listings-view";
import type { MyListingsResponse } from "@/types/listing.type";
import { makeAuctionListing, makeMyListing } from "../../helpers/my-listing";

const counts = { pending: 1, live: 2, hidden: 1, rejected: 1, suspended: 0, archived: 3 };
const data = (items = [makeMyListing()], over: Partial<MyListingsResponse> = {}): MyListingsResponse => ({
  items,
  counts,
  total: items.length,
  page: 1,
  page_size: 12,
  has_more: false,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("MyListingsView: tabs, search, paging", () => {
  it("shows a tab per status with its count, All being the sum", () => {
    render(<MyListingsView data={data()} />);
    const nav = screen.getByRole("navigation", { name: "Listing status" });
    expect(within(nav).getByRole("link", { name: /^All/ })).toHaveTextContent("8");
    expect(within(nav).getByRole("link", { name: /Pending Approval/ })).toHaveTextContent("1");
    expect(within(nav).getByRole("link", { name: /Published/ })).toHaveTextContent("2");
    expect(within(nav).getByRole("link", { name: /Archived/ })).toHaveTextContent("3");
  });

  it("links each tab and marks the current one", () => {
    render(<MyListingsView data={data()} tab="live" search="carrot" />);
    expect(screen.getByRole("link", { name: /Published/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Published/ })).toHaveAttribute("href", "/seller/listings?tab=live&q=carrot");
    expect(screen.getByRole("link", { name: /^All/ })).toHaveAttribute("href", "/seller/listings?q=carrot");
  });

  it("has a search box that keeps the current tab", () => {
    const { container } = render(<MyListingsView data={data()} tab="hidden" search="beans" />);
    expect(screen.getByLabelText("Search your listings")).toHaveValue("beans");
    expect(container.querySelector('input[type="hidden"][name="tab"]')).toHaveValue("hidden");
  });

  it("pages forwards and back, keeping the tab and search", () => {
    render(<MyListingsView data={data([makeMyListing()], { page: 2, has_more: true })} tab="live" search="x" />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/seller/listings?tab=live&q=x");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/seller/listings?tab=live&q=x&page=3");
  });

  it("shows no pager for a single page", () => {
    render(<MyListingsView data={data()} />);
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });

  it("says so when there are no listings at all, and offers to create one", () => {
    render(<MyListingsView data={{ ...data([]), counts: { pending: 0, live: 0, hidden: 0, rejected: 0, suspended: 0, archived: 0 } }} />);
    expect(screen.getByText("No listings yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create listing" })).toHaveAttribute("href", "/seller/listings/new");
  });

  it("says nothing matched when a tab or search is empty", () => {
    render(<MyListingsView data={data([])} tab="suspended" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText(/no listings with this status/)).toBeInTheDocument();
  });

  it("shows a banner after a listing was submitted or updated", () => {
    const { rerender } = render(<MyListingsView data={data()} flash={{ submitted: "LST-1" }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/waiting for staff approval/);
    rerender(<MyListingsView data={data()} flash={{ updated: "LST-1" }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/changes were saved/);
  });
});

describe("MyListingsView: a listing's card", () => {
  it("shows the status as the SRS word, the type and the details", () => {
    render(<MyListingsView data={data([makeMyListing({ status: "Approved", quantity_available: 1500 })])} />);
    const card = screen.getByRole("heading", { name: "Fresh Carrots" }).closest("div")!.parentElement!;
    expect(within(card).getByText("Published")).toBeInTheDocument();
    expect(within(card).getByText("Direct")).toBeInTheDocument();
    expect(card).toHaveTextContent("Carrot");
    expect(card).toHaveTextContent("Kandy");
    expect(card).toHaveTextContent("1,500 kg available");
  });

  it("flags low and out-of-stock", () => {
    render(
      <MyListingsView
        data={data([
          makeMyListing({ name: "A", title: "Low one", stock_state: "low_stock" }),
          makeMyListing({ name: "B", title: "Empty one", stock_state: "out_of_stock", quantity_available: 0 }),
        ])}
      />,
    );
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("explains a pending listing", () => {
    render(<MyListingsView data={data([makeMyListing({ status: "Pending Approval" })])} />);
    expect(screen.getByText(/Waiting for staff approval. Buyers can't see this listing yet./)).toBeInTheDocument();
  });

  it("shows the rejection reason and offers resubmit", () => {
    render(<MyListingsView data={data([makeMyListing({ status: "Rejected", status_reason: "Photos are blurry." })])} />);
    expect(screen.getByText(/Photos are blurry./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resubmit" })).toBeInTheDocument();
  });

  it("shows the suspension reason and blocks editing", () => {
    render(<MyListingsView data={data([makeMyListing({ status: "Suspended", status_reason: "Misleading photos." })])} />);
    expect(screen.getByText(/Suspended by staff:/)).toBeInTheDocument();
    expect(screen.getByText(/Misleading photos./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Hide" })).not.toBeInTheDocument();
  });

  it("offers duplicate for an archived listing, and nothing else to change it", () => {
    render(<MyListingsView data={data([makeMyListing({ status: "Archived" })])} />);
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("links Edit to the edit page", () => {
    render(<MyListingsView data={data([makeMyListing({ name: "LST-00042" })])} />);
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/seller/listings/LST-00042/edit");
  });

  it("shows an auction's terms and no stock button", () => {
    const listing = makeAuctionListing("scheduled", {
      auction: { min_bid: 300, start_time: "2099-01-01 10:00:00", end_time: "2099-01-01 22:00:00", duration_hours: 12, status: "scheduled", bidding_enabled: false },
    });
    render(<MyListingsView data={data([listing])} />);
    expect(screen.getByText("Auction")).toBeInTheDocument();
    expect(screen.getByText(/Min bid/)).toHaveTextContent("Rs. 300");
    expect(screen.getByText("scheduled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update stock" })).not.toBeInTheDocument();
  });

  it("disables hide and archive on a live auction and says why", () => {
    const listing = makeAuctionListing("live", {
      auction: { min_bid: 300, start_time: "2020-01-01 10:00:00", end_time: "2099-01-01 22:00:00", duration_hours: 12, status: "live", bidding_enabled: false },
    });
    render(<MyListingsView data={data([listing])} />);
    expect(screen.getByRole("button", { name: "Hide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Archive" })).toBeDisabled();
    expect(screen.getByText(/can't be stopped from here. Please contact staff./)).toBeInTheDocument();
  });

  it("shows your resubmission note on a pending listing", () => {
    render(<MyListingsView data={data([makeMyListing({ status: "Pending Approval", resubmission_note: "New photos." })])} />);
    expect(screen.getByText(/Your note to staff: New photos./)).toBeInTheDocument();
  });
});

describe("MyListingsView: valid HTML", () => {
  it("never nests a block element inside a paragraph (that breaks hydration)", () => {
    const future = { min_bid: 300, start_time: "2099-01-01 10:00:00", end_time: "2099-01-01 22:00:00", duration_hours: 12, status: "scheduled", bidding_enabled: false };
    const listings = [
      makeMyListing({ name: "A", status: "Approved", stock_state: "low_stock" }),
      makeMyListing({ name: "B", status: "Rejected", status_reason: "Photos are blurry." }),
      makeMyListing({ name: "C", status: "Suspended", status_reason: "Misleading." }),
      makeMyListing({ name: "D", status: "Pending Approval", resubmission_note: "New photos." }),
      makeAuctionListing("scheduled", { name: "E", auction: future }),
    ];
    const { container } = render(<MyListingsView data={data(listings)} flash={{ submitted: "A" }} />);
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});

describe("MyListingsView: actions", () => {
  it("opens the history dialog", async () => {
    const user = userEvent.setup();
    render(<MyListingsView data={data()} />);
    await user.click(screen.getByRole("button", { name: /History/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Review history");
  });

  it("opens the hide dialog and the archive dialog from their buttons", async () => {
    const user = userEvent.setup();
    render(<MyListingsView data={data()} />);
    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Hide this listing?");
  });

  it("shows a hidden listing again without a dialog, then refreshes", async () => {
    const user = userEvent.setup();
    render(<MyListingsView data={data([makeMyListing({ status: "Hidden" })])} />);
    await user.click(screen.getByRole("button", { name: "Show again" }));
    expect(unhideListing).toHaveBeenCalledWith("LST-00001");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
