import { describe, expect, it } from "vitest";

import {
  formDataToValues,
  makeListingSchema,
  toCreateBody,
  toUpdateValues,
} from "@/lib/listing-schema";
import { siteNow } from "@/lib/listing-time";
import type { ListingFormValues } from "@/types/listing.type";

/** A wall-clock time `hours` from now in Sri Lanka, as a datetime-local value. */
function inHours(hours: number): string {
  return siteNow(new Date(Date.now() + hours * 3_600_000));
}

const direct = (over: Partial<ListingFormValues> = {}): ListingFormValues => ({
  selling_type: "Direct",
  category: "cat-1",
  title: "Fresh Carrots",
  description: "Grade A",
  unit: "kg",
  quantity_available: "500",
  price_per_unit: "120",
  min_order_qty: "",
  low_stock_level: "",
  district: "Kandy",
  location: "Kandy market",
  latitude: "",
  longitude: "",
  organic: false,
  certification: "",
  images: [{ image: "/files/lst-a.png", is_cover: true }],
  min_bid: "",
  start_time: "",
  end_time: "",
  auction_terms_acknowledged: false,
  ...over,
});

const auction = (over: Partial<ListingFormValues> = {}): ListingFormValues =>
  direct({
    selling_type: "Auction",
    price_per_unit: "",
    min_bid: "300",
    start_time: inHours(30),
    end_time: inHours(42),
    auction_terms_acknowledged: true,
    ...over,
  });

const create = makeListingSchema({ requireAcknowledgement: true });
const errorsOf = (values: ListingFormValues, schema = create) => {
  const result = schema.safeParse(values);
  return result.success ? {} : result.error.flatten().fieldErrors;
};

describe("direct listings", () => {
  it("accepts a valid listing", () => {
    expect(create.safeParse(direct()).success).toBe(true);
  });

  it("requires the basics", () => {
    const errors = errorsOf(direct({ category: "", title: " ", description: "", location: "", district: "" as never }));
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["category", "title", "description", "location", "district"]),
    );
  });

  it("caps the title at 140 characters", () => {
    expect(errorsOf(direct({ title: "x".repeat(141) })).title).toBeTruthy();
    expect(errorsOf(direct({ title: "x".repeat(140) })).title).toBeUndefined();
  });

  it("needs a positive quantity and price", () => {
    expect(errorsOf(direct({ quantity_available: "0" })).quantity_available).toBeTruthy();
    expect(errorsOf(direct({ quantity_available: "" })).quantity_available).toBeTruthy();
    expect(errorsOf(direct({ price_per_unit: "0" })).price_per_unit).toBeTruthy();
    expect(errorsOf(direct({ price_per_unit: "-5" })).price_per_unit).toBeTruthy();
  });

  it("treats minimum order quantity as optional but capped by the stock", () => {
    expect(errorsOf(direct({ min_order_qty: "" })).min_order_qty).toBeUndefined();
    expect(errorsOf(direct({ min_order_qty: "50" })).min_order_qty).toBeUndefined();
    expect(errorsOf(direct({ min_order_qty: "501" })).min_order_qty).toBeTruthy();
    expect(errorsOf(direct({ min_order_qty: "0" })).min_order_qty).toBeTruthy();
  });

  it("treats the low-stock level as optional and not negative", () => {
    expect(errorsOf(direct({ low_stock_level: "" })).low_stock_level).toBeUndefined();
    expect(errorsOf(direct({ low_stock_level: "40" })).low_stock_level).toBeUndefined();
    expect(errorsOf(direct({ low_stock_level: "-1" })).low_stock_level).toBeTruthy();
  });

  it("only accepts units and districts from the lists", () => {
    expect(errorsOf(direct({ unit: "tonne" })).unit).toBeTruthy();
    expect(errorsOf(direct({ district: "Atlantis" as never })).district).toBeTruthy();
  });

  it("requires certification text only for organic produce", () => {
    expect(errorsOf(direct({ organic: true, certification: "" })).certification).toBeTruthy();
    expect(errorsOf(direct({ organic: true, certification: "SLS 123" })).certification).toBeUndefined();
    expect(errorsOf(direct({ organic: false, certification: "" })).certification).toBeUndefined();
  });

  it("needs 1 to 5 uploaded images", () => {
    expect(errorsOf(direct({ images: [] })).images).toBeTruthy();
    const six = Array.from({ length: 6 }, (_, i) => ({ image: `/files/${i}.png`, is_cover: i === 0 }));
    expect(errorsOf(direct({ images: six })).images).toBeTruthy();
    expect(errorsOf(direct({ images: six.slice(0, 5) })).images).toBeUndefined();
    expect(errorsOf(direct({ images: [{ image: "https://x.com/a.png", is_cover: true }] })).images).toBeTruthy();
  });

  it("needs both pin coordinates or neither, within range", () => {
    expect(errorsOf(direct({ latitude: "7.29" })).latitude).toBeTruthy();
    expect(errorsOf(direct({ longitude: "80.6" })).latitude).toBeTruthy();
    expect(errorsOf(direct({ latitude: "95", longitude: "80" })).latitude).toBeTruthy();
    expect(errorsOf(direct({ latitude: "7.29", longitude: "80.63" })).latitude).toBeUndefined();
  });

  it("does not ask for auction fields", () => {
    expect(create.safeParse(direct({ min_bid: "", start_time: "", end_time: "" })).success).toBe(true);
  });
});

