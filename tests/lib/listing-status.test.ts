import { describe, expect, it } from "vitest";

import { listingActions, statusLabel, statusTone, stockLabel } from "@/lib/listing-status";
import { makeAuctionListing, makeMyListing } from "../helpers/my-listing";
import type { ListingStatusLabel } from "@/types/listing.type";

const enabled = (listing: ReturnType<typeof makeMyListing>) =>
  listingActions(listing).filter((a) => a.enabled).map((a) => a.action);

describe("labels", () => {
  it("uses the SRS words for a seller", () => {
    expect(statusLabel("Approved")).toBe("Published");
    expect(statusLabel("Pending Approval")).toBe("Pending Approval");
    expect(statusLabel("Rejected")).toBe("Rejected");
  });

  it("gives every status a tone", () => {
    const statuses: ListingStatusLabel[] = ["Pending Approval", "Approved", "Rejected", "Hidden", "Suspended", "Archived"];
    for (const status of statuses) expect(statusTone(status)).toBeTruthy();
    expect(statusTone("Approved")).toBe("success");
    expect(statusTone("Rejected")).toBe("destructive");
  });

  it("labels stock states", () => {
    expect(stockLabel("low_stock")).toBe("Low stock");
    expect(stockLabel("out_of_stock")).toBe("Out of stock");
    expect(stockLabel("in_stock")).toBeNull();
    expect(stockLabel(null)).toBeNull();
  });
});

describe("listingActions: Direct listings", () => {
  it("published: edit, stock, hide, archive, history", () => {
    expect(enabled(makeMyListing({ status: "Approved" }))).toEqual(["edit", "stock", "hide", "archive", "history"]);
  });

  it("pending: edit, stock, archive (withdraw), history; no hide", () => {
    expect(enabled(makeMyListing({ status: "Pending Approval" }))).toEqual(["edit", "stock", "archive", "history"]);
  });

  it("rejected: edit, stock, resubmit, archive, history", () => {
    expect(enabled(makeMyListing({ status: "Rejected" }))).toEqual(["edit", "stock", "resubmit", "archive", "history"]);
  });

  it("hidden: edit, stock, show again, archive, history", () => {
    expect(enabled(makeMyListing({ status: "Hidden" }))).toEqual(["edit", "stock", "unhide", "archive", "history"]);
  });

  it("suspended: edit is blocked with the reason; only history is open", () => {
    const actions = listingActions(makeMyListing({ status: "Suspended" }));
    expect(actions.map((a) => a.action)).toEqual(["edit", "history"]);
    expect(actions[0]).toMatchObject({ enabled: false });
    expect(actions[0].reason).toMatch(/contact staff/);
  });

  it("archived: duplicate and history only", () => {
    expect(enabled(makeMyListing({ status: "Archived" }))).toEqual(["duplicate", "history"]);
  });
});

describe("listingActions: auctions", () => {
  // The auction runs 2026-10-07 10:00 to 22:00 (see the helper).
  const SCHEDULED = "2026-10-06T10:00";
  const LIVE = "2026-10-07T12:00";
  const ENDED = "2026-10-08T00:00";
  const actionsAt = (now: string, over = {}) => listingActions(makeAuctionListing("x", over), now);
  const enabledAt = (now: string, over = {}) => actionsAt(now, over).filter((a) => a.enabled).map((a) => a.action);

  it("never offers stock changes: the lot is fixed", () => {
    expect(actionsAt(SCHEDULED).map((a) => a.action)).not.toContain("stock");
  });

  it("a scheduled published auction can be hidden or archived", () => {
    expect(enabledAt(SCHEDULED)).toEqual(["edit", "hide", "archive", "history"]);
  });

  it("a live auction cannot be hidden or archived, and says to contact staff", () => {
    const actions = actionsAt(LIVE);
    const hide = actions.find((a) => a.action === "hide");
    const archive = actions.find((a) => a.action === "archive");
    expect(hide).toMatchObject({ enabled: false });
    expect(archive).toMatchObject({ enabled: false });
    expect(hide?.reason).toMatch(/started/);
    expect(hide?.reason).toMatch(/contact staff/);
  });

  it("an ended auction can be archived", () => {
    expect(enabledAt(ENDED)).toContain("archive");
  });

  it("a hidden auction whose start has passed can't come back, one that hasn't started can", () => {
    expect(actionsAt(LIVE, { status: "Hidden" }).find((a) => a.action === "unhide")).toMatchObject({ enabled: false });
    expect(actionsAt(ENDED, { status: "Hidden" }).find((a) => a.action === "unhide")).toMatchObject({ enabled: false });
    expect(actionsAt(SCHEDULED, { status: "Hidden" }).find((a) => a.action === "unhide")).toMatchObject({ enabled: true });
  });

  it("a hidden auction that is running can't be archived from here either", () => {
    expect(actionsAt(LIVE, { status: "Hidden" }).find((a) => a.action === "archive")).toMatchObject({ enabled: false });
  });

  it("a pending or rejected auction can always be archived, even with a stale start", () => {
    expect(enabledAt(LIVE, { status: "Pending Approval" })).toContain("archive");
    expect(enabledAt(LIVE, { status: "Rejected" })).toContain("archive");
  });
});
