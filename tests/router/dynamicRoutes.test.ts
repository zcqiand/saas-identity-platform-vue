import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { setupDynamicRoutes } from '../../src/router/dynamicRoutes'

describe('setupDynamicRoutes (ch39)', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>home</div>' } }],
    })
  })

  it('registers a route per subscribed feature with tenant prefix', () => {
    setupDynamicRoutes(router, {
      id: 'acme',
      name: 'ACME',
      theme: { primary: '#000', sidebar: '#000', logoText: 'ACME' },
      features: ['sso', 'audit', 'rbac'],
    })

    const names = router.getRoutes().map((r) => r.name).filter((n) => n !== null && n !== undefined)
    expect(names).toContain('tenant-sso')
    expect(names).toContain('tenant-audit')
    expect(names).toContain('tenant-rbac')
    // 路径带租户前缀
    const paths = router.getRoutes().map((r) => r.path)
    expect(paths).toContain('/acme/sso')
    expect(paths).toContain('/acme/audit')
    expect(paths).toContain('/acme/rbac')
  })

  it('is idempotent: calling twice does not duplicate routes', () => {
    const tenant = {
      id: 'acme',
      name: 'ACME',
      theme: { primary: '#000', sidebar: '#000', logoText: 'ACME' },
      features: ['sso', 'audit'],
    }
    setupDynamicRoutes(router, tenant)
    setupDynamicRoutes(router, tenant)
    const ssoRoutes = router.getRoutes().filter((r) => r.name === 'tenant-sso')
    expect(ssoRoutes.length).toBe(1)
  })

  it('skips unknown features gracefully', () => {
    setupDynamicRoutes(router, {
      id: 'acme',
      name: 'ACME',
      theme: { primary: '#000', sidebar: '#000', logoText: 'ACME' },
      features: ['sso', 'unknown-feature'],
    })
    const names = router.getRoutes().map((r) => r.name)
    expect(names).toContain('tenant-sso')
    expect(names).not.toContain('tenant-unknown-feature')
  })
})
