import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import FnReporter from "./tests/fnReporter";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@saas/shared": resolve(__dirname, "../saas-identity-platform-shared/generated/ts"),
    },
  },
  test: {
    globals: false,
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,vue}"],
    testTimeout: 10000,
    setupFiles: ["./tests/setup.ts"],
    reporters: ["default", new FnReporter() as any],
  },
});