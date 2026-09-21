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
    // 真链路基座（saas-react 同构，2026-09-21 成员管理批）：globalSetup 灌种子 +
    // 复用/拉起 nextjs :5101 + 铸真 JWT；jsdom url 与 :5101 同源（跨源 XHR 被吞
    // 成网络错误，react 仓 lab T7 实测同款）。
    globalSetup: ["./tests/global-setup.ts"],
    // 共享真后端 + 真库 = 共享可变状态，文件必须串行（react 仓同款裁定）。
    fileParallelism: false,
    // 真链路 jsdom 测试吃真 nextjs dev 冷编译（单路由 10-20s 常态），10s 恒误报。
    testTimeout: 30000,
    environmentOptions: { jsdom: { url: "http://localhost:5101" } },
    setupFiles: ["./tests/setup.ts"],
    reporters: ["default", new FnReporter() as any],
  },
});
