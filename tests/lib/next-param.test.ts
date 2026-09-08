import { describe, expect, it } from "vitest";

import { sanitizeNext } from "@/lib/next-param";

describe("sanitizeNext", () => {
  it("keeps same-origin absolute paths", () => {
    expect(sanitizeNext("/buyer/orders")).toBe("/buyer/orders");
    expect(sanitizeNext("/marketplace/123?ref=x")).toBe("/marketplace/123?ref=x");
  });

  it("rejects anything that could leave the site", () => {
    expect(sanitizeNext("//evil.com")).toBeNull();
    expect(sanitizeNext("https://evil.com")).toBeNull();
    expect(sanitizeNext("/\\evil.com")).toBeNull();
    expect(sanitizeNext("/path\\with\\backslash")).toBeNull();
    expect(sanitizeNext("/%2f%2fevil.com")).toBeNull();
    expect(sanitizeNext("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty / missing values", () => {
    expect(sanitizeNext("")).toBeNull();
    expect(sanitizeNext(null)).toBeNull();
    expect(sanitizeNext(undefined)).toBeNull();
  });
});