describe("auction listings", () => {
  it("accepts valid terms with the acknowledgement", () => {
    expect(create.safeParse(auction()).success).toBe(true);
  });

  it("requires the acknowledgement when creating, not when editing", () => {
    const values = auction({ auction_terms_acknowledged: false });
    expect(errorsOf(values).auction_terms_acknowledged).toBeTruthy();
    expect(errorsOf(values, makeListingSchema({ requireAcknowledgement: false })).auction_terms_acknowledged).toBeUndefined();
  });

  it("requires a positive minimum bid", () => {
    expect(errorsOf(auction({ min_bid: "" })).min_bid).toBeTruthy();
    expect(errorsOf(auction({ min_bid: "0" })).min_bid).toBeTruthy();
  });

  it("enforces the 24 hour lead time and the 6 to 48 hour run", () => {
    expect(errorsOf(auction({ start_time: inHours(10), end_time: inHours(22) })).start_time).toBeTruthy();
    expect(errorsOf(auction({ start_time: inHours(30), end_time: inHours(33) })).end_time).toBeTruthy();
    expect(errorsOf(auction({ start_time: inHours(30), end_time: inHours(90) })).end_time).toBeTruthy();
    expect(errorsOf(auction({ start_time: "", end_time: "" })).start_time).toBeTruthy();
  });

  it("skips the term checks for a started (locked) auction", () => {
    const locked = makeListingSchema({ requireAcknowledgement: false, skipAuctionTerms: true });
    expect(locked.safeParse(auction({ min_bid: "", start_time: "", end_time: "" })).success).toBe(true);
  });
});

describe("formDataToValues", () => {
  it("reads strings, flags and the images JSON", () => {
    const fd = new FormData();
    fd.set("selling_type", "Direct");
    fd.set("title", "Carrots");
    fd.set("organic", "on");
    fd.set("auction_terms_acknowledged", "on");
    fd.set("images", JSON.stringify([{ image: "/files/a.png", is_cover: true }]));
    const values = formDataToValues(fd);
    expect(values.title).toBe("Carrots");
    expect(values.organic).toBe(true);
    expect(values.auction_terms_acknowledged).toBe(true);
    expect(values.images).toEqual([{ image: "/files/a.png", is_cover: true }]);
    expect(values.description).toBe("");
  });

  it("treats an empty organic value and broken images JSON as false / empty", () => {
    const fd = new FormData();
    fd.set("organic", "");
    fd.set("images", "{not json");
    const values = formDataToValues(fd);
    expect(values.organic).toBe(false);
    expect(values.images).toEqual([]);
  });
});

describe("request bodies", () => {
  it("builds the create body for a direct listing", () => {
    const parsed = create.parse(direct({ min_order_qty: "25", low_stock_level: "100", organic: true, certification: "SLS" }));
    expect(toCreateBody(parsed)).toMatchObject({
      selling_type: "Direct",
      quantity_available: 500,
      price_per_unit: 120,
      min_order_qty: 25,
      low_stock_level: 100,
      organic: 1,
      certification: "SLS",
      min_bid: null,
      start_time: null,
      auction_terms_acknowledged: 0,
    });
  });

  it("builds the create body for an auction with backend date-times", () => {
    const values = auction({ start_time: "2026-10-07T10:30", end_time: "2026-10-07T22:30" });
    const body = toCreateBody(makeListingSchema({ requireAcknowledgement: true, skipAuctionTerms: true }).parse(values));
    expect(body).toMatchObject({
      selling_type: "Auction",
      price_per_unit: null,
      min_order_qty: null,
      min_bid: 300,
      start_time: "2026-10-07 10:30:00",
      end_time: "2026-10-07 22:30:00",
      auction_terms_acknowledged: 1,
    });
  });

  it("builds update values that match the listing's type and locks", () => {
    const edit = makeListingSchema({ requireAcknowledgement: false });
    const directValues = toUpdateValues(edit.parse(direct()), { termsLocked: false, lotLocked: false });
    expect(directValues).toMatchObject({ price_per_unit: 120, unit: "kg", quantity_available: 500 });
    expect(directValues).not.toHaveProperty("min_bid");

    const auctionValues = toUpdateValues(edit.parse(auction()), { termsLocked: false, lotLocked: false });
    expect(auctionValues).toMatchObject({ min_bid: 300 });
    expect(auctionValues).not.toHaveProperty("price_per_unit");

    const locked = toUpdateValues(edit.parse(auction()), { termsLocked: true, lotLocked: true });
    expect(locked).not.toHaveProperty("min_bid");
    expect(locked).not.toHaveProperty("quantity_available");
    expect(locked).not.toHaveProperty("unit");
  });
});
