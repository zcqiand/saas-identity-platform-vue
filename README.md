# saas-identity-platform-vue

《Vue从入门到项目实践》**案例二**配套可运行工程 —— SaaS 多租户统一身份管理系统。

本仓是 React 双栈对照仓 [`saas-identity-platform`](../saas-identity-platform) 的 Vue 姊妹仓：**同一业务域、共享 API 契约 + MSW mock fixtures**，两书可逐章对照阅读。

## 技术栈（版本钉死）

| 维度 | 版本 |
|------|------|
| Vue | 3.5.x（Composition API + `<script setup>`） |
| TypeScript | 5.6.x（strict） |
| Vite | 6.x |
| Vue Router | 4.x（createRouter + 动态 addRoute + 多层 beforeEach） |
| Pinia | 2.x（setup-store 风格） |
| Tailwind CSS | 4.x |
| Vitest + @vue/test-utils + jsdom | 测试栈 |
| MSW | 2.x（全部 API mock，含 SSO/OAuth 授权服务器） |
| axios | HTTP（请求拦截器注入 X-Tenant-ID + Authorization） |
| Node | 20 LTS（实际兼容 ≥ 20.19） |

## 快速开始

```bash
npm install          # 安装依赖
npm test             # 跑全部单元测试（MSW mock 后端，无网络/Key/Docker）
npm run build        # vue-tsc 类型检查 + vite 构建 dist/
npm run dev          # 启动 dev server（自动启用 MSW 浏览器 worker）
```

## mock-friendly 声明

本仓 **不依赖真实后端、不依赖任何 Key、不依赖 Docker、不依赖网络、不依赖真实 IdP**。

- 所有 HTTP 请求（`/api/*`、`/sso/*`）由 [MSW](https://mswjs.io/) 在 `mocks/handlers.ts` 拦截，返回 `mocks/db.ts` 的内存数据。
- SSO / OAuth2 授权服务器（`/sso/authorize` → 回调换 token）完全由 MSW 模拟，**无真实 IdP**。
- JWT 由 `mocks/jwt.ts` 用固定 secret 签发（`saas-mock-secret-not-for-production`），仅 mock 层使用。
- 测试环境：`tests/setup.ts` 在 Node 侧启动 MSW `server`，`onUnhandledRequest: 'error'` 保证任何漏网请求立即报错。
- 开发环境：`src/main.ts` 仅在 `import.meta.env.DEV` 且 `VITE_OFFLINE !== '0'` 时启动浏览器 worker；生产构建中整段被静态消除。

→ 因此 `npm test` 在 CI / 离线机器上 **零配置全绿**。

## 章节映射表

| 章节 | 主题 | 关键模块 / 文件 |
|------|------|----------------|
| 第 39 章 | SaaS 多租户 | `src/stores/tenant.ts`（init/switch/resolveTenantIdFromPath + subscribedFeatures）<br>`src/router/dynamicRoutes.ts`（setupDynamicRoutes/teardownDynamicRoutes 按 feature addRoute）<br>`src/router/index.ts`（createAppRouter + beforeEach 租户解析守卫）<br>`src/api/client.ts`（axios 拦截器注入 X-Tenant-ID）<br>`src/composables/useTheme.ts`（applyTheme/clearTheme + provide/inject） |
| 第 40 章 | 统一认证 + RBAC | `src/composables/useSso.ts`（buildSsoRedirectUrl/handleSsoCallback/generateState）<br>`src/composables/useOAuth.ts`（buildOAuthAuthorizeUrl/handleOAuthCallback，5 providers）<br>`src/stores/auth.ts`（loginWithSso/refreshPermissions/switchOrg/logout）<br>`src/directives/permission.ts`（v-permission 移除无权限元素）<br>`src/composables/usePermission.ts`（hasPermission/hasRole 等脚本侧判定）<br>`src/router/index.ts` 第二层 beforeEach（requiresPermission/requiresRole → /403）<br>`src/types/rbac.ts`（Role/MenuPermission/RolePermissionMatrix） |
| 第 41 章 | 用户管理 + 审计 | `src/components/OrgTreeNode.vue`（递归自引用组织树组件）<br>`src/views/user/UserList.vue`（useTable 分页/搜索 + 角色分配）<br>`src/views/audit/AuditLog.vue`（shallowRef + useVirtualList 虚拟滚动 + action 过滤）<br>`src/composables/useVirtualList.ts`（定高虚拟窗口）<br>`src/composables/useTable.ts`（通用分页/搜索/防抖）<br>`src/stores/user.ts`（orgTree + users + assignRoles） |
| 第 42 章 | 部署上线 | `src/main.ts`（installErrorHandler 全局捕获 + MSW dev 启动 + import.meta.env）<br>`src/app/errorHandler.ts`（app.config.errorHandler + reportError stub 到 /api/vitals）<br>`deploy/nginx.conf`（root→dist + try_files history 回退 + /api、/sso 反代 + 静态缓存）<br>`vite.config.ts`（server.proxy dev 跨域 + define __APP_VERSION__）<br>`deploy/DELIVERY-CHECKLIST.md`（上线自检清单） |
| 共享契约 | 双栈对齐 | `src/types/{tenant,user,rbac}.ts`（与 React 仓字段一致）<br>`src/api/client.ts`（同 baseURL + 拦截器约定）<br>`mocks/{db,handlers,jwt,browser,server}.ts`（同路由 + 同响应 shape + 同 fake JWT） |

## 共享 API 契约（与 React 仓）

| 路由 | 方法 | 用途 |
|------|------|------|
| `/tenants/:id` `/tenants` | GET/POST/PUT/DELETE | 租户配置 / 平台租户管理 |
| `/sso/authorize` | GET | SSO 授权服务器（mock 302 回调） |
| `/auth/oauth/callback` | POST | code 换 token（mock IdP） |
| `/auth/permissions` `/auth/me` | GET | 当前用户权限集 / 当前用户 |
| `/users` `/users/:id` | GET/POST/PUT/DELETE | 用户 CRUD |
| `/orgs` | GET | 组织树 |
| `/audit-logs` | GET | 审计日志分页 |
| `/roles` | GET/POST/PUT/DELETE | 角色管理 |
| `/api/vitals` `/vitals` | POST | 错误/web-vitals 上报 |

## 目录结构

```
saas-identity-platform-vue/
├── src/
│   ├── api/client.ts              # axios 实例 + 拦截器
│   ├── app/errorHandler.ts        # ch42 全局错误捕获
│   ├── components/OrgTreeNode.vue  # ch41 递归组织树
│   ├── composables/               # useSso/useOAuth/usePermission/useTheme/useTable/useVirtualList
│   ├── directives/permission.ts   # v-permission
│   ├── router/                    # index.ts + dynamicRoutes.ts
│   ├── stores/                    # tenant/auth/user (setup-store)
│   ├── types/                     # tenant/user/rbac
│   ├── views/                     # user/UserList.vue + audit/AuditLog.vue
│   ├── App.vue
│   └── main.ts
├── mocks/                         # MSW handlers/db/jwt/browser/server
├── deploy/                        # nginx.conf + DELIVERY-CHECKLIST.md
├── tests/                         # 单元测试（按 ch39-42 分目录）
├── .env.example
├── vite.config.ts / vitest.config.ts / tsconfig.json
└── package.json
```

## 许可与归属

教学示例工程，依赖均为开源许可（MIT/Apache-2.0/BSD）。SSO/OAuth client_id 与 JWT secret 均为 mock 占位，**非真实凭证**。
