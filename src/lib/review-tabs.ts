import type { ListingStatusLabel } from "@/types/listing.type";

/** Staff queue tabs: the URL slug, the label and the listing status each one shows. */
export const REVIEW_TABS: { slug: string; label: string; status: ListingStatusLabel }[] = [
  { slug: "pending", label: "Pending Approval", status: "Pending Approval" },
  { slug: "published", label: "Published", status: "Approved" },
  { slug: "suspended", label: "Suspended", status: "Suspended" },
  { slug: "hidden", label: "Hidden", status: "Hidden" },
  { slug: "rejected", label: "Rejected", status: "Rejected" },
  { slug: "archived", label: "Archived", status: "Archived" },
];

export const DEFAULT_REVIEW_TAB = REVIEW_TABS[0];

export function reviewTabFor(slug: string | undefined) {
  return REVIEW_TABS.find((tab) => tab.slug === slug) ?? DEFAULT_REVIEW_TAB;
}

export type DecisionKind = "approve" | "reject" | "suspend";

/** Which decisions make sense for a listing in a given status (the backend still decides). */
export function relevantDecisions(status: ListingStatusLabel): DecisionKind[] {
  switch (status) {
    case "Pending Approval":
      return ["approve", "reject"];
    case "Approved":
    case "Hidden":
      return ["suspend"];
    case "Suspended":
      return ["approve"]; // reinstate
    default:
      return [];
  }
}

export const DECISION_PAST: Record<DecisionKind, string> = {
  approve: "approved",
  reject: "rejected",
  suspend: "suspended",
};
