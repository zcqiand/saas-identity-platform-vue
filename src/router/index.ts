// ch39/ch40 路由器：createRouter + beforeEach 多层守卫
import { createRouter, createWebHistory, type Router } from 'vue-router'
import { useTenantStore } from '../stores/tenant'
import { useAuthStore } from '../stores/auth'
import { setupDynamicRoutes, teardownDynamicRoutes } from './dynamicRoutes'

const PlaceholderView = () => Promise.resolve({ template: '<div class="p-4">页面占位</div>' })

/** 静态基础路由（不依赖租户） */
export const staticRoutes = [
  { path: '/', redirect: '/acme/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: { template: '<div class="p-4">登录页</div>' },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: { template: '<div class="p-4 text-red-600">无权限访问 (403)</div>' },
  },
  {
    path: '/:tenantId/dashboard',
    name: 'dashboard',
    component: PlaceholderView,
  },
  {
    path: '/platform/apps',
    name: 'platform-apps',
    component: () => import('../views/platform/AppList.vue'),
  },
  {
    path: '/platform/apps/:appId/menus',
    name: 'platform-app-menus',
    component: () => import('../views/platform/MenuList.vue'),
  },
  {
    path: '/:tenantId/positions',
    name: 'tenant-positions',
    component: () => import('../views/positions/PositionsList.vue'),
  },
  {
    path: '/:tenantId/user-groups',
    name: 'tenant-user-groups',
    component: () => import('../views/user-groups/UserGroupsList.vue'),
  },
  {
    path: '/:tenantId/permission-groups',
    name: 'tenant-permission-groups',
    component: () => import('../views/permission-groups/PermissionGroupsList.vue'),
  },
  {
    path: '/:tenantId/login-methods',
    name: 'tenant-login-methods',
    component: () => import('../views/auth/LoginMethodsList.vue'),
  },
  {
    path: '/:tenantId/token-config',
    name: 'tenant-token-config',
    component: () => import('../views/auth/TokenConfigForm.vue'),
  },
  {
    path: '/:tenantId/api-keys',
    name: 'tenant-api-keys',
    component: () => import('../views/auth/ApiKeysList.vue'),
  },
  {
    path: '/:tenantId/login-security',
    name: 'tenant-login-security',
    component: () => import('../views/security/LoginSecurityForm.vue'),
  },
  {
    path: '/:tenantId/password-policy',
    name: 'tenant-password-policy',
    component: () => import('../views/security/PasswordPolicyForm.vue'),
  },
  {
    path: '/:tenantId/risk-control',
    name: 'tenant-risk-control',
    component: () => import('../views/security/RiskControlForm.vue'),
  },
  {
    path: '/:tenantId/notification-config',
    name: 'tenant-notification-config',
    component: () => import('../views/security/NotificationConfigForm.vue'),
  },
  {
    path: '/platform/open-platform',
    name: 'platform-open-platform',
    component: () => import('../views/platform/OpenPlatformConfigForm.vue'),
  },
] as const

export function createAppRouter(): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes: [...staticRoutes],
  })

  // ch39：beforeEach 守卫 — 解析租户 → init store → 注册动态路由 → 继续
  // ch40：在 tenant 守卫后追加 RBAC 校验（由 useAuthStore + usePermissionStore 完成）
  router.beforeEach(async (to) => {
    // 公共路由放行（无需租户上下文）
    if (to.name === 'login' || to.name === 'forbidden' || to.path === '/' || to.path === '/403') return true

    const tenantStore = useTenantStore()
    const tenantId = (to.params.tenantId as string) || tenantStore.resolveTenantIdFromPath(to.path)

    if (!tenantId) {
      return { name: 'login' }
    }

    // 租户变化时：teardown 旧动态路由 → init 新租户 → setup 新动态路由
    if (tenantStore.current?.id !== tenantId) {
      const previous = tenantStore.current
      if (previous) {
        teardownDynamicRoutes(router, previous)
      }
      await tenantStore.initFromLocation(tenantId)
      if (tenantStore.current) {
        setupDynamicRoutes(router, tenantStore.current)
      }
    }

    if (tenantStore.error) {
      return { name: 'login' }
    }
    return true
  })

  // ch40：RBAC 守卫 — 第二层 beforeEach。
  // 路由 meta 声明 requiresPermission / requiresRole；未通过则重定向到 /403。
  router.beforeEach((to) => {
    const required = to.meta.requiresPermission as string | string[] | undefined
    const requiredRole = to.meta.requiresRole as string | string[] | undefined
    if (!required && !requiredRole) return true

    const auth = useAuthStore()
    if (!auth.token) {
      return { name: 'login' }
    }

    if (required) {
      const ok = Array.isArray(required)
        ? required.some((p) => auth.permissions.includes(p))
        : auth.permissions.includes(required)
      if (!ok) return { name: 'forbidden' }
    }

    if (requiredRole) {
      const ok = Array.isArray(requiredRole)
        ? requiredRole.some((r) => auth.roles.some((role) => role.name === r))
        : auth.roles.some((role) => role.name === requiredRole)
      if (!ok) return { name: 'forbidden' }
    }

    return true
  })

  return router
}

export default createAppRouter
