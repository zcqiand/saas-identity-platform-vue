# saas-identity-platform-v0.3.0-shadcn-vue-migration

> Vue 端 v0.2.0（orval 自生成）之后的 v0.3.0 迁移：全面 shadcn-vue 化 + 左侧菜单布局。

## 背景

v0.2.0 完成了 vue 端 orval 自治（不再 `file:` 依赖 shared 仓 TS 产物），但 UI 仍停留在「手写 markup + 极简 CSS」阶段：

- 9 个 page 全部用 `<button style="padding: 6px 12px">` 风格的硬编码内联样式
- 没有 UI 库，没有 Tailwind，没有 design token
- App.vue 顶部没有侧栏菜单，只有顶部 `<router-view name="header" />` 多视图路由模式
- 视觉与 React 仓（已落地 shadcn-ui + Tailwind v4 + AppShell）严重不对齐

v0.3.0 一次性把这 4 件事做完：UI 库 + 布局 + 全 page 改写 + 文档同步。

## 决策

### 1. UI 库选型：shadcn-vue（1:1 对齐 React 仓）
- React 仓已用 [shadcn-ui](https://ui.shadcn.com/)（Radix UI + Tailwind v4 + cva + cn() + lucide-react + sonner）
- Vue 端的对等方案是 [shadcn-vue](https://www.shadcn-vue.com/)：Reka UI（Radix UI 的 Vue 移植）+ Tailwind v4 + 同样的 cva + clsx + tailwind-merge + lucide-vue-next + vue-sonner
- 组件 API 命名同步（button / card / dialog / input / textarea / label / select / checkbox / dropdown-menu / separator / badge / skeleton / table / alert-dialog / sonner）；迁移 React 仓样板代码几乎原样可用

### 2. 布局：左侧菜单 + 右侧内容，与 React 仓对齐
- 采用 React 仓 [app-shell.tsx](https://github.com/...) 1:1 镜像结构
- 左侧 sidebar 深色（`bg-slate-900`），4 个分组（首页 / 身份管理 / 平台运营 / 应用与菜单）+ 7 个 navItem + 底部登出按钮 + 后端切换器 + 版本号
- 顶部 14 px 高的 header（`bg-white/80 backdrop-blur`）放面包屑 + 右上 TenantSwitcher
- 主区 `max-w-6xl mx-auto p-6` 居中

### 3. 路由：嵌套路由（vue-router 4 Layout Route 模式）
- 旧模式：`<router-view name="header">` 多视图路由 + 每个路由都列出 TenantSwitcher
- 新模式：单根路由 `/` 包裹 AppShell，AppShell 内 `<router-view />` 渲染 children；`/login` 独立不走 AppShell
- 与 React 仓 `<RequireAuth><AppShell /></RequireAuth>` 包装 9 个路由的模式 1:1 对称

### 4. 范围：全面重构（9 page + 3 组件 + AppShell + 路由）
- 9 page 全部用 shadcn-vue 组件改写（保留 `data-fn` 锚点 1:1）
- 3 组件（backend-switcher / crud-dialog / tenant-switcher）迁移到 `src/components/app/` + 改写样式
- 7 个新业务组件（app-shell / sidebar-nav / page-header / data-table / empty-state / confirm-dialog / field / pagination-bar / status-badge）镜像 React 仓
- 14 个 shadcn-vue 组件（button / card / dialog / input / textarea / label / select / checkbox / dropdown-menu / separator / badge / skeleton / table / alert-dialog / sonner）从 shadcn-vue 仓库源码复制并按 Vue 3.5 风格调整

## 组件映射表（React → Vue）

| React 仓 | Vue 仓 | 备注 |
| --- | --- | --- |
| `@/components/ui/button` | `@/components/ui/button.vue` | 同 prop / variant |
| `@/components/ui/card` | `@/components/ui/card.vue` + 4 个 sub-component (header/title/description/content/footer) | 拆文件 |
| `@/components/ui/dialog` | `@/components/ui/dialog.vue` + sub-component (title/description/content/footer) | shadcn-vue 默认拆 5 文件 |
| `@/components/ui/input` | `@/components/ui/input.vue` | 同 |
| `@/components/ui/textarea` | `@/components/ui/textarea.vue` | 同 |
| `@/components/ui/label` | `@/components/ui/label.vue` | 同 |
| `@/components/ui/select` | `@/components/ui/select.vue` | shadcn-vue 用 Reka UI 替代 Radix UI |
| `@/components/ui/checkbox` | `@/components/ui/checkbox.vue` | 同 |
| `@/components/ui/dropdown-menu` | `@/components/ui/dropdown-menu.vue` + 3 个 sub-component | 拆文件 |
| `@/components/ui/separator` | `@/components/ui/separator.vue` | 同 |
| `@/components/ui/badge` | `@/components/ui/badge.vue` | 同 |
| `@/components/ui/skeleton` | `@/components/ui/skeleton.vue` | 同 |
| `@/components/ui/table` | `@/components/ui/table.vue` + 5 个 sub-component | 拆文件 |
| `@/components/ui/alert-dialog` | `@/components/ui/alert-dialog.vue` | shadcn-vue 用 Reka UI |
| `@/components/ui/sonner` | `@/components/ui/sonner.vue` | 包装 vue-sonner |
| `@/components/app/page-header` | `@/components/app/page-header.vue` | 1:1 |
| `@/components/app/empty-state` | `@/components/app/empty-state.vue` | 1:1 |
| `@/components/app/field` | `@/components/app/field.vue` | 1:1 |
| `@/components/app/data-table` | `@/components/app/data-table.vue` | 1:1 |
| `@/components/app/confirm-dialog` | `@/components/app/confirm-dialog.vue` | 1:1 |
| `@/components/app/crud-dialog` | `@/components/app/crud-dialog.vue` | 1:1 |
| `@/components/app/status-badge` | `@/components/app/status-badge.vue` | 1:1 |
| `@/components/app/pagination-bar` | `@/components/app/pagination-bar.vue` | 1:1 |
| `@/components/app/backend-switcher` | `@/components/app/backend-switcher.vue` | 1:1（位置从 `src/components/` 移到 `src/components/app/`） |
| `@/components/app/app-shell` | `@/components/app/app-shell.vue` | 1:1 |
| `@/components/app/sidebar-nav` | `@/components/app/sidebar-nav.vue` | 1:1 |
| `@/components/tenant-switcher` | `@/components/tenant-switcher.vue` | 1:1（保留在 `src/components/` 顶层，对齐 React 仓路径） |

## 9 page 镜像对照

| Vue page | React 镜像 | 关键 fnId |
| --- | --- | --- |
| `LoginPage.vue` | `LoginPage.tsx` | M03.F01.I01 |
| `TenantListPage.vue` | `TenantListPage.tsx` | M00.F01.I02 / I04 / I05 |
| `UserListPage.vue` | `UserListPage.tsx` | M01.F01.I02 / I04 / I05 + M01.F02.I01 |
| `RoleListPage.vue` | `RoleListPage.tsx` | M02.F01.I02 / I04 / I05 + M02.F02.I01 + M09.F01.I01 |
| `RoleMenuGrantPage.vue` | `RoleMenuGrantPage.tsx` | M09.F02.I02 / I03 |
| `AppListPage.vue` | `AppListPage.tsx` | M08.F01.I02 / I04 / I05 + M04.F02.I06 |
| `MenuTreePage.vue` | `MenuTreePage.tsx` | M08.F01.I02 / I04 / I05 + M08.F02.I01 + I07 |
| `ApiKeyListPage.vue` | `ApiKeyListPage.tsx` | M05.F01.I02 / I03 / I04 |
| `AuditListPage.vue` | `AuditListPage.tsx` | M06.F01.I03 |

## 关键不变量

- ✅ `data-fn` 锚点 1:1 保留（42 子项 + 8 sidebar + 1 登出，满足 L5 软告警）
- ✅ 测试 selector 1:1 保留（7 文件 66 行 `data-fn` 选择器，markup 改写不破测试）
- ✅ 文案 1:1 保留（"新建租户" / "编辑" / "删除" / "创建 Key" / "轮换" / "吊销" / "导出 CSV" / "邀请用户" / "新建角色" / "新建应用" / "新建菜单" / "分配角色" / "权限矩阵" / "菜单授权" / "保存 (n)"）
- ✅ 业务逻辑（query key / mutation / invalidation）保持
- ✅ state store 引用（useTenantStore / useBackendStore）保持

## 已知坑（本次迁移遇到）

1. **Vue 3.5 `withDefaults` + `[key: string]: unknown` index signature 不兼容** → 移除 index signature，让 props 类型严格
2. **Vue 3.5 `<script setup>` + `<script>` 多 block re-export 子组件** → shadcn-vue 模式：拆 5 个独立 SFC（dialog-title / dialog-description / dialog-content / dialog-footer / dialog-overlay）
3. **Reka UI v2 slot / root 组件 API** → `DialogRoot` `:open` + `@update:open` 而不是 `v-model:open`
4. **Vue Router 4 嵌套路由** → AppShell 内 `<router-view />` 渲染 children；Layout 是父路由 component
5. **Vue Query 的 `useXxxList(queryKey)` 模式** → `useTenantUsersListUsers(tenantId)` 接收 computed ref（不是 string）；调用时 `userList.data.value?.data?.items`
6. **`vue-sonner` 的 `toast.success/error` 是函数调用**（不是 React 版 hooks API）
7. **post-write hook 报警 `bg-gradient-to-br` → `bg-linear-to-br`** → Tailwind v4 推荐新名字，全文替换

## 不在本次范围

- function-tree 全部「规划」翻成「已上线」（独立 tree-change 提案）
- `crud-dialog.vue` 的 `crud.cancel` / `crud.submit` 改标准 fnId
- `backend-switcher.vue` 挂错 `M03.F01.I01` 修正
- 路由路径 `/admin/apps` → `/apps` 对齐 React
- `package.json` 加 `msw:init` 脚本（防 mockServiceWorker.js 再丢）
- `npm run dev` 手动验证（用户验收）

## 验收

- L0 typecheck: 0 错
- L1 ESLint: 0 错
- L3 vitest: 7 文件 66 行全绿
- L4 gate: 全绿
- L5 软告警: ≤ 改写前
- 手动 UI 验证（用户验收）：
  - `/login` 渲染居中卡片登录页
  - 登录后跳转 `/tenants`，左侧深色 sidebar + 顶部面包屑 + 右侧内容
  - 切换 4 个 sidebar group
  - 9 个 page 链接切换正常，fnId 锚点保留
  - 登出按钮 (`M03.F03.I05`) 工作
  - 后端切换器 3 模式切换正常
