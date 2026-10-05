import { describe, expect, it } from "vitest";

import { areaEmoji, auctionPhaseText, biddingNote, pickLandingCategories } from "@/lib/marketplace-format";
import type { ListingCategoryOption } from "@/types/listing.type";
import { makeAuctionCard } from "../helpers/marketplace";

const cat = (title: string, area = "Vegetables"): ListingCategoryOption => ({ name: `id-${title}`, title, area });

describe("areaEmoji", () => {
  it("has an emoji for each area, and a fallback", () => {
    expect(areaEmoji("Fruits")).toBe("🍌");
    expect(areaEmoji("Vegetables")).toBe("🥕");
    expect(areaEmoji("Rice")).toBe("🌾");
    expect(areaEmoji("Unknown")).toBe("📦");
  });
});

describe("auction wording", () => {
  it("names the phase", () => {
    expect(auctionPhaseText(makeAuctionCard("live").auction!)).toBe("Live now");
    expect(auctionPhaseText(makeAuctionCard("ended").auction!)).toBe("Ended");
    expect(auctionPhaseText(makeAuctionCard("scheduled").auction!)).toBe("Scheduled");
  });

  it("says bidding opens soon only while bidding is off", () => {
    const auction = makeAuctionCard().auction!;
    expect(biddingNote(auction)).toBe("Bidding opens soon");
    expect(biddingNote({ ...auction, bidding_enabled: true })).toBeNull();
  });
});

describe("pickLandingCategories", () => {
  it("puts the familiar categories first, in order, then the rest", () => {
    const all = [cat("Zucchini"), cat("Tomato"), cat("Carrot"), cat("Aloe")];
    expect(pickLandingCategories(all, 4).map((c) => c.title)).toEqual(["Carrot", "Tomato", "Zucchini", "Aloe"]);
  });

  it("limits the count", () => {
    const all = Array.from({ length: 30 }, (_, i) => cat(`Cat ${i}`));
    expect(pickLandingCategories(all)).toHaveLength(12);
    expect(pickLandingCategories(all, 5)).toHaveLength(5);
  });

  it("copes with none", () => {
    expect(pickLandingCategories([])).toEqual([]);
  });
});
