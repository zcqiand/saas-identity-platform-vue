// 后端配置：env-driven 单 URL（ADR-0014 — 完全镜像 saas-identity-platform-nextjs）。
//
// 旧 3-backend 运行时切换（msw / aspnetcore / springboot）+ localStorage 持久化
// + 模块单例 + Pinia store 已废弃。改用：
//
//   VITE_API_BASE_URL    后端 base URL（默认 "http://localhost:5174" msw-http；
//                        显式设为空串时保留为空 → test 模式同源 MSW 拦截）
//   VITE_API_MODE        显示标签（默认 "msw-http"），仅 UI 显示
//
// ADR-0012 v0.3.0：Service Worker 模式完全删除。dev 路径只走 msw-http
//（独立 HTTP server，由 @saas/identity-platform-msw/src/server.ts 起在 :5174）；
// *_ENABLE_MSW env 与 isMswEnabled() 函数一并删除。
//
// 关键差异：用 `??` 而非 `||` 做 fallback——`""` 是合法值（test 模式显式空 baseURL），
// 不应被替换成 msw-http 默认。生产/开发路径永远走默认值；测试期才能命中空 baseURL。
//
// 所有调用方从 `getBaseUrl()` / `getBackend()` 切到 `getApiBaseUrl()` / `getApiMode()`。

import { env } from "./env";

export function getApiBaseUrl(): string {
  return env.VITE_API_BASE_URL ?? "http://localhost:5174";
}

export function getApiMode(): string {
  return env.VITE_API_MODE ?? "msw-http";
}