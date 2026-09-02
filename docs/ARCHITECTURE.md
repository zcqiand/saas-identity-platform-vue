# saas-identity-platform-vue Architecture

> Vue 3.5 前端仓架构。回答三个问题：
> 1. 这个仓在多仓家族里扮演什么角色、与 react 仓 1:1 对称到什么程度；
> 2. orval + vue-query + Pinia + shadcn-vue 这条链路怎么把 `shared/openapi.yaml` 变成可点击的页面；
> 3. v0.2.0（orval 自治）/ v0.3.0（shadcn-vue 化）/ v0.4.0（env-driven 单 URL）三次迁移各自把哪个旧形态打掉、新形态落地成什么。

> **范围**：本文档只描述 *本仓* 架构（结构 / 边界 / 数据流 / 决策）。
> 父仓总览见 [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)，单仓入口见 [CLAUDE.md](../CLAUDE.md)，
> 跨仓经验教训见 `~/.claude/.../memory/`（不入仓）。

---

## 0. 阅读路径

| 你是… | 直接看 |
|---|---|
| 新人，要 30 分钟搞懂本仓 | §1 → §2 → §3.1（orval 链） |
| 想加一个新页面 / 一个新接口 | §3.4 → §4.2 → [CLAUDE.md §2](../CLAUDE.md) 的禁止事项 |
| 想问「为什么 v0.4.0 把 BackendSwitcher 删了」 | §5 → [CLAUDE.md §3](../CLAUDE.md) → §6（决策索引） |
| 想知道"它和 react 仓差在哪" | §3.6（差异表）→ [react 仓 ARCHITECTURE.md](../saas-identity-platform-react/docs/ARCHITECTURE.md)（如有） |
| 想对接后端 / 切真后端 | §4.2（dev→prod 流程）→ §3.1（env 三层） |
| 想加 UI 组件 / 改 shadcn-vue 形态 | §3.3（ui/ 14 + 8 app 组件）→ [v0.3.0 migration doc](saas-identity-platform-v0.3.0-shadcn-vue-migration.md) |

---

## 1. 角色与定位

saas-identity-platform-vue 是 **saas-identity-platform 家族的前端 2/3 仓**。它不是独立产品，而是把 `saas-identity-platform-shared/generated/openapi/openapi.yaml` 这份契约渲染成 Vue 页面的渲染层。

**技术栈**（2026-08 现状）：

| 层 | 选型 | 版本 | 出处 |
|---|---|---|---|
| Framework | Vue | 3.5.x | `package.json:20` |
| Build | Vite + vue-tsc | 6.0.x / 2.1.x | `package.json:46/51` |
| State | Pinia | 2.3.x | `package.json:19` |
| Data fetching | @tanstack/vue-query | 5.62.x | `package.json:17` |
| HTTP | axios | 1.7.x | `package.json:18` |
| UI lib | shadcn-vue（Reka UI + Tailwind v4） | reka-ui 2.10 / tailwind 4.3 | `package.json:40/27/42` |
| Schema 校验 | zod | 3.23.x | `package.json:22` |
| Codegen | orval（client: vue-query） | 7.5.x | `package.json:38` |

**三条非选型边界**：

- **orval (vue-query client) 消费 shared openapi.yaml**——本仓自己读 `../saas-identity-platform-shared/generated/openapi/openapi.yaml`（`orval.config.ts:10`），**不**走 `file:../saas/...` 依赖路径（v0.2.0 之前的老路径已废止）。
- **env-driven 单 URL**——运行时不再切后端。`getApiBaseUrl()` 单一真源，部署平台覆盖 `.env.production`（ADR-0014）。
- **msw-http 模式**——dev 默认连 `@saas/identity-platform-msw/src/server.ts` 起的 `:5100` 独立 HTTP server；Service Worker 模式 v0.3.0 已删（[v0.3.0 migration §1](saas-identity-platform-v0.3.0-shadcn-vue-migration.md)）。

**与 react 仓的 1:1 对称性**：

