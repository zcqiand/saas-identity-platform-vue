# SaaS 多租户身份平台

《Vue从入门到项目实践》案例二：SaaS 多租户统一身份管理系统配套可运行工程。

与 React 姊妹仓 `saas-identity-platform` 共享 API 契约 + MSW mock fixtures，可逐字段对照。

## 快速开始

```bash
npm install
npm test        # 全量测试（无 Key/无 Docker/无网可跑）
npm run dev     # 本地开发
npm run build   # 生产构建
```

### Mock 用户

| 用户名 | 密码 | 角色 | 权限 |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | admin | 全部权限 |
| `operator` | `op123` | operator | 受限权限 |

## 功能特性

- **多租户架构**：tenantStore + 动态路由 addRoute，租户切换器 + 独立主题色配置
- **统一认证（SSO/OAuth2）**：MSW 模拟 OAuth 授权服务器，多 Provider 支持
- **RBAC 权限管理**：v-permission 指令 + usePermission composable，角色 CRUD + 权限矩阵
- **用户与组织管理**：递归组织树 OrgTreeNode + 用户 CRUD + 审计日志分页
- **虚拟滚动**：useVirtualList composable，审计日志超 100 项仅渲染可视区域
- **可复用 composables**：useSso / useOAuth / usePermission / useTheme / useTable / useResource
- **部署与监控**：全局错误捕获 + MSW 浏览器 worker + nginx SPA fallback

## 技术栈

| 技术 | 版本 |
| :--- | :--- |
| Vue | 3.5 |
| TypeScript | 5.6 |
| Vite | 6 |
| Tailwind CSS | 4 |
| Vue Router | 4 |
| Pinia | 2 |
| Vitest | 2 |
| MSW | 2 |
| axios | 1.7 |
| Node | 20 LTS |

> 依赖版本与 `version-lock.json` 的 `version_lock` 一致，不引入 lock 外的库。

## 配套书籍及章节映射

| 章 | 主题 | 对应源文件 |
| :--- | :--- | :--- |
| ch39 | SaaS 多租户 | `src/stores/tenant.ts`、`src/router/dynamicRoutes.ts`、`src/api/client.ts`、`src/composables/useTheme.ts` |
| ch40 | 统一认证 + RBAC | `src/composables/useSso.ts`、`src/composables/useOAuth.ts`、`src/stores/auth.ts`、`src/directives/permission.ts`、`src/types/rbac.ts` |
| ch41 | 用户管理 + 审计 | `src/components/OrgTreeNode.vue`、`src/views/user/UserList.vue`、`src/views/audit/AuditLog.vue`、`src/composables/useVirtualList.ts` |
| ch42 | 部署上线 | `src/main.ts`、`src/app/errorHandler.ts`、`deploy/nginx.conf`、`vite.config.ts` |

## 快速链接

- [功能规格文档.md](功能规格文档.md) — 功能名称、描述与验收标准
- [CLAUDE.md](CLAUDE.md) — 开发约定与编码规范
