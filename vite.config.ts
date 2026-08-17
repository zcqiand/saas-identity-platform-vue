import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

// Vite 在 import.meta.env 注入前的早期 phase 读 process.env。
// VITE_DEV_PORT 走 .env.local（见 .env.example）；默认 5173。
const devPort = Number(process.env.VITE_DEV_PORT ?? "5173") || 5173;

export default defineConfig({
  plugins: [vue(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: devPort,
    forwardConsole: false,
  },
  optimizeDeps: {
    // msw v2 has unresolvable @mswjs/interceptors exports conditions for
    // ClientRequest in browser; exclude from pre-bundling so it loads at
    // runtime via esm rather than being bundled by esbuild.
    exclude: ["@saas/identity-platform-msw", "msw", "@mswjs/interceptors"],
  },
});