| 维度 | vue 仓 | react 仓 |
|---|---|---|
| Codegen 客户端 | orval `client: "vue-query"` | orval `client: "react-query"` |
| State | Pinia setup store | Zustand store |
| UI 库 | shadcn-vue（Reka UI） | shadcn-ui（Radix UI） |
| 路由 | vue-router 4 | react-router 6 |
| 数据获取 hooks | `useXxxList / useXxxGet`（vue-query） | `useXxxList / useXxxGet`（react-query） |
| 默认后端 | aspnetcore `:5000` | springboot `:8080` |
| 目录骨架 | `src/{api,components,pages,state}` | 同形 |
| `data-fn` 锚点 | 42 子项 + 8 sidebar + 1 登出 | 同 |

二者 1:1 对称由 v0.3.0 迁移一次性对齐——见 [v0.3.0 migration doc](saas-identity-platform-v0.3.0-shadcn-vue-migration.md) §4「组件映射表」。

---

## 2. 目录骨架

```
saas-identity-platform-vue/
├── CLAUDE.md                            ← 入口：技术栈 + 禁止事项 + 指向别处
├── .harness/stack.json                  ← suite 门禁读取的项目自描述
├── docs/
│   ├── functions/function-tree.md       ← F/I 级功能清单（9 模块，镜像 react 仓）
│   └── saas-identity-platform-v0.3.0-shadcn-vue-migration.md   ← v0.3.0 迁移决策
├── scripts/
│   └── gen-shared.ts                    ← npm run gen:shared（orval 入口）
├── src/
│   ├── main.ts                          ← bootstrap：Pinia + VueQueryPlugin + installHttpClient
│   ├── App.vue                          ← 单 <router-view />（顶层壳）
│   ├── router.ts                        ← vue-router 4 嵌套路由 + auth guard
│   ├── index.css                        ← Tailwind v4 + 全局 token
│   ├── vite-env.d.ts                    ← ImportMetaEnv 类型
│   ├── shims.d.ts
│   ├── api/
│   │   ├── env.ts                       ← VITE_* 唯一适配点（v0.4.0 新增）
│   │   ├── backend-config.ts            ← getApiBaseUrl / getApiMode（v0.4.0 塌缩到 3 行）
│   │   ├── http-client.ts               ← axios + installHttpClient + ApiError + apiRequest
│   │   └── endpoints/
│   │       ├── endpoints.ts             ← orval codegen（gitignored）
│   │       └── endpoints.schemas.ts     ← orval codegen（gitignored）
│   ├── components/
│   │   ├── tenant-switcher.vue          ← 租户切换器（顶层，不在 app/ 下——对齐 react 仓路径）
│   │   ├── app/                         ← 业务组件（8 个 v0.3.0 新增）
│   │   │   ├── app-shell.vue            ← top bar + sidebar + main
│   │   │   ├── sidebar-nav.vue          ← 分组菜单 + footerAction + footerExtras slot
│   │   │   ├── backend-badge.vue        ← 无交互 backend 标签（v0.4.0 替代 BackendSwitcher）
│   │   │   ├── crud-dialog.vue          ← 通用 CRUD Dialog（fields: FieldDef[] 驱动）
│   │   │   ├── confirm-dialog.vue
│   │   │   ├── data-table.vue
│   │   │   ├── empty-state.vue
│   │   │   ├── field.vue
│   │   │   ├── page-header.vue
│   │   │   ├── pagination-bar.vue
│   │   │   └── status-badge.vue
│   │   └── ui/                          ← shadcn-vue 14 组件（33 文件含 sub-component 拆分）
│   │       ├── button.vue / button-cva.ts
│   │       ├── card.vue + 4 sub
│   │       ├── dialog.vue + 5 sub
│   │       ├── input.vue / textarea.vue / label.vue
│   │       ├── select.vue / checkbox.vue
│   │       ├── dropdown-menu.vue + 2 sub
│   │       ├── separator.vue / badge.vue / skeleton.vue
│   │       ├── table.vue + 4 sub
│   │       ├── alert-dialog.vue
│   │       └── sonner.vue               ← vue-sonner 包装
│   ├── lib/
│   │   └── utils.ts                     ← cn() helper（clsx + tailwind-merge）
│   ├── pages/                           ← 9 个页面（与 router.ts 1:1）
│   │   ├── LoginPage.vue                ← /login（独立，不走 AppShell）
│   │   ├── TenantListPage.vue           ← /tenants（M00.F01.I01）
│   │   ├── UserListPage.vue             ← /tenants/:tenantId/users
│   │   ├── RoleListPage.vue             ← /tenants/:tenantId/roles
│   │   ├── RoleMenuGrantPage.vue        ← /tenants/:tenantId/roles/:roleId/menus
│   │   ├── AppListPage.vue              ← /admin/apps
│   │   ├── MenuTreePage.vue             ← /admin/apps/:appId/menus
│   │   ├── ApiKeyListPage.vue           ← /tenants/:tenantId/api-keys
│   │   └── AuditListPage.vue            ← /tenants/:tenantId/audit
│   └── state/
│       └── tenant-store.ts              ← Pinia tenant store（auth + tenant + user + lookup）
├── tests/                               ← vitest 7 文件 66 行 fnTest
├── public/
├── .env.example                         ← committed 模板
├── .env.local                           ← gitignored dev 真后端
├── .env.production                      ← committed prod 默认（=aspnetcore）
├── .env.test                            ← committed vitest 隔离（=空 baseURL）
├── .gitignore / .prettierrc.json / eslint.config.js / tsconfig.json
├── vite.config.ts / vitest.config.ts
├── orval.config.ts                      ← 读 ../shared/generated/openapi/openapi.yaml
├── package.json / package-lock.json     ← deps: vue+pinia+vue-query+axios+zod
├── components.json                      ← shadcn-vue CLI 配置
├── Dockerfile / nginx.conf              ← prod 多阶段构建
└── deploy/
```

