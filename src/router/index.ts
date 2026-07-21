// ch39/ch40 路由器：createRouter + beforeEach 多层守卫
import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router'
import { useTenantStore } from '../stores/tenant'
import { useAuthStore } from '../stores/auth'
import { setupDynamicRoutes, teardownDynamicRoutes } from './dynamicRoutes'

// 懒加载路由组件（eager 默认 false，是静态字面量 → vitest 的 import-glob 可解析）。
// dev 下 main.ts 会在 MSW 注册 Service Worker 之前把这些模块全部预加载（进入浏览器缓存），
// 从而绕开 MSW SW 对 /src/* 动态导入的 404 拦截；生产构建不走 MSW，保持按需分块。
export const routeModuleLoaders = import.meta.glob('../views/**/*.vue')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function view(p: string): any {
  return routeModuleLoaders[p]
}

export const staticRoutes: RouteRecordRaw[] = [
  { path: '/', redirect: '/acme/dashboard' },
  { path: '/login', name: 'login', component: view('../views/auth/Login.vue') },
  { path: '/sso-callback', name: 'sso-callback', component: view('../views/auth/SsoCallback.vue') },
  { path: '/403', name: 'forbidden', component: { template: '<div class="p-4 text-red-600">无权限</div>' } },

  // 平台管理（无租户上下文）：PlatformLayout 作父路由，子页面经 RouterView 渲染
  {
    path: '/platform',
    component: view('../views/platform/PlatformLayout.vue'),
    children: [
      { path: '', redirect: '/platform/config' },
      { path: 'config', name: 'platform-config', component: view('../views/platform/PlatformConfigForm.vue') },
      { path: 'tenants', name: 'platform-tenants', component: view('../views/tenant/TenantList.vue') },
      { path: 'tenants/:tenantId', name: 'platform-tenant-detail', component: view('../views/tenant/TenantDetail.vue') },
      { path: 'apps', name: 'platform-apps', component: view('../views/platform/AppList.vue') },
      { path: 'apps/:appId/menus', name: 'platform-app-menus', component: view('../views/platform/MenuList.vue') },
      { path: 'open-platform', name: 'platform-open-platform', component: view('../views/platform/OpenPlatformConfigForm.vue') },
    ],
  },

  // 租户布局（/:tenantId 作为父路由，子路由平铺）
  {
    path: '/:tenantId',
    component: view('../views/tenant/TenantLayout.vue'),
    children: [
      { path: 'dashboard', name: 'dashboard', component: view('../views/Dashboard.vue') },
      { path: 'users', name: 'users', component: view('../views/user/UserList.vue') },
      { path: 'org', name: 'org', component: view('../views/OrgInfo.vue') },
      { path: 'positions', name: 'tenant-positions', component: view('../views/positions/PositionsList.vue') },
      { path: 'roles', name: 'roles', component: view('../views/roles/RolesList.vue') },
      { path: 'menu-permissions', name: 'menu-permissions', component: view('../views/roles/MenuPermissions.vue') },
      { path: 'user-groups', name: 'tenant-user-groups', component: view('../views/user-groups/UserGroupsList.vue') },
      { path: 'permission-groups', name: 'tenant-permission-groups', component: view('../views/permission-groups/PermissionGroupsList.vue') },
      { path: 'audit', name: 'audit', component: view('../views/audit/AuditLog.vue') },
      { path: 'login-methods', name: 'tenant-login-methods', component: view('../views/auth/LoginMethodsList.vue') },
      { path: 'token-config', name: 'tenant-token-config', component: view('../views/auth/TokenConfigForm.vue') },
      { path: 'api-keys', name: 'tenant-api-keys', component: view('../views/auth/ApiKeysList.vue') },
      { path: 'login-security', name: 'tenant-login-security', component: view('../views/security/LoginSecurityForm.vue') },
      { path: 'password-policy', name: 'tenant-password-policy', component: view('../views/security/PasswordPolicyForm.vue') },
      { path: 'risk-control', name: 'tenant-risk-control', component: view('../views/security/RiskControlForm.vue') },
      { path: 'notification-config', name: 'tenant-notification-config', component: view('../views/security/NotificationConfigForm.vue') },
    ],
  },

  // 通配符兜底（必须排在 /:tenantId 之后，保证单段路径优先匹配租户）
  { path: '/:pathMatch(.*)*', redirect: '/acme/dashboard' },
]

export function createAppRouter(): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes: [...staticRoutes],
  })

  // 公共路由放行
  router.beforeEach(async (to) => {
    if (['login', 'forbidden'].includes(String(to.name)) || ['/', '/403'].includes(to.path)) return true
    // /platform/* 放行（平台路由无租户上下文）
    if (to.path.startsWith('/platform')) return true

    const tenantStore = useTenantStore()
    const tenantId = (to.params.tenantId as string) || tenantStore.resolveTenantIdFromPath(to.path)

    if (!tenantId) {
      return { name: 'login' }
    }

    // 租户变化时重新初始化
    if (tenantStore.current?.id !== tenantId) {
      const previous = tenantStore.current
      if (previous) teardownDynamicRoutes(router, previous)
      await tenantStore.initFromLocation(tenantId)
      if (tenantStore.current) setupDynamicRoutes(router, tenantStore.current)
    }

    if (tenantStore.error) return { name: 'login' }
    return true
  })

  // RBAC 守卫
  router.beforeEach((to) => {
    const required = to.meta.requiresPermission as string | string[] | undefined
    if (!required) return true
    const auth = useAuthStore()
    if (!auth.token) return { name: 'login' }
    const ok = Array.isArray(required)
      ? required.some((p) => auth.permissions.includes(p))
      : auth.permissions.includes(required)
    if (!ok) return { name: 'forbidden' }
    return true
  })

  return router
}

export default createAppRouter
