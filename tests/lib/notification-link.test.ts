import { describe, expect, it } from "vitest";

import { resolveNotificationLink } from "@/lib/notification-link";

describe("resolveNotificationLink", () => {
  it("returns null when there is no source document", () => {
    expect(resolveNotificationLink(null, null, "buyer")).toBeNull();
    expect(resolveNotificationLink("Listing", null, "seller")).toBeNull();
  });

  describe("Listing", () => {
    it("routes a seller to their own listing's edit page", () => {
      expect(resolveNotificationLink("Listing", "lst-1", "seller")).toBe("/seller/listings/lst-1/edit");
    });

    it("routes staff and admin to the review page", () => {
      expect(resolveNotificationLink("Listing", "lst-1", "staff")).toBe("/admin/approvals/lst-1");
      expect(resolveNotificationLink("Listing", "lst-1", "admin")).toBe("/admin/approvals/lst-1");
    });

    it("routes a buyer to the public listing page", () => {
      expect(resolveNotificationLink("Listing", "lst-1", "buyer")).toBe("/marketplace/lst-1");
    });
  });

  describe("Auction", () => {
    it("routes every role to the public auction detail page", () => {
      expect(resolveNotificationLink("Auction", "auc-1", "buyer")).toBe("/auctions/auc-1");
      expect(resolveNotificationLink("Auction", "auc-1", "seller")).toBe("/auctions/auc-1");
      expect(resolveNotificationLink("Auction", "auc-1", "admin")).toBe("/auctions/auc-1");
    });
  });

  describe("Order", () => {
    it("routes a buyer to their own order", () => {
      expect(resolveNotificationLink("Order", "ord-1", "buyer")).toBe("/buyer/orders/ord-1");
    });

    it("routes a seller to their own order", () => {
      expect(resolveNotificationLink("Order", "ord-1", "seller")).toBe("/seller/orders/ord-1");
    });

    it("routes staff and admin to the payments queue", () => {
      expect(resolveNotificationLink("Order", "ord-1", "staff")).toBe("/admin/payments");
      expect(resolveNotificationLink("Order", "ord-1", "admin")).toBe("/admin/payments");
    });
  });

  describe("Payment", () => {
    it("routes the same as Order per role", () => {
      expect(resolveNotificationLink("Payment", "ord-1", "buyer")).toBe("/buyer/orders/ord-1");
      expect(resolveNotificationLink("Payment", "ord-1", "seller")).toBe("/seller/orders/ord-1");
      expect(resolveNotificationLink("Payment", "ord-1", "admin")).toBe("/admin/payments");
    });
  });

  it("returns null for an unknown document type", () => {
    expect(resolveNotificationLink("Something", "x-1", "buyer")).toBeNull();
  });

  it("encodes the document name into the path", () => {
    expect(resolveNotificationLink("Order", "ord 1/2", "buyer")).toBe("/buyer/orders/ord%201%2F2");
  });
});