**目录骨架要点**：

- `src/api/endpoints/*` 是 **gitignored** 的 orval codegen 产物（`orval.config.ts:12`），改 shared 必须 `npm run gen:shared` 重生成；
- `src/components/{app,ui}/` 是 v0.3.0 一次性迁移后形态：8 业务组件（`app/`）+ 14 shadcn-vue 组件（`ui/`，含 sub-component 拆 33 文件）；
- `src/state/` 当前**只有** `tenant-store.ts`——v0.4.0 把 `backend-store.ts` 删除（ADR-0014），不再有 selection store 等。

---

## 3. 核心模块

### 3.1 src/api/ —— orval codegen + axios 注入点

| 文件 | 行数 | 职责 |
|---|---|---|
| `src/api/env.ts` | ~20 | **唯一** `import.meta.env.VITE_*` 适配点；3 个 key（BASE_URL / ENABLE_MSW / API_MODE）+ `readEnv()` 兜底 |
| `src/api/backend-config.ts` | ~30 | `getApiBaseUrl()` / `getApiMode()` 两个 getter；`??` 而非 `\|\|` 做 fallback（`""` 合法） |
| `src/api/http-client.ts` | ~85 | `installHttpClient(getToken)` 装 axios request interceptor；`ApiError` 封装；`apiRequest()` 低阶 fetch 兜底 |
| `src/api/endpoints/endpoints.ts` | (codegen) | orval 生成的 vue-query hooks + 具名函数 |
| `src/api/endpoints/endpoints.schemas.ts` | (codegen) | orval 生成的 TS 类型 |

**orval 链**：

```
../saas-identity-platform-shared/generated/openapi/openapi.yaml
  ↓ npm run gen:shared
orval.config.ts (client: "vue-query")
  ↓ 输出 split
src/api/endpoints/endpoints.ts
  ↓ 页面 import
useTenantUsersListUsers(tenantIdRef)  → 返回 { data, isLoading, ... }
useTenantUsersCreateUser(...)
```

**关键约束**（CLAUDE.md §2）：

- ❌ 禁止手写 `fetch + 字符串 URL` —— 一律走 orval 具名函数（`apiRequest()` 仅作不走 axios 的兜底）；
- ❌ 禁止 `import { ... } from "@saas/identity-platform-shared"` —— shared 仓**只读 yaml**，不读 TS；
- ❌ 禁止给 vite/vitest 加 `"@saas/shared"` alias —— 防走 npm 依赖陷阱。

