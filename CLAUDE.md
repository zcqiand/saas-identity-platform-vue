# saas-identity-platform-vue

> Vue 3.5 + Vite + Pinia + Vue Query + TS 5.7 + shadcn-vue + Tailwind v4。**v0.2.0 自己 orval** + **v0.3.0 全面 shadcn-vue 化** + **v0.4.0 后端配置塌缩到 env**（ADR-0014 — 完全镜像 nextjs）。

## 1. 这是什么

saas-identity-platform 的 Vue 前端（已落地 v0.2.0 迁移 + v0.3.0 shadcn-vue 迁移 + v0.4.0 env 驱动）。

- **UI 框架**：shadcn-vue（Reka UI primitive + Tailwind v4 + 14 个 SFC 组件 `src/components/ui/`）
- **MSW**：走 `@saas/identity-platform-msw` 共享 mock 仓（devDep）
- **API client**：本仓 `orval.config.ts` 读 `../saas-identity-platform-shared/generated/openapi/openapi.yaml` → `src/api/endpoints/{endpoints,endpoints.schemas}.ts`（client: `vue-query`）
- **后端配置**：env-driven 单 URL（ADR-0014 — `src/api/env.ts` 唯一 env 适配点 + `src/api/backend-config.ts` 3 个 getter；运行时不再切，删 useBackendStore / BackendSwitcher）
  - **跨仓约定**：react 仓默认 → springboot (:8080)；vue 仓默认 → aspnetcore (:5000)
  - **env 三层**：`.env.example`（committed 模板）/ `.env.local`（gitignored，dev 真后端）/ `.env.test`（committed，vitest MSW 隔离）
- **运行时校验**：zod（兜底）

## 2. 禁止事项（v0.4.0 hard rules — ADR-0014 已反转「禁止 env」规则）

- ❌ 禁止从 `@saas/identity-platform-shared` import TS 客户端
- ❌ 禁止给 vite/vitest 加 `"@saas/shared"` alias
- ❌ **禁止**运行时切后端 / 禁止恢复 useBackendStore / BackendSwitcher / localStorage["saas.backend"]（**v0.4.0 已废弃**）
- ❌ **必须**把 `VITE_API_BASE_URL` / `VITE_ENABLE_MSW` / `VITE_API_MODE` 写到 `.env.example`，部署平台覆盖 — ADR-0014
- ❌ 禁止给按钮加 lucide 图标（用户明确要求**纯文字按钮**；layout 装饰图标保留清单见 commit log）
- ❌ 禁止手写 fetch + 字符串 URL —— 一律走 orval 具名函数
- ❌ 禁止 `vi.mock('axios')` / axios 升 1.19 / 禁止在 shared 把 react-query 列在 dependencies
- ❌ 禁止 demo 密码出现在 UI / 注释 / 测试断言
- ❌ 禁止用 `<script>` 而非 `<script setup lang="ts">`；禁止 store 在 `onMounted` 才 hydrate
- ❌ 禁止手写 `<table>` / `<select>` / 内联样式 / `window.confirm` / 未登记 fnId 挂在 data-fn

## 3. 5 个核心基建文件（v0.4.0 — ADR-0014）

| 文件 | 职责 |
| --- | --- |
| `src/components/app/app-shell.vue` | 顶栏 + sidebar + 内容；4 组 sidebar 分组 |
| `src/components/app/sidebar-nav.vue` | 分组菜单 + 登出按钮 + BackendBadge footer |
| `src/api/env.ts` | 唯一 `import.meta.env.VITE_*` 适配点（v0.4.0 新增） |
| `src/api/backend-config.ts` | env 适配：3 个 getter（v0.4.0 塌缩） |
| ~~`src/state/backend-context.ts`~~ / ~~`src/components/app/backend-switcher.vue`~~ | v0.4.0 删除 — ADR-0014 |
| `src/components/app/backend-badge.vue` | 无交互 backend 标签（v0.4.0 替代） |
| `src/components/app/crud-dialog.vue` | 通用 CRUD Dialog；`fields: FieldDef[]` 驱动 |

## 4. 指向别处

- shared 仓：`../saas-identity-platform-shared`（**只读 `generated/openapi/openapi.yaml`**）
- msw 仓：`../saas-identity-platform-msw`（`@saas/identity-platform-msw`，handler 在那边）
- 迁移指南：`docs/saas-identity-platform-v0.{2.0,3.0,4.0}-*.md`（v0.4.0 新增）
- function-tree：`docs/functions/function-tree.md`

## 5. 工作循环

1. 改 UI（`src/pages/<module>/*.vue`）
2. 改 UI 组件？→ `src/components/{app,ui}/*.vue`
3. 改了 shared？→ `npm run gen:shared`（orval 读 yaml 重生成本仓 `src/api/endpoints/`）
4. `python scripts/gate.py -p saas-identity-platform-vue`