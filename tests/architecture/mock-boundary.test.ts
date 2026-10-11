import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The line between real (Frappe-backed) code and demo (mock-store) code.
 *
 * Real listing code must never reach the in-memory mock store, and the mock store must never
 * reach into real code. Mock listings, orders, auctions and chats still exist for pages whose
 * epics are not built yet; this keeps them from leaking into, or breaking, the real ones.
 */

const ROOT = join(__dirname, "..", "..", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const importsOf = (path: string): string[] =>
  [...readFileSync(path, "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);

const rel = (path: string) => relative(ROOT, path).split("\\").join("/");

/** Everything that reads real listing data. */
const REAL_PATHS = [
  "app/actions",
  "components/pages",
  "types",
  "lib/listing-constants.ts",
  "lib/listing-edit.ts",
  "lib/listing-schema.ts",
  "lib/listing-status.ts",
  "lib/listing-time.ts",
  "lib/marketplace-format.ts",
  "lib/marketplace-query.ts",
  "lib/price-suggestion.ts",
  "lib/review-tabs.ts",
  "lib/maps.ts",
  "lib/media.ts",
  "app/seller/listings",
  "app/seller/inventory",
  "app/admin/approvals",
  "app/(site)/marketplace",
  "app/(site)/sellers",
  "app/(site)/page.tsx",
];

/** Real pages that still show one demo thing alongside real data. Each is listed with why. */
const ALLOWED_MOCK_USE: Record<string, string> = {
  // The landing page's announcements (web content, a later module) still come from the mock store.
  "components/pages/landing/landing-content.tsx": "announcements",
};

const MOCK_MODULE = /^@\/(lib\/store|lib\/mock-data|lib\/services\/|hooks\/use-db)/;

const realFiles = REAL_PATHS.flatMap((entry) => {
  const path = join(ROOT, entry);
  return statSync(path).isDirectory() ? sourceFiles(path) : [path];
});

describe("real code does not use the mock store", () => {
  it("covers a sensible number of files (the path list is not stale)", () => {
    expect(realFiles.length).toBeGreaterThan(40);
  });

  it("imports nothing from the store, mock data, mock services or the demo data hook", () => {
    const offenders = realFiles
      .filter((file) => !(rel(file) in ALLOWED_MOCK_USE))
      .flatMap((file) =>
        importsOf(file).filter((spec) => MOCK_MODULE.test(spec)).map((spec) => `${rel(file)} -> ${spec}`),
      );
    expect(offenders).toEqual([]);
  });

  it("does not mention the mock listing type", () => {
    const offenders = realFiles
      .filter((file) => /\bMockListing(Status)?\b/.test(readFileSync(file, "utf8")))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("lists every allowed exception only while it is still needed", () => {
    for (const [file, why] of Object.entries(ALLOWED_MOCK_USE)) {
      const uses = importsOf(join(ROOT, file)).some((spec) => MOCK_MODULE.test(spec));
      expect(uses, `${file} (${why}) no longer uses the mock store: remove it from the allow-list`).toBe(true);
    }
  });
});

describe("the mock store does not use real code", () => {
  const mockFiles = [
    "lib/store.ts",
    "lib/mock-data.ts",
    ...sourceFiles(join(ROOT, "lib/services")).map(rel),
  ].map((entry) => join(ROOT, entry));

  it("imports no server action and none of the real listing types", () => {
    const offenders = mockFiles.flatMap((file) =>
      importsOf(file)
        .filter((spec) => /^@\/(app\/actions|types\/|components\/pages|lib\/(listing-|marketplace-|price-|review-))/.test(spec))
        .map((spec) => `${rel(file)} -> ${spec}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe("the retired mock listing code is gone", () => {
  it("has no mock listing service, card or gallery left", () => {
    const files = sourceFiles(ROOT).map(rel);
    expect(files).not.toContain("lib/services/listings.ts");
    expect(files).not.toContain("components/shared/listing-card.tsx");
    expect(files).not.toContain("components/shared/listing-gallery.tsx");
  });
});