### 3.2 src/components/app/ —— 业务组件（v0.3.0 全部新增）

| 文件 | 职责 | 关键 props / 锚点 |
|---|---|---|
| `app-shell.vue` | top bar + sidebar + main 三段式壳 | 面包屑由 `route.path` + `tenant-store.tenants()` 派生 |
| `sidebar-nav.vue` | 4 分组菜单 + 登出 + BackendBadge footer | slot: `footerAction` / `footerExtras` |
| `backend-badge.vue` | 显示 `getApiMode()` / `getApiBaseUrl()`，**无交互** | data-testid=`backend-badge` |
| `crud-dialog.vue` | 通用 CRUD Dialog，`fields: FieldDef[]` 驱动 | data-fn=`crud.cancel` / `crud.submit` |
| `confirm-dialog.vue` | 通用确认弹窗 | — |
| `data-table.vue` | shadcn-vue table 包装 + 列定义 | — |
| `empty-state.vue` | 空态占位 | — |
| `field.vue` | form field wrapper（label + control + hint） | — |
| `page-header.vue` | 页面标题 + 操作区 | — |
| `pagination-bar.vue` | 分页控件 | — |
| `status-badge.vue` | 状态标签 | — |

**v0.4.0 删减**：旧 `backend-switcher.vue` / `src/state/backend-context.ts` 已删除（CLAUDE.md §3 — ADR-0014）；`backend-badge.vue` 替代为无交互只读标签。

### 3.3 src/components/ui/ —— shadcn-vue 14 组件（33 文件）

```
src/components/ui/
├── button.vue + button-cva.ts            ← cva 抽 cva 配置（与 shadcn-ui 对齐）
├── card.vue + 4 sub (header/title/description/content/footer)
├── dialog.vue + 5 sub (overlay/title/description/content/footer)    ← 5 文件拆分
├── input.vue / textarea.vue / label.vue
├── select.vue / checkbox.vue
├── dropdown-menu.vue + 2 sub (item/separator)
├── separator.vue / badge.vue / skeleton.vue
├── table.vue + 4 sub (header/body/row/head/cell)
├── alert-dialog.vue
└── sonner.vue                            ← vue-sonner 包装（toast）
```

**要点**：

- shadcn-vue 默认**拆 5 文件**（dialog），比 shadcn-ui 更细；这是 Reka UI 的 API 习惯；
- 组件源码从 shadcn-vue 仓库按 Vue 3.5 风格调整后**直接进仓**，不走 npm 安装——这是 shadcn 模式本质；
- `button-cva.ts` 单独抽 cva 配置——vue 与 react 仓的 button 实现细节差异点。

### 3.4 src/state/tenant-store.ts —— Pinia 唯一 store

**职责**：tenant session 持久化 + login/logout + tenant lookup 薄包装。

```ts
export const useTenantStore = defineStore("tenant", () => {
  const session = ref<PersistedSession>(loadSession());  // lazy hydrate
  const isAuthenticated = computed(() => Boolean(session.value.accessToken && session.value.user));

  function login(payload) { /* persist */ }
  async function logout() { /* apiRequest + clear */ }
  function setTenant(id, code, token) { /* persist tenant context */ }
  function clear() { persist(emptySession()); }

  function tenantFor(tenantId: MaybeRefOrGetter<string>): ComputedRef<Tenant | null> {
    // 包装 useAdminTenantsGetTenant → ComputedRef<Tenant | null>
  }
  function tenants() { return useAdminTenantsListTenants(); }

  return { currentTenantId, tenantCode, accessToken, refreshToken, user, isAuthenticated,
           tenantFor, tenants, login, logout, setTenant, clear };
});
```

**关键不变量**（CLAUDE.md §2）：

- localStorage key 固定 `"saas.tenant"`（line 18）—— **禁止**改 key（多端 session 兼容）；
- store **首次 useTenantStore() 时同步 hydrate**（line 73）—— **禁止**在 `onMounted` 才 hydrate（路由守卫会误判未登录）；
- `installHttpClient(() => tenantStore.accessToken)` callback 形式取 token（`main.ts:19`）—— **避免**循环依赖（tenant-store → http-client → tenant-store）。

