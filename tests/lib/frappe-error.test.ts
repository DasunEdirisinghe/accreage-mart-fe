import { describe, expect, it } from "vitest";

import { parseFrappeError } from "@/lib/frappe-error";

describe("parseFrappeError", () => {
  it("pulls the message out of _server_messages", () => {
    const raw = JSON.stringify({
      _server_messages: JSON.stringify([
        JSON.stringify({ message: "Email already registered", title: "Error" }),
      ]),
    });
    expect(parseFrappeError(raw)).toBe("Email already registered");
  });

  it("joins multiple server messages and strips HTML", () => {
    const raw = JSON.stringify({
      _server_messages: JSON.stringify([
        JSON.stringify({ message: "<b>Field A</b> is required" }),
        JSON.stringify({ message: "Field B is required" }),
      ]),
    });
    expect(parseFrappeError(raw)).toBe("Field A is required Field B is required");
  });

  it("falls back to the plain `message` field", () => {
    expect(parseFrappeError(JSON.stringify({ message: "Invalid login" }))).toBe("Invalid login");
  });

  it("trims the exception type prefix off `exception`", () => {
    const raw = JSON.stringify({
      exception: "frappe.exceptions.ValidationError: Password is too weak",
    });
    expect(parseFrappeError(raw)).toBe("Password is too weak");
  });

  it("returns a generic fallback for empty or unrecognised input", () => {
    const fallback = "Something went wrong. Please try again.";
    expect(parseFrappeError("")).toBe(fallback);
    expect(parseFrappeError(JSON.stringify({ foo: "bar" }))).toBe(fallback);
  });

  it("returns a short non-JSON body as-is", () => {
    expect(parseFrappeError("Service Unavailable")).toBe("Service Unavailable");
  });
});
