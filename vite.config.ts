import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@saas/shared": resolve(__dirname, "../saas-identity-platform-shared/generated/ts"),
    },
  },
});