**为什么只有这一个 store**：v0.4.0 把 `backend-store.ts` 删了；v0.3.0 之前没有 selection store；新增 store 需走 `/tree-change` 提案。

### 3.5 src/pages/ —— 9 个页面（路由 1:1）

| 路由 | 页面 | 关键 fnId |
|---|---|---|
| `/login` | LoginPage.vue | M03.F01.I01 |
| `/tenants` | TenantListPage.vue | M00.F01.I01 / I02 / I04 / I05 |
| `/tenants/:tenantId/users` | UserListPage.vue | M01.F01.I01 + I02 / I04 / I05 + M01.F02.I01 |
| `/tenants/:tenantId/roles` | RoleListPage.vue | M02.F01 + M02.F02 + M09.F01.I01 |
| `/tenants/:tenantId/roles/:roleId/menus` | RoleMenuGrantPage.vue | M09.F02.I02 / I03 |
| `/admin/apps` | AppListPage.vue | M08.F01 + M04.F02.I06 |
| `/admin/apps/:appId/menus` | MenuTreePage.vue | M08.F01 + M08.F02 |
| `/tenants/:tenantId/api-keys` | ApiKeyListPage.vue | M05.F01 |
| `/tenants/:tenantId/audit` | AuditListPage.vue | M06.F01.I03 |

完整 I 级清单见 [docs/functions/function-tree.md](functions/function-tree.md)。

### 3.6 与 react 仓差异表

| 维度 | vue 仓 | react 仓 | 差异原因 |
|---|---|---|---|
| Codegen 客户端 | orval `vue-query` | orval `react-query` | 不同框架 |
| 路由 path | `/tenants` 起头 | 同 | 父仓约定一致 |
| UI 库 primitive | Reka UI | Radix UI | shadcn-vue vs shadcn-ui 上游不同 |
| Tailwind 渐变类名 | `bg-linear-to-br`（v4 新名） | 同 | Tailwind v4 升级同步 |
| 默认后端 | aspnetcore `:5000` | springboot `:8080` | 跨仓约定（CLAUDE.md §1） |
| `button-cva.ts` | 独立文件 | 内联在 button.tsx | vue SFC 风格 |

---

## 4. 核心流程

### 4.1 dev 启动（msw-http 模式）

```
1. 启动 mock 后端:
   cd ../saas-identity-platform-msw && npm start
   → http://localhost:5100   ← GET /healthz → { mode: "msw-http", uptime }

2. 启动 vue 仓 dev:
   npm run dev
   → http://localhost:5103

3. 浏览器调 API:
   userList = useTenantUsersListUsers(tenantIdRef)
   → orval codegen 调用 src/api/endpoints/endpoints.ts
   → 实际 fetch http://localhost:5100/api/v1/tenants/{id}/users  (baseURL 由 interceptor 注入)
   → saas-msw handlers 拦截 → in-memory fixture
   → 返回 JSON
```

### 4.2 切真后端（dev 后期 / 集成测试）

```
1. 编辑 .env.local（gitignored）:
   VITE_API_BASE_URL=http://localhost:5104     ← aspnetcore dev
   # 或
   VITE_API_BASE_URL=http://localhost:5105     ← springboot dev

2. 重启 npm run dev（Vite env 变更需要重启）

3. axios request interceptor 自动注入新 baseURL
   → 浏览器 fetch http://localhost:5104/api/v1/...
   → springboot/aspnetcore NimbusJwtDecoder 验 HS256 真签 JWT（prod 走 JWKS，dev 走对称密钥 `Jwt:SigningKey`）
   → 返回真数据
```

### 4.3 改一次契约 → 三端同步

