# CLAUDE.md — saas-identity-platform-vue

《Vue从入门到项目实践》案例二配套工程（SaaS 多租户统一身份管理）。React 双栈仓 [`../saas-identity-platform`](../saas-identity-platform) 的 Vue 姊妹仓，共享 API 契约 + MSW mock fixtures。

## 常用命令

```bash
npm install          # 安装依赖
npm test             # vitest run（MSW mock，无网络/Key/Docker）
npm run build        # vue-tsc --noEmit + vite build
npm run dev          # vite dev server（自动启 MSW worker）
npm run test:watch   # vitest watch 模式
```

## mock-friendly（硬约束）

- **不依赖**真实后端、Key、Docker、网络、IdP。
- 所有 `/api/*` 与 `/sso/*` 由 MSW 在 `mocks/handlers.ts` 拦截；SSO/OAuth 授权服务器也是 mock。
- JWT 由 `mocks/jwt.ts` 用固定 secret 签发，仅 mock 层。
- `tests/setup.ts` 启动 Node 侧 MSW server（`onUnhandledRequest: 'error'`）。
- `src/main.ts` 仅在 `DEV` 且 `VITE_OFFLINE !== '0'` 时启浏览器 worker，生产静态消除。
- → `npm test` 在离线 CI 上零配置全绿。

## 技术栈版本（钉死，见 output/xr-know-011/version-lock.json）

Vue 3.5 · TS 5.6 · Vite 6 · Vue Router 4 · Pinia 2 · Tailwind 4 · Vitest 2 · MSW 2 · axios 1.7 · Node 20 LTS。

## 只增不改（extend 模式）

向本仓加模块时，绝不修改现有 store/router/composable 的签名与行为；新模块独立测试；CI 双跑全绿。

## 与 React 双栈仓的对齐

- `src/types/*` 字段名与类型与 React 仓一致（tenant/user/rbac）。
- `mocks/{db,handlers,jwt}.ts` 路由 + 响应 shape + fake JWT 与 React 仓一致。
- Vue 适配：hooks→composables、zustand→pinia、context→provide/inject；API 契约不变。

## 章节归属

ch39 多租户 · ch40 统一认证+RBAC · ch41 用户管理+审计 · ch42 部署。详见 `README.md` 章节映射表。
