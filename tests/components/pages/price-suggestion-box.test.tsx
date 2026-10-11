import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/listings", () => ({ getPriceSuggestion: vi.fn() }));

import { getPriceSuggestion } from "@/app/actions/listings";
import { PriceSuggestionBox } from "@/components/pages/listings/price-suggestion-box";
import type { HorizonSuggestion, PriceSuggestionView } from "@/types/listing.type";

const mockSuggest = vi.mocked(getPriceSuggestion);

beforeEach(() => vi.clearAllMocks());

function setup(view: PriceSuggestionView | null, props: Partial<React.ComponentProps<typeof PriceSuggestionBox>> = {}) {
  if (view) mockSuggest.mockResolvedValue(view);
  const onUse = vi.fn();
  render(<PriceSuggestionBox category="cat-1" unit="kg" sellingType="Direct" onUse={onUse} {...props} />);
  return onUse;
}

const gatedOff = (horizon: HorizonSuggestion["horizon"]): HorizonSuggestion => ({ horizon, available: false });

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

  it("says clearly when suggestions have been turned off for the category", async () => {
    setup({ state: "none", reason: "disabled" });
    expect(await screen.findByText(/turned off for this category/)).toBeInTheDocument();
  });

  it("says clearly when every horizon failed its own gate", async () => {
    setup({ state: "none", reason: "unreliable", commodityName: "Carrot" });
    expect(await screen.findByText(/isn't accurate enough yet/)).toBeInTheDocument();
  });

  it("says when the suggestion couldn't be loaded", async () => {
    setup({ state: "none", reason: "error" });
    expect(await screen.findByText(/Couldn't load the price suggestion/)).toBeInTheDocument();
  });

  it("shows a price per horizon, labeled, and uses the near-horizon price on request", async () => {
    const user = userEvent.setup();
    const onUse = setup({
      state: "available",
      commodityName: "Carrot",
      priceUnit: "kg",
      horizons: [
        { horizon: "near", available: true, tier: "direct", price: 120.4, min: 100, max: 140 },
        gatedOff("mid"),
        gatedOff("long"),
      ],
    });
    expect(await screen.findByText("Wholesale reference for Carrot")).toBeInTheDocument();
    expect(screen.getByText("Valid 1–7 days")).toBeInTheDocument();
    expect(screen.getByText("Valid 8–14 days")).toBeInTheDocument();
    expect(screen.getByText("Valid 15–30 days")).toBeInTheDocument();
    expect(screen.getAllByText("Not accurate enough yet")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Use this price \(Rs\. 120\)/ }));
    expect(onUse).toHaveBeenCalledWith(120);
  });

  it("shows each horizon independently — one gated off between two available ones", async () => {
    setup({
      state: "available",
      commodityName: "Carrot",
      priceUnit: "kg",
      horizons: [
        { horizon: "near", available: true, tier: "direct", price: 120, min: 100, max: 140 },
        gatedOff("mid"),
        { horizon: "long", available: true, tier: "direct", price: 300, min: 280, max: 320 },
      ],
    });
    expect(await screen.findByRole("button", { name: /Use this price \(Rs\. 120\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use this price \(Rs\. 300\)/ })).toBeInTheDocument();
    expect(screen.getByText("Not accurate enough yet")).toBeInTheDocument();
  });

  it("offers only a range when a horizon's forecast isn't accurate enough for a price, and uses the midpoint", async () => {
    const user = userEvent.setup();
    const onUse = setup({
      state: "available",
      commodityName: "Carrot",
      priceUnit: "kg",
      horizons: [{ horizon: "near", available: true, tier: "range", min: 100, max: 140 }, gatedOff("mid"), gatedOff("long")],
    });
    expect(await screen.findByText(/Only a range/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Use this price/ }));
    expect(onUse).toHaveBeenCalledWith(120);
  });

  it("offers the value as a minimum bid for an auction", async () => {
    const user = userEvent.setup();
    const onUse = setup(
      {
        state: "available",
        commodityName: "Carrot",
        priceUnit: "kg",
        horizons: [{ horizon: "near", available: true, tier: "range", min: 100, max: 140 }, gatedOff("mid"), gatedOff("long")],
      },
      { sellingType: "Auction" },
    );
    await user.click(await screen.findByRole("button", { name: /Use as minimum bid/ }));
    expect(onUse).toHaveBeenCalledWith(120);
  });

  it("warns when the seller's unit isn't the per-kg reference unit", async () => {
    setup(
      {
        state: "available",
        commodityName: "Coconut",
        priceUnit: "kg",
        horizons: [{ horizon: "near", available: true, tier: "range", min: 80, max: 100 }, gatedOff("mid"), gatedOff("long")],
      },
      { unit: "nut" },
    );
    expect(await screen.findByText(/per kg, but you're selling per nut/)).toBeInTheDocument();
  });

  it("shows what the price is per, from the commodity", async () => {
    setup(
      {
        state: "available",
        commodityName: "Eggs - White",
        priceUnit: "egg",
        horizons: [{ horizon: "near", available: true, tier: "direct", price: 52, min: 48, max: 56 }, gatedOff("mid"), gatedOff("long")],
      },
      { unit: "piece" },
    );
    expect(await screen.findByText(/per egg/)).toBeInTheDocument();
    expect(screen.queryByText(/Adjust it before you use it/)).not.toBeInTheDocument();
  });

  it("warns when an egg price is used for a dozen", async () => {
    setup(
      {
        state: "available",
        commodityName: "Eggs - White",
        priceUnit: "egg",
        horizons: [{ horizon: "near", available: true, tier: "direct", price: 52, min: 48, max: 56 }, gatedOff("mid"), gatedOff("long")],
      },
      { unit: "dozen" },
    );
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