```
1. [shared] 改 tsp/main.tsp / tsp/{models,routes}/*.tsp
   ↓ commit + push

2. [shared] npm run build         ← emit:openapi
   gate: python scripts/gate.py -p saas-identity-platform-shared
   ↓ exit 0

3. [vue 仓] npm run gen:shared     ← tsx scripts/gen-shared.ts
   固定两步：
   a) (cd ../shared && npm run emit:openapi)
   b) orval 读 ../shared/generated/openapi/openapi.yaml → src/api/endpoints/*
   ↓ git commit + push（tag v<X>-<YYYYMMDD>）

4. [react / nextjs / 后端 ×3] 各自跑 gen-shared

5. [父仓] git update-index --add --cacheinfo 160000,<NEW_HASH>,output/saas-identity-platform-vue
   chore(submodule): 推进 vue 仓指针

6. [suite] python scripts/gate.py -p saas-identity-platform-vue
   ↓ L0..L5 全绿
```

**关键检查点**：

- 改契约时必须**先**改 shared BASE tree 的 F 级（[父仓 ADR-0003](../../../docs/adr/0003-function-tree-requires-human-approval.md)），再改 vue 仓 I 级子项；否则 L5 红；
- `orval.config.ts` `client: "vue-query"` 切错（如写成 `react-query`） → tsc 编译失败但 bundle 仍能跑；
- vue 仓 `package.json:5` 是 `"type": "module"` → `orval.config.ts` 必须是 ESM。

### 4.4 路由 + 鉴权流程

```
浏览器访问 http://localhost:5103/tenants
  ↓ vue-router 创建 router
  ↓ router.beforeEach 守卫
    tenantStore.isAuthenticated?  (从 localStorage 同步读)
    ├─ false → 重定向 /login
    └─ true → AppShell 渲染
      ↓ AppShell 内 <router-view /> 渲染 children
      ↓ TenantListPage.vue 调 useAdminTenantsListTenants()
        → axios GET /api/v1/admin/tenants
        → Bearer token from interceptor (getApiBaseUrl + getToken callback)
```

**关键检查点**（CLAUDE.md §2）：

- ❌ 禁止 store 在 `onMounted` 才 hydrate（守卫会先判 false）；
- `installHttpClient()` 在 `useTenantStore()` **之后**调（`main.ts:16-19`），否则 callback 取到 undefined。

---

## 5. v0.4.0 关键基建

v0.4.0 是**后端配置塌缩到 env** 的一次硬迁移（ADR-0014），把三个运行时形态打掉：

### 5.1 新增的 5 个文件

| 文件 | 状态 | 职责 |
|---|---|---|
| `src/api/env.ts` | 新增 | 唯一 `import.meta.env.VITE_*` 适配点 |
| `src/api/backend-config.ts` | 塌缩到 ~30 行 | 3 个 getter：`getApiBaseUrl()` / `getApiMode()`（`isMswEnabled()` 已删） |
| `src/components/app/app-shell.vue` | 重构 | 移 backend-switcher 调用为 BackendBadge 显示 |
| `src/components/app/sidebar-nav.vue` | 重构 | 移除 backend 切换 slot，改 footerExtras slot 装 BackendBadge |
| `src/components/app/backend-badge.vue` | 新增 | 无交互 backend 标签 |

### 5.2 废止的旧形态

| 旧形态 | 替代 |
|---|---|
| `src/state/backend-context.ts` Pinia store + 模块单例 | 删除（env.ts + backend-config.ts 取代） |
| `src/components/app/backend-switcher.vue` | 删除（backend-badge.vue 无交互替代） |
| `localStorage["saas.backend"]` 持久化 | 删除（部署期 env 取代） |
| `BackendMode = "msw" \| "aspnetcore" \| "springboot" \| "nextjs-self"` 联合类型 | 删除（env-driven 单 URL） |
| `isMswEnabled()` getter + `VITE_ENABLE_MSW` env | 删除（v0.3.0 已删 SW 模式，dev 默认走 :5100 msw-http） |

### 5.3 反转的旧规则

