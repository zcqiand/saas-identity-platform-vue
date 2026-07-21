import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../src/stores/auth'

describe('auth store (ch40)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loginWithSso writes token + user + currentOrgId [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    expect(store.token).toBeTruthy()
    expect(store.user?.username).toBe('admin@acme')
    expect(store.currentOrgId).toBe('org-acme')
    expect(store.status).toBe('authenticated')
  })

  it('loginWithSso sets error on bad code [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('bad-code')
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.status).toBe('error')
    expect(store.error).toBeTruthy()
  })

  it('refreshPermissions fetches permissions scoped to orgId and stores them [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    await store.refreshPermissions()
    expect(store.permissions.length).toBeGreaterThan(0)
    expect(store.permissions).toContain('user:read')
    expect(store.roles.length).toBeGreaterThan(0)
  })

  it('switchOrg updates currentOrgId and refreshes permissions (linked to tenant store) [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    await store.switchOrg('org-globex')
    expect(store.currentOrgId).toBe('org-globex')
    // globex 是 viewer 权限集
    expect(store.permissions).toContain('user:read')
    expect(store.permissions).not.toContain('user:delete')
  })

  it('logout clears all state and token [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    store.logout()
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.permissions).toEqual([])
    expect(store.status).toBe('idle')
  })
})
