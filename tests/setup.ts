import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { resetStore } from "@/lib/store";

/**
 * jsdom doesn't implement ResizeObserver, which recharts' ResponsiveContainer requires —
 * any test rendering ForecastChart (or another recharts component) throws without this.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

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
