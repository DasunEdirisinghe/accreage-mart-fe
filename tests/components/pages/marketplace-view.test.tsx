import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MarketplaceView } from "@/components/pages/marketplace/marketplace-view";
import { parseMarketplaceParams } from "@/lib/marketplace-query";
import type { ListingCategoryOption } from "@/types/listing.type";
import { makeAuctionCard, makeCard, makeMarketplace } from "../../helpers/marketplace";

const categories: ListingCategoryOption[] = [
  { name: "cat-carrot", title: "Carrot", area: "Vegetables" },
  { name: "cat-rice", title: "Nadu Rice", area: "Rice" },
];

const view = (data = makeMarketplace(), params: Record<string, string> = {}) =>
  render(<MarketplaceView data={data} filters={parseMarketplaceParams(params)} categories={categories} />);

describe("MarketplaceView: results", () => {
  it("shows the count and a card for each listing, both types together", () => {
    view(makeMarketplace([makeCard(), makeAuctionCard()], { total: 2 }));
    expect(screen.getByText("2 listings found")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Embul Kesel lot" })).toBeInTheDocument();
  });

  it("uses the singular for one listing", () => {
    view(makeMarketplace([makeCard()], { total: 1 }));
    expect(screen.getByText("1 listing found")).toBeInTheDocument();
  });

  it("says there are no listings yet, with no clear-filters button", () => {
    view(makeMarketplace([], { total: 0 }));
    expect(screen.getByText("No listings yet")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("says nothing matched when filters are on, and offers to clear them", () => {
    view(makeMarketplace([], { total: 0 }), { q: "zzz" });
    expect(screen.getByText("No listings match your filters")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/marketplace");
  });

  it("titles the page after the chosen category", () => {
    view(makeMarketplace(), { category: "cat-rice" });
    expect(screen.getByRole("heading", { level: 1, name: "Nadu Rice" })).toBeInTheDocument();
  });

  it("is titled Marketplace otherwise", () => {
    view();
    expect(screen.getByRole("heading", { level: 1, name: "Marketplace" })).toBeInTheDocument();
  });
});

describe("MarketplaceView: paging", () => {
  it("links previous and next, keeping the filters", () => {
    view(makeMarketplace([makeCard()], { page: 2, has_more: true }), { q: "carrot", sort: "price_asc", page: "2" });
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/marketplace?q=carrot&sort=price_asc");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/marketplace?q=carrot&sort=price_asc&page=3");
  });

  it("shows no pager for a single page", () => {
    view();
    expect(screen.queryByRole("navigation", { name: "Pages" })).not.toBeInTheDocument();
  });
});

describe("MarketplaceView: the filter form", () => {
  it("is a GET form, so every filtered view has its own URL", () => {
    const { container } = view();
    const form = container.querySelector("form")!;
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/marketplace");
  });

  it("fills the form from the current filters", () => {
    view(makeMarketplace(), {
      q: "carrot",
      type: "Auction",
      organic: "1",
      in_stock: "1",
      min_price: "10",
      max_price: "99",
      sort: "price_desc",
    });
    expect(screen.getByLabelText("Search")).toHaveValue("carrot");
    expect(screen.getByLabelText("Selling type")).toHaveValue("Auction");
    expect(screen.getByRole("checkbox", { name: "Organic only" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "In stock only" })).toBeChecked();
    expect(screen.getByLabelText("Minimum price")).toHaveValue(10);
    expect(screen.getByLabelText("Maximum price")).toHaveValue(99);
    expect(screen.getByLabelText("Sort by")).toHaveValue("price_desc");
  });

  it("offers the sort options", () => {
    view();
    const options = within(screen.getByLabelText("Sort by")).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Newest first", "Price: low to high", "Price: high to low"]);
  });

  it("has a searchable category list from the backend, with an 'All categories' choice", async () => {
    const user = userEvent.setup();
    view();
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.type(screen.getByPlaceholderText("Search categories"), "rice");
    const list = within(screen.getByRole("listbox"));
    expect(list.getAllByRole("option")).toHaveLength(1);
    expect(list.getByRole("option", { name: /Nadu Rice/ })).toBeInTheDocument();
  });

  it("submits the chosen category and district as form fields", async () => {
    const user = userEvent.setup();
    const { container } = view();
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: /Carrot/ }));
    await user.click(screen.getByRole("combobox", { name: "District" }));
    await user.click(screen.getByRole("option", { name: "Kandy" }));
    expect(container.querySelector('input[name="category"]')).toHaveValue("cat-carrot");
    expect(container.querySelector('input[name="district"]')).toHaveValue("Kandy");
  });

  it("shows how many filters are applied, with a reset", () => {
    view(makeMarketplace(), { q: "x", organic: "1" });
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset" })).toHaveAttribute("href", "/marketplace");
  });

  it("has no reset when nothing is filtered", () => {
    view(makeMarketplace(), {});
    expect(screen.queryByRole("link", { name: "Reset" })).not.toBeInTheDocument();
  });
});
