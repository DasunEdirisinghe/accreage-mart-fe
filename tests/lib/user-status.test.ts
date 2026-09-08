import { describe, expect, it } from "vitest";

import type { UserStatus } from "@/lib/types";
import { USER_STATUS_BADGE, canManageStatus } from "@/lib/user-status";

const ALL_STATUSES: UserStatus[] = ["invited", "active", "suspended", "deactivated"];

describe("USER_STATUS_BADGE", () => {
  it("has a variant + label for every UserStatus", () => {
    for (const status of ALL_STATUSES) {
      expect(USER_STATUS_BADGE[status]).toMatchObject({
        variant: expect.any(String),
        label: expect.any(String),
      });
    }
  });

  it("labels 'invited' as Invited with the info variant", () => {
    expect(USER_STATUS_BADGE.invited).toEqual({ variant: "info", label: "Invited" });
  });
});

describe("canManageStatus", () => {
  it("blocks status changes only while the account is invited", () => {
    expect(canManageStatus("invited")).toBe(false);
    expect(canManageStatus("active")).toBe(true);
    expect(canManageStatus("suspended")).toBe(true);
    expect(canManageStatus("deactivated")).toBe(true);
  });
});
