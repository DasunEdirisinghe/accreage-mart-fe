import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/listings", () => ({ getPriceSuggestion: vi.fn() }));

import { getPriceSuggestion } from "@/app/actions/listings";
import { PriceSuggestionBox } from "@/components/pages/listings/price-suggestion-box";
import type { PriceSuggestionView } from "@/types/listing.type";

const mockSuggest = vi.mocked(getPriceSuggestion);

beforeEach(() => vi.clearAllMocks());

function setup(view: PriceSuggestionView | null, props: Partial<React.ComponentProps<typeof PriceSuggestionBox>> = {}) {
  if (view) mockSuggest.mockResolvedValue(view);
  const onUse = vi.fn();
  render(<PriceSuggestionBox category="cat-1" unit="kg" sellingType="Direct" onUse={onUse} {...props} />);
  return onUse;
}

describe("PriceSuggestionBox", () => {
  it("asks for a category first, without calling the backend", () => {
    setup(null, { category: "" });
    expect(screen.getByText(/Choose a category/)).toBeInTheDocument();
    expect(mockSuggest).not.toHaveBeenCalled();
  });

  it("says clearly when the category has no price reference", async () => {
    setup({ state: "none", reason: "no_commodity" });
    expect(await screen.findByText(/no price reference set up for this category/)).toBeInTheDocument();
  });

  it("says clearly when the reference isn't accurate enough yet", async () => {
    setup({ state: "none", reason: "unreliable", commodityName: "Carrot" });
    expect(await screen.findByText(/isn't accurate enough yet/)).toBeInTheDocument();
  });

  it("says when the suggestion couldn't be loaded", async () => {
    setup({ state: "none", reason: "error" });
    expect(await screen.findByText(/Couldn't load the price suggestion/)).toBeInTheDocument();
  });

  it("offers a single price with its range and uses it on request", async () => {
    const user = userEvent.setup();
    const onUse = setup({ state: "available", commodityName: "Carrot", priceUnit: "kg", tier: "direct", price: 120.4, min: 100, max: 140 });
    expect(await screen.findByText("Wholesale reference for Carrot")).toBeInTheDocument();
    expect(screen.getByText(/Likely range/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Use this price/ }));
    expect(onUse).toHaveBeenCalledWith(120);
  });

  it("offers only a range when the forecast isn't accurate enough for a price, and uses the midpoint", async () => {
    const user = userEvent.setup();
    const onUse = setup({ state: "available", commodityName: "Carrot", priceUnit: "kg", tier: "range", min: 100, max: 140 });
    expect(await screen.findByText(/Only a range is shown/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Use this price/ }));
    expect(onUse).toHaveBeenCalledWith(120);
  });

  it("offers the value as a minimum bid for an auction", async () => {
    const user = userEvent.setup();
    const onUse = setup(
      { state: "available", commodityName: "Carrot", priceUnit: "kg", tier: "range", min: 100, max: 140 },
      { sellingType: "Auction" },
    );
    await user.click(await screen.findByRole("button", { name: /Use as minimum bid/ }));
    expect(onUse).toHaveBeenCalledWith(120);
  });

  it("warns when the seller's unit isn't the per-kg reference unit", async () => {
    setup({ state: "available", commodityName: "Coconut", priceUnit: "kg", tier: "range", min: 80, max: 100 }, { unit: "nut" });
    expect(await screen.findByText(/per kg, but you're selling per nut/)).toBeInTheDocument();
  });

  it("shows what the price is per, from the commodity", async () => {
    setup({ state: "available", commodityName: "Eggs - White", priceUnit: "egg", tier: "direct", price: 52, min: 48, max: 56 }, { unit: "piece" });
    expect(await screen.findByText(/per egg/)).toBeInTheDocument();
    expect(screen.queryByText(/Adjust it before you use it/)).not.toBeInTheDocument();
  });

  it("warns when an egg price is used for a dozen", async () => {
    setup({ state: "available", commodityName: "Eggs - White", priceUnit: "egg", tier: "direct", price: 52, min: 48, max: 56 }, { unit: "dozen" });
    expect(await screen.findByText(/This reference is per egg, but you're selling per dozen/)).toBeInTheDocument();
  });

  it("asks again when the category changes", async () => {
    mockSuggest.mockResolvedValue({ state: "none", reason: "no_commodity" });
    const { rerender } = render(<PriceSuggestionBox category="a" unit="kg" sellingType="Direct" onUse={() => {}} />);
    await screen.findByText(/no price reference/);
    rerender(<PriceSuggestionBox category="b" unit="kg" sellingType="Direct" onUse={() => {}} />);
    await screen.findByText(/no price reference/);
    expect(mockSuggest).toHaveBeenCalledTimes(2);
    expect(mockSuggest).toHaveBeenLastCalledWith("b");
  });
});
