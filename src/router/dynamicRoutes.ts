// ch39 动态路由：按租户订阅的功能模块 addRoute 注册（每个 feature 一条）
import type { Router } from 'vue-router'
import type { TenantConfig } from '../types/tenant'

/** 已知 feature → 路由定义映射（未知 feature 静默跳过） */
const FEATURE_ROUTES: Record<
  string,
  { name: string; buildPath: (tenantId: string) => string }
> = {
  sso: { name: 'tenant-sso', buildPath: (t) => `/${t}/sso` },
  audit: { name: 'tenant-audit', buildPath: (t) => `/${t}/audit` },
  rbac: { name: 'tenant-rbac', buildPath: (t) => `/${t}/rbac` },
}

const PlaceholderComponent = { template: '<div><router-view /></div>' }

/**
 * 根据租户订阅的功能模块，向 router 动态 addRoute 注册路由。
 * 已存在同名路由时跳过（addRoute 自身行为：重名返回 false），保证幂等。
 */
export function setupDynamicRoutes(router: Router, tenant: TenantConfig): void {
  // v0.3.0：features 落到 config.features（共享契约 tenant schema 重构）
  const features = tenant.features
    ?? (tenant as unknown as { config?: { features?: string[] } }).config?.features
    ?? []
  for (const feature of features) {
    const def = FEATURE_ROUTES[feature]
    if (!def) continue
    const path = def.buildPath(tenant.id)
    router.addRoute({
      name: def.name,
      path,
      component: PlaceholderComponent,
      meta: { tenantId: tenant.id, feature },
    })
  }
}

/** 清除某租户注册的动态路由（切换租户时调用） */
export function teardownDynamicRoutes(router: Router, tenant: TenantConfig): void {
  // v0.3.0：features 落到 config.features（共享契约 tenant schema 重构）
  const features = tenant.features
    ?? (tenant as unknown as { config?: { features?: string[] } }).config?.features
    ?? []
  for (const feature of features) {
    const def = FEATURE_ROUTES[feature]
    if (!def) continue
    if (router.hasRoute(def.name)) {
      router.removeRoute(def.name)
    }
  }
}

export { FEATURE_ROUTES }
