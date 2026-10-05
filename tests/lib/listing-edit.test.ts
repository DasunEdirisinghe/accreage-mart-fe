import { describe, expect, it } from "vitest";

import { detailToFormValues, editRestriction } from "@/lib/listing-edit";
import type { OwnListingDetail } from "@/types/listing.type";

const now = "2026-10-05T10:00";

const listing = (over: Partial<OwnListingDetail> = {}): OwnListingDetail => ({
  name: "LST-00001",
  title: "Carrots",
  description: "Grade A",
  selling_type: "Direct",
  category: { name: "cat-1", title: "Carrot", area: "Vegetables" },
  unit: "kg",
  price_per_unit: 120,
  min_order_qty: 1,
  quantity_available: 500,
  low_stock_level: 0,
  district: "Kandy",
  location: "Kandy market",
  latitude: null,
  longitude: null,
  organic: false,
  certification: null,
  images: [{ url: "/files/lst-a.png", is_cover: true }],
  auction: null,
  status: "Approved",
  status_reason: null,
  resubmission_note: null,
  ...over,
});

const auctionListing = (start: string, status: OwnListingDetail["status"] = "Approved") =>
  listing({
    selling_type: "Auction",
    price_per_unit: null,
    auction: {
      min_bid: 300,
      start_time: `${start.replace("T", " ")}:00.000000`,
      end_time: "2026-10-09 10:00:00.000000",
      status: "scheduled",
      bidding_enabled: false,
    },
    status,
  });

describe("editRestriction", () => {
  it("lets a seller edit a published direct listing freely", () => {
    expect(editRestriction(listing(), now)).toMatchObject({
      canEdit: true,
      termsLocked: false,
      lotLocked: false,
      termsChangeSendsToReview: false,
    });
  });

  it("blocks archived and suspended listings with a reason", () => {
    expect(editRestriction(listing({ status: "Archived" }), now)).toMatchObject({ canEdit: false });
    expect(editRestriction(listing({ status: "Archived" }), now).blockedReason).toMatch(/Duplicate/);
    expect(editRestriction(listing({ status: "Suspended" }), now).blockedReason).toMatch(/contact staff/);
  });

  it("explains a pending listing and a rejected one", () => {
    expect(editRestriction(listing({ status: "Pending Approval" }), now).banner?.text).toMatch(/Waiting for staff approval/);
    const rejected = editRestriction(listing({ status: "Rejected", status_reason: "Blurry photos" }), now);
    expect(rejected.canEdit).toBe(true);
    expect(rejected.banner?.text).toMatch(/Blurry photos/);
    expect(rejected.banner?.text).toMatch(/resubmit/);
  });

  it("warns that changing the terms of a published, not-yet-started auction sends it to review", () => {
    const result = editRestriction(auctionListing("2026-10-07T10:00"), now);
    expect(result.termsChangeSendsToReview).toBe(true);
    expect(result.termsLocked).toBe(false);
    expect(result.banner?.tone).toBe("warning");
  });

  it("locks the terms and the lot once a published auction has started", () => {
    const result = editRestriction(auctionListing("2026-10-05T09:00"), now);
    expect(result).toMatchObject({ canEdit: true, termsLocked: true, lotLocked: true });
    expect(result.banner?.text).toMatch(/contacting staff/);
  });

  it("does not lock a pending auction", () => {
    const result = editRestriction(auctionListing("2026-10-05T09:00", "Pending Approval"), now);
    expect(result.termsLocked).toBe(false);
  });
});

describe("detailToFormValues", () => {
  it("maps a direct listing into form strings", () => {
    const values = detailToFormValues(listing({ latitude: 7.29, longitude: 80.63, organic: true, certification: "SLS" }));
    expect(values).toMatchObject({
      selling_type: "Direct",
      category: "cat-1",
      price_per_unit: "120",
      quantity_available: "500",
      latitude: "7.29",
      longitude: "80.63",
      organic: true,
      certification: "SLS",
      min_bid: "",
      auction_terms_acknowledged: false,
    });
    expect(values.images).toEqual([{ image: "/files/lst-a.png", is_cover: true }]);
  });

  it("maps auction terms into datetime-local values", () => {
    const values = detailToFormValues(auctionListing("2026-10-07T10:00"));
    expect(values).toMatchObject({
      selling_type: "Auction",
      min_bid: "300",
      start_time: "2026-10-07T10:00",
      end_time: "2026-10-09T10:00",
      price_per_unit: "",
    });
  });
});
