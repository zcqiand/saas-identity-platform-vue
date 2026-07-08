// ch39/ch40 路由器：createRouter + beforeEach 多层守卫
import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router'
import { useTenantStore } from '../stores/tenant'
import { useAuthStore } from '../stores/auth'
import { setupDynamicRoutes, teardownDynamicRoutes } from './dynamicRoutes'

export const staticRoutes: RouteRecordRaw[] = [
  { path: '/', redirect: '/acme/dashboard' },
  { path: '/login', name: 'login', component: { template: '<div class="p-4">登录页</div>' } },
  { path: '/403', name: 'forbidden', component: { template: '<div class="p-4 text-red-600">无权限</div>' } },

  // 平台管理（无租户上下文）：PlatformLayout 作父路由，子页面经 RouterView 渲染
  {
    path: '/platform',
    component: () => import('../views/platform/PlatformLayout.vue'),
    children: [
      { path: '', redirect: '/platform/config' },
      { path: 'config', name: 'platform-config', component: () => import('../views/platform/PlatformConfigForm.vue') },
      { path: 'tenants', name: 'platform-tenants', component: () => import('../views/tenant/TenantList.vue') },
      { path: 'tenants/:tenantId', name: 'platform-tenant-detail', component: () => import('../views/tenant/TenantDetail.vue') },
      { path: 'apps', name: 'platform-apps', component: () => import('../views/platform/AppList.vue') },
      { path: 'apps/:appId/menus', name: 'platform-app-menus', component: () => import('../views/platform/MenuList.vue') },
      { path: 'open-platform', name: 'platform-open-platform', component: () => import('../views/platform/OpenPlatformConfigForm.vue') },
    ],
  },

  // 租户布局（/:tenantId 作为父路由，子路由平铺）
  {
    path: '/:tenantId',
    component: () => import('../views/tenant/TenantLayout.vue'),
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'users', name: 'users', component: () => import('../views/user/UserList.vue') },
      { path: 'org', name: 'org', component: () => import('../views/OrgInfo.vue') },
      { path: 'positions', name: 'tenant-positions', component: () => import('../views/positions/PositionsList.vue') },
      { path: 'roles', name: 'roles', component: () => import('../views/roles/RolesList.vue') },
      { path: 'menu-permissions', name: 'menu-permissions', component: () => import('../views/roles/MenuPermissions.vue') },
      { path: 'user-groups', name: 'tenant-user-groups', component: () => import('../views/user-groups/UserGroupsList.vue') },
      { path: 'permission-groups', name: 'tenant-permission-groups', component: () => import('../views/permission-groups/PermissionGroupsList.vue') },
      { path: 'audit', name: 'audit', component: () => import('../views/audit/AuditLog.vue') },
      { path: 'login-methods', name: 'tenant-login-methods', component: () => import('../views/auth/LoginMethodsList.vue') },
      { path: 'token-config', name: 'tenant-token-config', component: () => import('../views/auth/TokenConfigForm.vue') },
      { path: 'api-keys', name: 'tenant-api-keys', component: () => import('../views/auth/ApiKeysList.vue') },
      { path: 'login-security', name: 'tenant-login-security', component: () => import('../views/security/LoginSecurityForm.vue') },
      { path: 'password-policy', name: 'tenant-password-policy', component: () => import('../views/security/PasswordPolicyForm.vue') },
      { path: 'risk-control', name: 'tenant-risk-control', component: () => import('../views/security/RiskControlForm.vue') },
      { path: 'notification-config', name: 'tenant-notification-config', component: () => import('../views/security/NotificationConfigForm.vue') },
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