旧 [CLAUDE.md §禁止事项](#) 写过「禁止用 env 配后端」——v0.4.0 已反转（CLAUDE.md §2 注释明示）：

> ❌ **必须**把 `VITE_API_BASE_URL` / `VITE_ENABLE_MSW` / `VITE_API_MODE` 写到 `.env.example`，部署平台覆盖 — ADR-0014

`VITE_ENABLE_MSW` 在 v0.3.0 已从 `env.ts` 删除（CLAUDE.md 注释迟滞，下一轮同步）。

### 5.4 env 三层

| 文件 | 入仓 | 用途 |
|---|---|---|
| `.env.example` | committed | 模板，注释完整 ADR 引用 |
| `.env.local` | gitignored | dev 真后端（aspnetcore :5000 / springboot :8080） |
| `.env.production` | committed | prod 默认（=aspnetcore + msw-http=false） |
| `.env.test` | committed | vitest 隔离（空 baseURL → SW/MSW 拦截） |

**`??` 而非 `\|\|` fallback**（`backend-config.ts:14-15` 注释）：

> 用 `??` 而非 `||` 做 fallback——`""` 是合法值（test 模式显式空 baseURL），
> 不应被替换成 msw-http 默认。生产/开发路径永远走默认值；测试期才能命中空 baseURL。

---

## 6. 决策索引

本仓 0 份本地 ADR——所有架构决策由 **父仓** 或上游仓的 ADR 约束。本仓决策 = *接受这些 ADR 的实施*：

| 决策 | 出处 | 本仓落地 |
|---|---|---|
| ADR-0003 function-tree 需人批 | [父仓](../../../docs/adr/0003-function-tree-requires-human-approval.md) | 新增/废弃 I 必须 `/tree-change` |
| ADR-0007 shared 双 SSOT | [父仓](../../../docs/adr/0007-shared-sql-ssot.md) | 本仓只读 yaml，不 import shared TS |
| ADR-0008 nextjs 全栈 | [父仓](../../../docs/adr/0008-nextjs-full-stack.md) | vue 仓不兼全栈 |
| ADR-0012 msw 升级为 HTTP 服务 | [父仓](../../../docs/adr/0012-msw-as-http-server.md) | dev 默认连 :5100，删除 SW 模式 |
| **ADR-0014 env-driven 单 URL** | [父仓 multi-repo-family.md §4](../../../docs/conventions/multi-repo-family.md#4-后端配置env-driven-单-urladr-0014) | v0.4.0 落地（§5） |
| v0.2.0 自己 orval | [迁移 doc](saas-identity-platform-v0.3.0-shadcn-vue-migration.md)（背景段） | orval.config.ts 自治 |
| v0.3.0 shadcn-vue 化 | [迁移 doc](saas-identity-platform-v0.3.0-shadcn-vue-migration.md) | 14 UI + 8 app 组件 + 嵌套路由 |
| v0.4.0 env 塌缩 | [父仓 ADR-0014](../../../docs/conventions/multi-repo-family.md#4-后端配置env-driven-单-urladr-0014) | 本仓 §5 详述 |

---

## 7. 术语表

| 术语 | 含义 | 详细 |
|---|---|---|
| **shadcn-vue** | Reka UI + Tailwind v4 + cva + cn() 的 Vue 版 UI 库 | [v0.3.0 迁移 §1](saas-identity-platform-v0.3.0-shadcn-vue-migration.md) |
| **Reka UI** | Radix UI 的 Vue 移植（Vue 3 Composition API 风格） | shadcn-vue 上游 |
| **vue-query** | @tanstack/vue-query 的 hooks 集合 | orval codegen 目标 client |
| **orval vue-query** | orval 的 client 形态之一，产出 vue-query 的 useXxx hooks | `orval.config.ts:14` |
| **cva** | class-variance-authority：组件变体驱动的 className 工具 | shadcn 模式标配 |
| **`data-fn`** | DOM 锚点，挂 M/F/I 子项 ID 给 L5 引用完整性门检查 | CLAUDE.md §2 禁止未登记 fnId 挂上 |
| **installHttpClient** | axios interceptor 安装函数（Vue 仓只用一次） | `http-client.ts:42` |
| **tenant-store** | 唯一 Pinia store，承载 session + tenant + user + lookup | `state/tenant-store.ts` |
| **msw-http** | msw 仓 ADR-0012 B 强度的 HTTP server 形态 | `:5100` 默认 |
| **msw SW** | Service Worker 拦截模式——**已废弃**（v0.3.0 删除） | `env.ts` 注释 |
| **env 三层** | `.env.example`（committed）/ `.env.local`（gitignored）/ `.env.test`（committed） | §5.4 |
| **AD-0014** | env-driven 单 URL 决策（父仓） | [multi-repo-family.md §4](../../../docs/conventions/multi-repo-family.md#4-后端配置env-driven-单-urladr-0014) |
| **BASE tree** | 契约仓的功能清单（只到 F 级） | [父仓 ADR-0007](../../../docs/adr/0007-shared-sql-ssot.md) |
| **1:1 对称** | vue 仓与 react 仓同构（fnId + 文案 + selector 一致） | §3.6 差异表 |

---

## 附录 A：与父仓 docs/ARCHITECTURE.md 的关系

**本文档是父仓 §4.3「前端仓（react/vue/nextjs ×3 = 6 仓）」的 zoom-in。** 父仓文档描述 *6 个前端仓同构形态*；本文档描述 *vue 仓的 3 次迁移 + 14 UI 组件 + 9 page + 1 store* 的具体实现。

| 父仓 § | 本仓对应 |
|---|---|
| §3.3 env-driven 单 URL | §5（本仓 ADR-0014 落地形态） |
| §3.6 msw = 独立 HTTP 服务 | §4.1（dev 流程） |
| §4.3 前端仓目录骨架 | §2（本仓实际目录） |
| §5.1 改一次契约 → 三端同步 | §4.3 |
| §5.2 前端开发（react / vue / nextjs） | §4.1 + §4.2 |
| §7.4 ADR-0014 | §5 + §6 |

**反过来**：vue 仓独有的 shadcn-vue 细节、14 UI 组件拆分、9 page 路由映射、`tenant-store.ts` 单一 store 设计——父仓文档只字未提。

## 附录 B：跨仓经验教训（详见 `~/.claude/.../memory/`）

| 陷阱 | 后果 | 修法（本仓视角） |
|---|---|---|
| orval + axios 没 `installHttpClient` 拦截器 | prod 永远走同 origin 被 nginx 405 | `main.ts:19` 调 `installHttpClient(() => tenantStore.accessToken)` |
| axios baseURL 含 `/api/v1` 前缀 | path 前缀重复 | baseURL = root URL（`http://localhost:5100`），path 自带 `/api/v1` |
| orval transitive `openapi-types` 锁文件 | npm install 不动 / npm ci EUSAGE | `package.json` devDeps 显式钉 openapi-types（待补） |
| 改 store 在 `onMounted` 才 hydrate | 路由守卫先判 false → 跳 /login | tenant-store 同步 lazy hydrate（line 73） |
| `import { ... } from "@saas/identity-platform-shared"` | 走 npm 依赖循环 | 只读 yaml；orval 本地生成（CLAUDE.md §2） |
| 给 vite/vitest 加 `"@saas/shared"` alias | 同上 | 禁止（CLAUDE.md §2） |
| 旧 BackendSwitcher + useBackendStore + localStorage 残留 | 运行时切后端漂移 | v0.4.0 删除（§5.2）；恢复即破坏 ADR-0014 |
| `??` vs `\|\|` fallback 错用 | test 模式空 baseURL 被替换成默认 | `backend-config.ts:14` 注释强调 |

## 附录 C：关键命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 启动 Vite dev server（:5103），自动 gen:shared？**否**——需手动 |
| `npm run gen:shared` | orval 重读 shared yaml → 刷 `src/api/endpoints/` |
| `npm run build` | `vue-tsc -b && vite build`（前置 `prebuild` 自动跑 `gen:shared`） |
| `npm run typecheck` | `vue-tsc --noEmit`（无产物，纯检查） |
| `npm run lint` | eslint src tests --ext .ts,.vue |
| `npm run test` | vitest run（自动读 `.env.test`） |
| `python scripts/gate.py -p saas-identity-platform-vue` | suite 门禁 L0..L5 |