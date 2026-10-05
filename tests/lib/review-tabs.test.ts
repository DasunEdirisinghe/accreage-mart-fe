import { describe, expect, it } from "vitest";

import { DECISION_PAST, REVIEW_TABS, relevantDecisions, reviewTabFor } from "@/lib/review-tabs";

describe("reviewTabFor", () => {
  it("finds a tab by its slug and defaults to Pending Approval", () => {
    expect(reviewTabFor("published").status).toBe("Approved");
    expect(reviewTabFor("suspended").status).toBe("Suspended");
    expect(reviewTabFor(undefined).status).toBe("Pending Approval");
    expect(reviewTabFor("nonsense").slug).toBe("pending");
  });

  it("covers every status exactly once", () => {
    expect(REVIEW_TABS.map((t) => t.status).sort()).toEqual(
      ["Approved", "Archived", "Hidden", "Pending Approval", "Rejected", "Suspended"].sort(),
    );
  });
});

describe("relevantDecisions", () => {
  it("offers approve and reject for a pending listing", () => {
    expect(relevantDecisions("Pending Approval")).toEqual(["approve", "reject"]);
  });

  it("offers suspend for a published or hidden listing", () => {
    expect(relevantDecisions("Approved")).toEqual(["suspend"]);
    expect(relevantDecisions("Hidden")).toEqual(["suspend"]);
  });

  it("offers approve (to reinstate) for a suspended listing", () => {
    expect(relevantDecisions("Suspended")).toEqual(["approve"]);
  });

  it("offers nothing for rejected or archived listings", () => {
    expect(relevantDecisions("Rejected")).toEqual([]);
    expect(relevantDecisions("Archived")).toEqual([]);
  });

  it("has a past-tense word for every decision", () => {
    expect(DECISION_PAST).toEqual({ approve: "approved", reject: "rejected", suspend: "suspended" });
  });
});
