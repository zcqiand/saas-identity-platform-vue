# saas-identity-platform-vue — 仓库工作约定（供 Claude Code）

本仓为《Vue从入门到项目实践》案例二（SaaS 多租户统一身份管理）的可运行配套工程，是书稿代码块的 **source of truth**。与 React 姊妹仓 `saas-identity-platform` 共享 API 契约 + MSW mock fixtures。

## 项目定位

SaaS 多租户统一身份管理的 Vue 可运行案例仓，配套 ch39-42，MSW mock 全覆盖（含 OAuth2 授权服务器模拟），无 Key/Docker/网络依赖。双栈对照：hooks→composables、zustand→pinia、context→provide/inject。

## 铁律

- **TDD**：每个模块先写失败测试 → 跑确认失败 → 实现 → 跑确认绿 → commit。
- **版本钉死**：依赖与 `version-lock.json` 的 `version_lock` 一致；不引入 lock 外的库。
- **tag 即放行**：全量回归绿后打 `v<MAJOR>.<MINOR>-<NNN>`（NNN=项目号）。
- **只增不改（React 对齐召回除外）**：常规扩充不动现有模块签名/行为。**例外**：为与 React 姊妹仓 1:1 对齐的召回重制（重排菜单分组/顺序、重构路由结构、装配布局、新增对齐视图）允许修改既有菜单/路由/布局/视图；但 **API 契约与 `mocks/handlers.ts` 仍只增不改**（这是与 React 仓共享的契约，改动会破坏双栈一致性）。任何既有改动后，全量回归（旧测试 + 新测试）必须全绿。
- **mock-friendly**：`npm install && npm test` 必须在无 Key、无 Docker、无网下全绿。

## 技术栈与版本（钉死于 version-lock.json）

- Vue 3.5.x（Composition API + `<script setup>` 独占）
- TypeScript 5.6.x（strict）
- Vite 6.x
- Vue Router 4.x
- Pinia 2.x（setup store 风格）
- Tailwind CSS 4.x
- Vitest 2.x
- MSW 2.x
- axios 1.7.x
- Node 20 LTS，npm

## 验收

```bash
npm install      # 离线可用（首次需联网，之后 node_modules 已就绪）
npm test         # 必须全绿，无需 Key/Docker/网络
npm run build    # vue-tsc --noEmit && vite build，无错
```

## 目录结构

```text
src/
├── api/client.ts         # axios 实例 + 拦截器
├── app/errorHandler.ts   # 全局错误捕获
├── components/           # 通用组件（OrgTreeNode 等）
├── composables/          # 复用逻辑（useSso / useOAuth / usePermission / useTheme / useTable / useVirtualList / useResource）
├── directives/           # 自定义指令（v-permission）
├── router/               # 路由表（index.ts + dynamicRoutes.ts）
├── stores/               # Pinia store（tenant / auth / user）
├── types/                # TS 类型（tenant / user / rbac）
└── views/                # 业务页面
mocks/                    # MSW mock 层（与 React 姊妹仓共享契约）
├── handlers.ts           # MSW handler 注册表（只增不改）
├── jwt.ts                # mock JWT 签发/校验
├── db.ts                 # mock 内存数据库
├── browser.ts            # 浏览器端 MSW worker
└── server.ts             # Node 端 server 实例
tests/
├── setup.ts              # vitest 全局 setup（MSW lifecycle）
└── *.spec.ts             # 与 src/ 一一对应的测试
deploy/
├── nginx.conf            # SPA fallback + /api/ /sso/ 反向代理
└── DELIVERY-CHECKLIST.md # 上线自检清单
```

## 编码约定

- 所有业务类型放在 `src/types/`
- 所有 HTTP 客户端封装在 `src/api/`
- 复用逻辑放在 `src/composables/`
- MSW handler 注册表在 `mocks/handlers.ts`
- JWT 在 mock 层签发/校验，非生产凭证
- `src/types/*` 字段名与类型与 React 姊妹仓一致，API 契约不变
