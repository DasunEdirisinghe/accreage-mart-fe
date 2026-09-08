import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { resetStore } from "@/lib/store";

/**
 * Runs after every test.
 * - cleanup(): unmount anything React Testing Library rendered.
 * - resetStore(): the mock store is module-level singleton state; a leak from one
 *   test silently corrupts the next, so it is re-seeded here. Don't rely on test order.
 */
afterEach(() => {
  cleanup();
  resetStore();
});
