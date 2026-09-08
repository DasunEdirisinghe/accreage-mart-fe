import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Vitest + React Testing Library (jsdom).
 * Tests live in the top-level tests/ directory mirroring src/ — see docs/testing.md.
 * The @/* -> src/* alias is read straight from tsconfig.json via vite-tsconfig-paths.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
