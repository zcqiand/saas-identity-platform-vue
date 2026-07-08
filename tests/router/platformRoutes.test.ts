import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { staticRoutes } from '../../src/router'
import { useAuthStore } from '../../src/stores/auth'

// 平台路由结构（对齐 React router.tsx）：
// - 所有 /platform/* 由 PlatformLayout 父路由包裹
// - /platform/tenants/:tenantId 子路由存在（platform-tenant-detail）
// - /platform 重定向到 /platform/config
// - 深层未知路径重定向到 /acme/dashboard
// - 通配符兜底排在 /:tenantId 之后（保证单段路径优先匹配租户）
//
// 仅校验路由匹配结构（matched/name/redirect），不渲染组件——组件渲染由
// PlatformLayout.test.ts 与各视图测试覆盖。
describe('platform 路由嵌套（对齐 React）', () => {
  let router: Router

  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.permissions = ['platform:read'] as never

    router = createRouter({
      history: createMemoryHistory(),
      routes: staticRoutes,
    })
  })

  it('四个平台子路由均被 PlatformLayout 父路由包裹', async () => {
    for (const path of ['/platform/config', '/platform/tenants', '/platform/apps', '/platform/open-platform']) {
      await router.push(path)
      await router.isReady()
      const matched = router.currentRoute.value.matched
      // 父路由 path 为 /platform（PlatformLayout），其下挂子路由
      expect(matched[0].path).toBe('/platform')
      expect(matched.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('/platform/tenants/acme 匹配 platform-tenant-detail 子路由', async () => {
    await router.push('/platform/tenants/acme')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('platform-tenant-detail')
    expect(router.currentRoute.value.params.tenantId).toBe('acme')
    expect(router.currentRoute.value.matched[0].path).toBe('/platform')
  })

  it('/platform 重定向到 /platform/config', async () => {
    await router.push('/platform')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/platform/config')
    expect(router.currentRoute.value.name).toBe('platform-config')
  })

  it('深层未知路径 /x/y/z 重定向到 /acme/dashboard', async () => {
    await router.push('/x/y/z')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/acme/dashboard')
  })

  it('通配符兜底排在 /:tenantId 之后（单段路径优先匹配租户）', async () => {
    await router.push('/foobar/dashboard')
    await router.isReady()
    // /:tenantId 作为父路由匹配（matched[0].path === '/:tenantId'），而非通配符直接重定向
    expect(router.currentRoute.value.matched[0].path).toBe('/:tenantId')
  })

  it('平台子路由 name 对齐 React', async () => {
    await router.push('/platform/config')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('platform-config')
    await router.push('/platform/tenants')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('platform-tenants')
    await router.push('/platform/apps')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('platform-apps')
    await router.push('/platform/open-platform')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('platform-open-platform')
  })
})
