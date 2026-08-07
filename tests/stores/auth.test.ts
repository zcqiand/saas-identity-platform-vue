import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../src/stores/auth'

describe('auth store (ch40, v0.3.0 rename)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loginWithSso writes token + user + currentDepartmentId [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    expect(store.token).toBeTruthy()
    expect(store.user?.username).toBe('admin@acme')
    expect(store.currentDepartmentId).toBe('department-acme')
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

  it('refreshPermissions fetches permissions scoped to departmentId and stores them [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    await store.refreshPermissions()
    expect(store.permissions.length).toBeGreaterThan(0)
    expect(store.permissions).toContain('user:read')
    expect(store.roles.length).toBeGreaterThan(0)
  })

  it('switchDepartment updates currentDepartmentId and refreshes permissions [fn: M01.F03.I01]', async () => {
    const store = useAuthStore()
    await store.loginWithSso('mock-auth-code-1')
    await store.switchDepartment('department-globex')
    expect(store.currentDepartmentId).toBe('department-globex')
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
