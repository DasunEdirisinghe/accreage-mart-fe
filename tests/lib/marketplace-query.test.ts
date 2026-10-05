import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  marketplaceHref,
  parseMarketplaceParams,
  toBackendQuery,
} from "@/lib/marketplace-query";

describe("parseMarketplaceParams", () => {
  it("defaults to newest, page 1, no filters", () => {
    expect(parseMarketplaceParams({})).toEqual({
      q: undefined,
      category: undefined,
      district: undefined,
      type: undefined,
      organic: undefined,
      inStock: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      seller: undefined,
      sort: "newest",
      page: 1,
    });
  });

  it("reads every filter from the URL", () => {
    const filters = parseMarketplaceParams({
      q: " carrot ",
      category: "cat-1",
      district: "Kandy",
      type: "Auction",
      organic: "1",
      in_stock: "1",
      min_price: "100",
      max_price: "500.5",
      sort: "price_asc",
      page: "3",
    });
    expect(filters).toMatchObject({
      q: "carrot",
      category: "cat-1",
      district: "Kandy",
      type: "Auction",
      organic: true,
      inStock: true,
      minPrice: 100,
      maxPrice: 500.5,
      sort: "price_asc",
      page: 3,
    });
  });

  it("drops anything unknown or invalid", () => {
    const filters = parseMarketplaceParams({
      district: "Atlantis",
      type: "Barter",
      sort: "cheapest",
      min_price: "abc",
      max_price: "-5",
      page: "-2",
      organic: "yes",
    });
    expect(filters).toMatchObject({ district: undefined, type: undefined, sort: "newest", minPrice: undefined, maxPrice: undefined, page: 1, organic: undefined });
  });

  it("takes the first value when a parameter is repeated, and treats blanks as absent", () => {
    expect(parseMarketplaceParams({ q: ["a", "b"] }).q).toBe("a");
    expect(parseMarketplaceParams({ q: "   " }).q).toBeUndefined();
  });

  it("keeps a price of zero", () => {
    expect(parseMarketplaceParams({ min_price: "0" }).minPrice).toBe(0);
  });

  it("rounds a fractional page down", () => {
    expect(parseMarketplaceParams({ page: "2.9" }).page).toBe(2);
  });
});

describe("marketplaceHref", () => {
  const base = parseMarketplaceParams({});

  it("is just the path with no filters", () => {
    expect(marketplaceHref(base)).toBe("/marketplace");
  });

  it("writes only what is set, leaving defaults out", () => {
    const href = marketplaceHref({ ...base, q: "carrot", type: "Direct", organic: true, inStock: true, minPrice: 0, page: 2, sort: "price_desc" });
    expect(href).toBe("/marketplace?q=carrot&type=Direct&organic=1&in_stock=1&min_price=0&sort=price_desc&page=2");
  });

  it("round-trips through parse", () => {
    const filters = parseMarketplaceParams({ q: "rice", category: "c1", district: "Galle", min_price: "50", sort: "price_asc", page: "4" });
    const query = new URLSearchParams(marketplaceHref(filters).split("?")[1]);
    expect(parseMarketplaceParams(Object.fromEntries(query))).toEqual(filters);
  });

  it("supports another base path (the seller page)", () => {
    expect(marketplaceHref({ page: 3 }, "/sellers/abc")).toBe("/sellers/abc?page=3");
    expect(marketplaceHref({ page: 1 }, "/sellers/abc")).toBe("/sellers/abc");
  });

  it("encodes values safely", () => {
    expect(marketplaceHref({ ...base, q: "rice & dhal" })).toBe("/marketplace?q=rice+%26+dhal");
  });
});

describe("toBackendQuery", () => {
  it("maps filters to the backend's parameters", () => {
    const filters = parseMarketplaceParams({ q: "carrot", category: "c1", type: "Direct", organic: "1", in_stock: "1", min_price: "10", max_price: "20", sort: "price_asc", page: "2" });
    expect(toBackendQuery(filters, 8)).toEqual({
      search: "carrot",
      category: "c1",
      district: undefined,
      selling_type: "Direct",
      organic: 1,
      in_stock: 1,
      min_price: 10,
      max_price: 20,
      seller: undefined,
      sort: "price_asc",
      page: 2,
      page_size: 8,
    });
  });

  it("leaves flags out when they are off", () => {
    const query = toBackendQuery(parseMarketplaceParams({}));
    expect(query.organic).toBeUndefined();
    expect(query.in_stock).toBeUndefined();
  });
});

describe("activeFilterCount", () => {
  it("counts filters but not sort or page", () => {
    expect(activeFilterCount(parseMarketplaceParams({ sort: "price_asc", page: "3" }))).toBe(0);
    expect(activeFilterCount(parseMarketplaceParams({ q: "x", district: "Kandy", organic: "1", min_price: "0" }))).toBe(4);
  });
});
