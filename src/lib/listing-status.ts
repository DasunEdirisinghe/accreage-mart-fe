import { siteNow } from "@/lib/listing-time";
import type { ListingStatusLabel, MyListingCard, StockState } from "@/types/listing.type";

/** Seller-facing status labels (the SRS words: Pending Approval, Published, Rejected). */
const LABELS: Record<ListingStatusLabel, string> = {
  "Pending Approval": "Pending Approval",
  Approved: "Published",
  Rejected: "Rejected",
  Hidden: "Hidden",
  Suspended: "Suspended",
  Archived: "Archived",
};

export function statusLabel(status: ListingStatusLabel): string {
  return LABELS[status];
}

export type BadgeTone = "success" | "warning" | "destructive" | "muted" | "info" | "secondary";

const TONES: Record<ListingStatusLabel, BadgeTone> = {
  "Pending Approval": "warning",
  Approved: "success",
  Rejected: "destructive",
  Hidden: "muted",
  Suspended: "destructive",
  Archived: "muted",
};

export function statusTone(status: ListingStatusLabel): BadgeTone {
  return TONES[status];
}

export function stockLabel(state: StockState | null): string | null {
  if (state === "low_stock") return "Low stock";
  if (state === "out_of_stock") return "Out of stock";
  return null;
}

export type ListingAction =
  | "edit"
  | "stock"
  | "hide"
  | "unhide"
  | "archive"
  | "resubmit"
  | "duplicate"
  | "history";

export interface ActionState {
  action: ListingAction;
  enabled: boolean;
  /** Why it can't be used right now (shown to the seller). */
  reason?: string;
}

const LIVE_AUCTION =
  "This auction has started and can't be stopped from here. Please contact staff.";
const SUSPENDED = "This listing is suspended. Please contact staff.";

/**
 * The actions a seller is offered for a listing, mirroring the backend's rules. The backend
 * decides for real (and explains) when the action is used; this keeps the buttons honest.
 * An auction's phase comes from its start and end times (Sri Lanka time), not its status: a
 * hidden auction's status says "hidden" whether or not it has started.
 */
export function listingActions(listing: MyListingCard, now: string = siteNow()): ActionState[] {
  const { status } = listing;
  const isAuction = listing.selling_type === "Auction";
  const wall = (value: string) => value.slice(0, 16).replace(" ", "T");
  const auctionStarted = isAuction && !!listing.auction && wall(listing.auction.start_time) <= now;
  const auctionLive = auctionStarted && !!listing.auction && wall(listing.auction.end_time) > now;
  const actions: ActionState[] = [];
  const add = (action: ListingAction, enabled = true, reason?: string) =>
    actions.push({ action, enabled, reason });

  if (status === "Archived") {
    add("duplicate");
    add("history");
    return actions;
  }
  if (status === "Suspended") {
    add("edit", false, SUSPENDED);
    add("history");
    return actions;
  }

  add("edit");
  if (!isAuction) add("stock");
  if (status === "Rejected") add("resubmit");
  if (status === "Approved") add("hide", !auctionLive, auctionLive ? LIVE_AUCTION : undefined);
  if (status === "Hidden") {
    add("unhide", !auctionStarted, auctionStarted ? "The start time of this auction has passed. Archive it and create a new one." : undefined);
  }
  if (["Pending Approval", "Approved", "Rejected", "Hidden"].includes(status)) {
    const blocked = auctionLive && ["Approved", "Hidden"].includes(status);
    add("archive", !blocked, blocked ? LIVE_AUCTION : undefined);
  }
  add("history");
  return actions;
}
