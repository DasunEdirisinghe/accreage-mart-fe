import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewQueueView } from "@/components/pages/listing-review/review-queue-view";
import { makeQueue, makeQueueItem } from "../../helpers/review";

describe("ReviewQueueView: tabs, search, paging", () => {
  it("shows a tab per status with its count", () => {
    render(<ReviewQueueView data={makeQueue()} tab="pending" />);
    const nav = screen.getByRole("navigation", { name: "Listing status" });
    expect(within(nav).getByRole("link", { name: /Pending Approval/ })).toHaveTextContent("3");
    expect(within(nav).getByRole("link", { name: /Published/ })).toHaveTextContent("5");
    expect(within(nav).getByRole("link", { name: /Suspended/ })).toHaveTextContent("2");
    expect(within(nav).getByRole("link", { name: /Archived/ })).toHaveTextContent("4");
  });

  it("links the tabs, keeping the search, and marks the current one", () => {
    render(<ReviewQueueView data={makeQueue()} tab="published" search="carrot" />);
    expect(screen.getByRole("link", { name: /Published/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Published/ })).toHaveAttribute("href", "/admin/approvals?tab=published&q=carrot");
    expect(screen.getByRole("link", { name: /Pending Approval/ })).toHaveAttribute("href", "/admin/approvals?q=carrot");
  });

  it("has a search box that keeps a non-default tab", () => {
    const { container } = render(<ReviewQueueView data={makeQueue()} tab="suspended" search="beans" />);
    expect(screen.getByLabelText("Search listings")).toHaveValue("beans");
    expect(container.querySelector('input[type="hidden"][name="tab"]')).toHaveValue("suspended");
  });

  it("pages forwards and back", () => {
    render(<ReviewQueueView data={makeQueue([makeQueueItem()], { page: 2, has_more: true })} tab="pending" />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/admin/approvals");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/admin/approvals?page=3");
  });

  it("says the queue is clear, or that nothing matched", () => {
    const { rerender } = render(<ReviewQueueView data={makeQueue([])} tab="pending" />);
    expect(screen.getByText("Queue is clear")).toBeInTheDocument();
    rerender(<ReviewQueueView data={makeQueue([])} tab="rejected" search="zzz" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("No listings match your search.")).toBeInTheDocument();
  });

  it("shows a banner after a decision", () => {
    render(<ReviewQueueView data={makeQueue()} tab="pending" decided={{ name: "LST-00007", kind: "reject" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Listing LST-00007 was rejected. The seller has been told.");
  });
});

describe("ReviewQueueView: rows", () => {
  it("shows both listing types in one queue, each linking to its review page", () => {
    render(
      <ReviewQueueView
        data={makeQueue([
          makeQueueItem({ name: "LST-1", title: "Fresh Carrots" }),
          makeQueueItem({
            name: "LST-2",
            title: "Banana lot",
            selling_type: "Auction",
            price_per_unit: null,
            auction: { min_bid: 180, start_time: "2099-01-01 10:00:00", end_time: "2099-01-01 22:00:00", start_passed: false },
          }),
        ])}
        tab="pending"
      />,
    );
    expect(screen.getByText("Direct")).toBeInTheDocument();
    expect(screen.getByText("Auction")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fresh Carrots" })).toHaveAttribute("href", "/admin/approvals/LST-1");
    expect(screen.getAllByRole("link", { name: "Review" })[1]).toHaveAttribute("href", "/admin/approvals/LST-2");
    expect(screen.getByText(/Min bid/)).toHaveTextContent("Rs. 180");
  });

  it("shows the seller, category and price", () => {
    render(<ReviewQueueView data={makeQueue()} tab="pending" />);
    expect(screen.getByText(/Test Farms/)).toHaveTextContent("Carrot");
    expect(screen.getByText(/Test Farms/)).toHaveTextContent("Rs. 150/kg");
  });

  it("marks listings that were rejected before, and resubmitted ones", () => {
    render(
      <ReviewQueueView
        data={makeQueue([makeQueueItem({ previous_rejections: 2, resubmitted: true })])}
        tab="pending"
      />,
    );
    expect(screen.getByText("Rejected before ×2")).toBeInTheDocument();
    expect(screen.getByText("Resubmitted")).toBeInTheDocument();
  });

  it("does not mark a first submission", () => {
    render(<ReviewQueueView data={makeQueue()} tab="pending" />);
    expect(screen.queryByText(/Rejected before/)).not.toBeInTheDocument();
    expect(screen.queryByText("Resubmitted")).not.toBeInTheDocument();
  });

  it("warns when an auction's start time has already passed", () => {
    render(
      <ReviewQueueView
        data={makeQueue([
          makeQueueItem({
            selling_type: "Auction",
            price_per_unit: null,
            auction: { min_bid: 180, start_time: "2020-01-01 10:00:00", end_time: "2020-01-01 22:00:00", start_passed: true },
          }),
        ])}
        tab="pending"
      />,
    );
    expect(screen.getByText("Start time has passed")).toBeInTheDocument();
  });

  it("has no approve or reject buttons in the list: decisions are made on the listing's page", () => {
    render(<ReviewQueueView data={makeQueue()} tab="pending" />);
    expect(screen.queryByRole("button", { name: /Approve|Reject|Suspend/ })).not.toBeInTheDocument();
  });

  it("never nests a block element in a paragraph", () => {
    const { container } = render(
      <ReviewQueueView
        data={makeQueue([
          makeQueueItem({ previous_rejections: 1, resubmitted: true }),
          makeQueueItem({
            name: "LST-2",
            selling_type: "Auction",
            price_per_unit: null,
            auction: { min_bid: 1, start_time: "2020-01-01 10:00:00", end_time: "2020-01-01 22:00:00", start_passed: true },
          }),
        ])}
        tab="pending"
        decided={{ name: "LST-9", kind: "approve" }}
      />,
    );
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});
