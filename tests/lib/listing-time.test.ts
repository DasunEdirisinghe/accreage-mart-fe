import { describe, expect, it } from "vitest";

import {
  fromBackendDateTime,
  hoursBetween,
  siteNow,
  toBackendDateTime,
  validateAuctionTimes,
} from "@/lib/listing-time";

describe("siteNow", () => {
  it("is the Sri Lanka wall-clock time, whatever the machine's zone", () => {
    // 16:00 UTC is 21:30 in Sri Lanka (UTC+5:30)
    expect(siteNow(new Date("2026-10-05T16:00:00Z"))).toBe("2026-10-05T21:30");
  });

  it("rolls over midnight in Sri Lanka time", () => {
    expect(siteNow(new Date("2026-10-05T19:00:00Z"))).toBe("2026-10-06T00:30");
  });
});

describe("hoursBetween", () => {
  it("measures wall-clock differences", () => {
    expect(hoursBetween("2026-10-05T10:00", "2026-10-06T10:00")).toBe(24);
    expect(hoursBetween("2026-10-05T10:00", "2026-10-05T16:30")).toBe(6.5);
    expect(hoursBetween("2026-10-05T10:00", "2026-10-05T09:00")).toBe(-1);
  });
});

describe("validateAuctionTimes", () => {
  const now = "2026-10-05T10:00";

  it("accepts a start 24h+ ahead with a 6 to 48 hour run", () => {
    expect(validateAuctionTimes("2026-10-06T10:00", "2026-10-06T22:00", now)).toEqual({});
    expect(validateAuctionTimes("2026-10-06T10:00", "2026-10-06T16:00", now)).toEqual({});
    expect(validateAuctionTimes("2026-10-06T10:00", "2026-10-08T10:00", now)).toEqual({});
  });

  it("requires both times", () => {
    const errors = validateAuctionTimes("", "", now);
    expect(errors.start_time).toBeTruthy();
    expect(errors.end_time).toBeTruthy();
  });

  it("rejects a start less than 24 hours ahead", () => {
    const errors = validateAuctionTimes("2026-10-06T09:59", "2026-10-06T22:00", now);
    expect(errors.start_time).toMatch(/at least 24 hours/);
  });

  it("rejects an end that is not after the start", () => {
    expect(validateAuctionTimes("2026-10-07T10:00", "2026-10-07T10:00", now).end_time).toMatch(/after the start/);
    expect(validateAuctionTimes("2026-10-07T10:00", "2026-10-07T08:00", now).end_time).toMatch(/after the start/);
  });

  it("enforces the 6 hour minimum and 48 hour maximum", () => {
    expect(validateAuctionTimes("2026-10-07T10:00", "2026-10-07T15:59", now).end_time).toMatch(/at least 6 hours/);
    expect(validateAuctionTimes("2026-10-07T10:00", "2026-10-09T10:01", now).end_time).toMatch(/at most 48 hours/);
  });
});

describe("backend date-time conversion", () => {
  it("converts a datetime-local value to the backend format", () => {
    expect(toBackendDateTime("2026-10-07T10:30")).toBe("2026-10-07 10:30:00");
  });

  it("converts a backend value back for a datetime-local input", () => {
    expect(fromBackendDateTime("2026-10-07 10:30:00.000000")).toBe("2026-10-07T10:30");
    expect(fromBackendDateTime(null)).toBe("");
    expect(fromBackendDateTime(undefined)).toBe("");
  });
});
