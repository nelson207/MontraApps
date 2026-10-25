import { defineConfig } from "vitest/config";
import { montraAliases } from "./montra.aliases";

// Unit tests for pure logic (Node). Component tests (*.test.tsx) opt into jsdom with a
// "// @vitest-environment jsdom" comment and render with Testing Library.
export default defineConfig({
  resolve: {
    alias: montraAliases("credit"),
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // The i18next instance (English), as main.tsx sets it up
    setupFiles: ["src/platform/i18n/i18n.ts"],
  },
});
