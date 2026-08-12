import { defineConfig } from "orval";

// orval config (in vue 仓) — generates TS api-client from shared's OpenAPI.yaml.
//
// Source contract lives in shared 仓 at ../saas-identity-platform-shared/generated/openapi/openapi.yaml.
// This file is owned by vue 仓; other frontends (react / nextjs / kotlin-android) have their own copy.
// NOTE: vue 仓用 client: "vue-query"（不是 "react-query"），产出 @tanstack/vue-query 的 useQuery 等 hooks + 具名函数。
export default defineConfig({
  saas: {
    input: "../saas-identity-platform-shared/generated/openapi/openapi.yaml",
    output: {
      mode: "split",
      target: "./src/api/endpoints/endpoints.ts",
      client: "vue-query",
      override: {
        useDates: false,
        query: {
          useQuery: true,
          useInfinite: false,
          signal: true,
        },
      },
    },
  },
});