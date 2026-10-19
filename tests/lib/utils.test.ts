import { describe, expect, it } from "vitest";

import { formatDate, formatLKR, initials, timeAgo, timeRemaining } from "@/lib/utils";

/**
 * Smoke test proving the Vitest harness runs (Epic 01, Story 1.1).
 * Every subsequent story ships its own tests.
 */
describe("formatLKR", () => {
  it("prefixes Rs. and groups thousands", () => {
    expect(formatLKR(1500)).toBe("Rs. 1,500");
    expect(formatLKR(1250000)).toBe("Rs. 1,250,000");
  });

  it("handles zero", () => {
    expect(formatLKR(0)).toBe("Rs. 0");
  });
});

describe("formatDate", () => {
  it("renders a d MMM yyyy date", () => {
    expect(formatDate("2026-01-15T12:00:00.000Z")).toBe("15 Jan 2026");
  });
});

describe("initials", () => {
  it("takes the first two word initials, uppercased", () => {
    expect(initials("Sunil Bandara")).toBe("SB");
    expect(initials("nadeesha perera silva")).toBe("NP");
  });
});

describe("timeAgo", () => {
  it("reports minutes, hours and days for recent timestamps", () => {
    expect(timeAgo(new Date(Date.now() - 30000).toISOString())).toBe("just now");
    expect(timeAgo(new Date(Date.now() - 5 * 60000).toISOString())).toBe("5m ago");
    expect(timeAgo(new Date(Date.now() - 3 * 3600000).toISOString())).toBe("3h ago");
    expect(timeAgo(new Date(Date.now() - 2 * 86400000).toISOString())).toBe("2d ago");
  });

  it("falls back to a plain date past a week out", () => {
    const old = new Date(Date.now() - 10 * 86400000);
    expect(timeAgo(old.toISOString())).toBe(formatDate(old.toISOString()));
  });
});

describe("timeRemaining", () => {
  it("returns Ended for a past timestamp", () => {
    expect(timeRemaining(new Date(Date.now() - 1000).toISOString())).toBe("Ended");
  });

  it("counts days ahead for a future timestamp", () => {
    const threeDays = new Date(Date.now() + 3 * 86400000 + 3600000).toISOString();
    expect(timeRemaining(threeDays)).toMatch(/^3d \d+h left$/);
  });
});
