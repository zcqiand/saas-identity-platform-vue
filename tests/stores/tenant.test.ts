import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTenantStore } from '../../src/stores/tenant'

describe('tenant store (ch39)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('init resolves tenant by id from URL segment', async () => {
    const store = useTenantStore()
    await store.initFromLocation('acme')
    expect(store.current?.id).toBe('acme')
    expect(store.current?.name).toBe('ACME 集团')
    expect(store.current?.theme.primary).toBe('#2563eb')
    expect(store.error).toBeNull()
  })

  it('init sets error when tenant not found', async () => {
    const store = useTenantStore()
    await store.initFromLocation('no-such-tenant')
    expect(store.current).toBeNull()
    expect(store.error).toContain('不存在')
  })

  it('switchTenant resets current and re-resolves', async () => {
    const store = useTenantStore()
    await store.initFromLocation('acme')
    expect(store.current?.id).toBe('acme')
    // 切到 globex
    await store.switchTenant('globex')
    expect(store.current?.id).toBe('globex')
    expect(store.current?.theme.primary).toBe('#059669')
  })

  it('resolveTenantIdFromPath extracts first path segment', () => {
    const store = useTenantStore()
    expect(store.resolveTenantIdFromPath('/acme/dashboard')).toBe('acme')
    expect(store.resolveTenantIdFromPath('/globex/users')).toBe('globex')
    expect(store.resolveTenantIdFromPath('/')).toBe('')
  })

  it('subscribedFeatures exposes current tenant feature list', async () => {
    const store = useTenantStore()
    await store.initFromLocation('acme')
    expect(store.subscribedFeatures).toEqual(['sso', 'audit', 'rbac'])
  })
})
