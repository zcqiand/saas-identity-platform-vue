import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import FnReporter from "./tests/fnReporter";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    preserveSymlinks: false,
    alias: {
      "@": resolve(__dirname, "./src"),
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