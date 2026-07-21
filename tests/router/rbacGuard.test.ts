import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createAppRouter } from '../../src/router/index'
import { useAuthStore } from '../../src/stores/auth'

describe('router RBAC guard (ch40)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects to login when route requires permission but user not authenticated [fn: M03.F01.I09]', async () => {
    const router = createAppRouter()
    router.addRoute({
      path: '/:tenantId/secret',
      name: 'secret',
      component: { template: '<div>secret</div>' },
      meta: { requiresPermission: 'user:delete' },
    })
    const redirect = await router.resolve({ name: 'secret', params: { tenantId: 'acme' } })
    // 守卫在导航时执行；这里直接 push 并观测最终 location
    try {
      await router.push({ name: 'secret', params: { tenantId: 'acme' } })
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 0))
    // 未登录应被重定向（到 login 或 forbidden）
    expect(['login', 'forbidden']).toContain(router.currentRoute.value.name)
    expect(redirect).toBeDefined()
  })

  it('allows access when user has required permission [fn: M03.F01.I09]', async () => {
    const router = createAppRouter()
    router.addRoute({
      path: '/:tenantId/users',
      name: 'admin-users',
      component: { template: '<div>users</div>' },
      meta: { requiresPermission: 'user:read' },
    })
    const auth = useAuthStore()
    auth.permissions = ['user:read']
    // 模拟登录态：直接写 token
    auth.token = 'fake-token'
    await router.push({ name: 'admin-users', params: { tenantId: 'acme' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(router.currentRoute.value.name).toBe('admin-users')
  })

  it('redirects to 403 when authenticated but missing permission [fn: M03.F01.I09]', async () => {
    const router = createAppRouter()
    router.addRoute({
      path: '/:tenantId/dangerous',
      name: 'dangerous',
      component: { template: '<div>dangerous</div>' },
      meta: { requiresPermission: 'user:delete' },
    })
    const auth = useAuthStore()
    auth.token = 'fake-token'
    auth.permissions = ['user:read']
    await router.push({ name: 'dangerous', params: { tenantId: 'acme' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('allows route with requiredRole when user has matching role name [fn: M03.F01.I09]', async () => {
    const router = createAppRouter()
    router.addRoute({
      path: '/:tenantId/admin-panel',
      name: 'admin-panel',
      component: { template: '<div>admin</div>' },
      meta: { requiresRole: 'admin' },
    })
    const auth = useAuthStore()
    auth.token = 'fake-token'
    auth.roles = [{ id: 'r1', name: 'admin', permissions: [], menuPermissions: [] }]
    await router.push({ name: 'admin-panel', params: { tenantId: 'acme' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(router.currentRoute.value.name).toBe('admin-panel')
  })
})
