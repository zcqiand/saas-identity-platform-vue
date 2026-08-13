# saas-identity-platform-vue

> Vue 3.5 + Vite + Pinia + Vue Query + TS 5.7 + shadcn-vue + Tailwind v4。**v0.2.0 自己 orval** + **v0.3.0 全面 shadcn-vue 化**（左侧菜单 + 右侧内容布局）。

## 1. 这是什么

saas-identity-platform 的 Vue 前端（已落地 v0.2.0 迁移 + v0.3.0 shadcn-vue 迁移）。

- **UI 框架**：shadcn-vue（Reka UI primitive + Tailwind v4 + 14 个 SFC 组件 `src/components/ui/`，与 React 仓 `src/components/ui/` 1:1 对应）
- **MSW**：走 `@saas/identity-platform-msw` 共享 mock 仓（devDep）
- **API client**：本仓 `orval.config.ts` 读 `../saas-identity-platform-shared/generated/openapi/openapi.yaml` → `src/api/endpoints/{endpoints,endpoints.schemas}.ts`（client: `vue-query`）
- **运行时后端切换**：模块级单例 `src/api/backend-config.ts` + Pinia store `src/state/backend-context.ts`；msw / aspnetcore / springboot 三模式可运行时切换，不需 rebuild
- **运行时校验**：zod（v0.2.0 在 `package.json dependencies` 引入，作为兜底）

## 2. 禁止事项（v0.3.0 hard rules）

- ❌ 禁止从 `@saas/identity-platform-shared` import TS 客户端（shared 仓已删除 TS 产物；只产 OpenAPI.yaml）
- ❌ 禁止给 vite/vitest 加 `"@saas/shared"` alias（指向 `shared/generated/ts`，shared 仓瘦身后会 vite 解析失败）
- ❌ 禁止把后端模式写到 `.env` / `.env.example` / `vite.config.ts` proxy —— 切模式必须 runtime 可改，不需 rebuild
- ❌ 禁止给按钮加 lucide 图标（用户明确要求**纯文字按钮**；layout 装饰图标保留：Building2 / Users / Shield / KeyRound / ScrollText / Boxes / FolderTree / LogOut / ChevronRight / Home / Check / ChevronLeft / ChevronRight / ChevronsUpDown / Server / X）
- ❌ 禁止手写 fetch + 字符串 URL —— 一律走 `adminTenantsCreateTenant(body)` 等 orval 具名函数
- ❌ 禁止 `vi.mock('axios')` 来 mock API —— orval 加载时会崩，`shared` 模块初始化失败只剩 `getTitle` 一个 export
- ❌ 禁止 axios 升 1.19 —— orval 7 类型推断会挂（`AxiosResponseResult` 不兼容）
- ❌ 禁止在 shared 仓把 `@tanstack/react-query` 列在 `dependencies`（改放 `devDependencies`，让消费方自己装框架对应的包）
- ❌ 禁止 demo 密码（`demo123` / `DEMO_PASSWORD` 等）出现在 UI / 注释 / 测试断言
- ❌ 禁止用 `<script>` 而非 `<script setup lang="ts">` —— 一律 setup + Composition API
- ❌ 禁止在组件里直接 fetch —— 一律走 orval 生成的具名函数
- ❌ 禁止 store 在 `onMounted` 才 hydrate —— tenant-store / backend-context 必须 setup-style lazy initializer（store 首次 `useXxxStore()` 调用时同步读 localStorage）
- ❌ 禁止在 page 中用 `<button style="padding: 6px 12px">` 之类内联样式 —— 一律走 shadcn-vue Button 组件 + Tailwind 工具类
- ❌ 禁止手写 `<table>` / `<thead>` / `<tbody>` 长列表 —— 一律走 `src/components/app/data-table.vue`（已内置 loading 骨架 + 空态 + 列表三态）
- ❌ 禁止写 `window.confirm` / `alert(...)` —— 危险操作走 `src/components/app/confirm-dialog.vue`，消息提示走 `vue-sonner` `toast.success/error()`
- ❌ 禁止自定义 `<select>` 风格的下拉 —— 一律走 `src/components/ui/select.vue`（Reka UI + shadcn-vue 样式）
- ❌ 禁止未在 function-tree 登记的 fnId 挂在 `data-fn` 上 —— 软告警会上升

## 3. 6 个核心基建文件（其他 6 仓镜像迁移时要复制这 6 个）

| 文件 | 职责 |
| --- | --- |
| `src/components/app/app-shell.vue` | 顶栏 + 左侧 sidebar + 内容；4 组 sidebar 分组（首页 / 身份管理 / 平台运营 / 应用与菜单） |
| `src/components/app/sidebar-nav.vue` | 分组菜单 + 登出按钮 + BackendSwitcher footer；每个 navItem 挂 `data-fn` |
| `src/api/backend-config.ts` | 模块级单例；7 个 getter/setter；hydrate/snapshot 双向桥 |
| `src/state/backend-context.ts` | Pinia store；同步 hydrate 单例；useBackendStore() 暴露 reactive state |
| `src/components/app/backend-switcher.vue` | sidebar 底部 DropdownMenu + 自定义 baseUrl 编辑 |
| `src/components/app/crud-dialog.vue` | 通用 CRUD Dialog；fields: FieldDef[] 驱动；支持 text/textarea/select/checkbox |

## 4. 指向别处

- shared 仓：`../saas-identity-platform-shared`（**只读 `generated/openapi/openapi.yaml`**）
- msw 仓：`../saas-identity-platform-msw`（`@saas/identity-platform-msw`，handler 在那边）
- 迁移指南（v0.2.0）：react 仓 `docs/saas-identity-platform-v0.2.0-migration.md`（vue/nextjs 必读 §6）
- 迁移指南（v0.3.0 shadcn-vue）：`docs/saas-identity-platform-v0.3.0-shadcn-vue-migration.md`
- function-tree：`docs/functions/function-tree.md`

## 5. 工作循环

1. 改 UI（`src/pages/<module>/*.vue`）
2. 改 UI 组件？→ `src/components/{app,ui}/*.vue`
3. 改了 shared？→ `npm run gen:shared`（orval 读 yaml 重生成本仓 `src/api/endpoints/`）
4. `python scripts/gate.py -p saas-identity-platform-vue`
