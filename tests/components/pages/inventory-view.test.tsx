import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/listings", () => ({
  unhideListing: vi.fn(),
  hideListing: vi.fn(),
  archiveListing: vi.fn(),
  resubmitListing: vi.fn(),
  updateStock: vi.fn(async () => ({ ok: true })),
  duplicateListing: vi.fn(),
  getListingActionInfo: vi.fn(),
  getListingHistory: vi.fn(),
}));

import { updateStock } from "@/app/actions/listings";
import { InventoryView, sortByStockUrgency } from "@/components/pages/listings/inventory-view";
import type { MyListingsResponse } from "@/types/listing.type";
import { makeMyListing } from "../../helpers/my-listing";

beforeEach(() => vi.clearAllMocks());

const response = (items = [makeMyListing()], over: Partial<MyListingsResponse> = {}): MyListingsResponse => ({
  items,
  counts: { pending: 0, live: 0, hidden: 0, rejected: 0, suspended: 0, archived: 0 },
  total: items.length,
  page: 1,
  page_size: 24,
  has_more: false,
  ...over,
});

describe("sortByStockUrgency", () => {
  it("puts out of stock first, then low, keeping the order within each group", () => {
    const sorted = sortByStockUrgency([
      makeMyListing({ name: "ok1", stock_state: "in_stock" }),
      makeMyListing({ name: "low1", stock_state: "low_stock" }),
      makeMyListing({ name: "out1", stock_state: "out_of_stock" }),
      makeMyListing({ name: "ok2", stock_state: "in_stock" }),
      makeMyListing({ name: "low2", stock_state: "low_stock" }),
    ]);
    expect(sorted.map((i) => i.name)).toEqual(["out1", "low1", "low2", "ok1", "ok2"]);
  });
});

describe("InventoryView", () => {
  it("lists each listing with its stock, alert level and status", () => {
    render(<InventoryView data={response([makeMyListing({ quantity_available: 1500, low_stock_level: 200 })])} />);
    const row = screen.getByRole("row", { name: /Fresh Carrots/ });
    expect(within(row).getByText("1,500 kg")).toBeInTheDocument();
    expect(within(row).getByText("200 kg")).toBeInTheDocument();
    expect(within(row).getByText("Published")).toBeInTheDocument();
    expect(within(row).getByText("In stock")).toBeInTheDocument();
  });

  it("shows 'Not set' when there is no alert level", () => {
    render(<InventoryView data={response()} />);
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("summarises how many are out of stock or running low, and lists them first", () => {
    render(
      <InventoryView
        data={response([
          makeMyListing({ name: "A", title: "Fine one" }),
          makeMyListing({ name: "B", title: "Low one", stock_state: "low_stock" }),
          makeMyListing({ name: "C", title: "Empty one", stock_state: "out_of_stock", quantity_available: 0 }),
        ])}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 out of stock · 1 running low");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Empty one");
    expect(rows[1]).toHaveTextContent("Low one");
    expect(rows[2]).toHaveTextContent("Fine one");
  });

  it("shows no warning when everything is fine", () => {
    render(<InventoryView data={response()} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("updates stock through the dialog and refreshes", async () => {
    const user = userEvent.setup();
    render(<InventoryView data={response([makeMyListing({ quantity_available: 500 })])} />);
    await user.click(screen.getByRole("button", { name: "Update stock" }));
    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText(/Quantity available/));
    await user.type(within(dialog).getByLabelText(/Quantity available/), "80");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(updateStock).toHaveBeenCalledWith("LST-00001", 80);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("disables stock updates on a suspended listing", () => {
    render(<InventoryView data={response([makeMyListing({ status: "Suspended" })])} />);
    expect(screen.getByRole("button", { name: "Update stock" })).toBeDisabled();
  });

  it("says so when there is nothing to track", () => {
    render(<InventoryView data={response([])} />);
    expect(screen.getByText("No stock to track")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create listing" })).toHaveAttribute("href", "/seller/listings/new");
  });

  it("pages through a long list", () => {
    render(<InventoryView data={response([makeMyListing()], { page: 2, has_more: true })} />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/seller/inventory?page=1");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/seller/inventory?page=3");
  });
});
