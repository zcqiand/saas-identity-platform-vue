import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTenantStore } from '../../src/stores/tenant'
import { THEME_VARS } from '../../src/composables/useTheme'

describe('tenant store (ch39)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 清理主题 CSS 变量，确保每个测试起点干净
    const root = document.documentElement
    root.style.removeProperty(THEME_VARS.primary)
    root.style.removeProperty(THEME_VARS.sidebar)
    root.style.removeProperty(THEME_VARS.logoText)
  })

  it('init resolves tenant by id from URL segment [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    await store.initFromLocation('acme')
    expect(store.current?.id).toBe('acme')
    expect(store.current?.name).toBe('ACME 集团')
    expect(store.current?.theme.primary).toBe('#2563eb')
    expect(store.error).toBeNull()
  })

  it('init sets error when tenant not found [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    await store.initFromLocation('no-such-tenant')
    expect(store.current).toBeNull()
    expect(store.error).toContain('不存在')
  })

  it('switchTenant resets current and re-resolves [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    await store.initFromLocation('acme')
    expect(store.current?.id).toBe('acme')
    // 切到 tenant-lab（Phase 5d：shared seeds 只有 acme + tenant-lab，原 demo globex/initech 等 11 个已废弃）
    await store.switchTenant('tenant-lab')
    expect(store.current?.id).toBe('tenant-lab')
  })

  it('resolveTenantIdFromPath extracts first path segment [fn: M01.F01.I10, M01.F01.I11]', () => {
    const store = useTenantStore()
    expect(store.resolveTenantIdFromPath('/acme/dashboard')).toBe('acme')
    expect(store.resolveTenantIdFromPath('/tenant-lab/users')).toBe('tenant-lab')
    expect(store.resolveTenantIdFromPath('/')).toBe('')
  })

  it('subscribedFeatures exposes current tenant feature list [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    await store.initFromLocation('acme')
    expect(store.subscribedFeatures).toEqual(['sso', 'audit', 'rbac'])
  })

  // —— 对齐 React tenantStore.fetchTenant / updateTenant（平台租户详情用）——
  it('fetchTenant 拉取租户写入 current，且不应用主题（平台页不应被租户主题染色） [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    expect(store.fetchTenant).toBeTypeOf('function')
    await store.fetchTenant('acme')
    expect(store.current?.id).toBe('acme')
    expect(store.current?.name).toBe('ACME 集团')
    // 关键：未调用 applyTheme —— CSS 变量不应被写入
    expect(document.documentElement.style.getPropertyValue(THEME_VARS.primary)).toBe('')
    expect(document.documentElement.style.getPropertyValue(THEME_VARS.sidebar)).toBe('')
  })

  it('fetchTenant 租户不存在时设 error 且 current 为空 [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    await store.fetchTenant('no-such-tenant')
    expect(store.current).toBeNull()
    expect(store.error).toContain('不存在')
  })

  it('updateTenant 发起 PUT 并在失败时抛错 [fn: M01.F01.I10, M01.F01.I11]', async () => {
    const store = useTenantStore()
    expect(store.updateTenant).toBeTypeOf('function')
    // 成功路径：PUT /tenants/acme
    await store.updateTenant('acme', {
      name: 'ACME 改名',
      theme: { primary: '#111111', sidebar: '#222222', logoText: 'ACME' },
      config: { features: ['sso'], maxUsers: 200 },
    })
    expect(store.error).toBeNull()
    // 失败路径：不存在的租户 → 抛错且 store.error 有值
    await expect(
      store.updateTenant('no-such-tenant', {
        name: 'x',
        theme: { primary: '#000', sidebar: '#000', logoText: 'x' },
      }),
    ).rejects.toBeDefined()
    expect(store.error).toBeTruthy()
  })
})
