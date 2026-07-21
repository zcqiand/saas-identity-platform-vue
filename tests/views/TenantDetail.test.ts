import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import TenantDetail from '../../src/views/tenant/TenantDetail.vue'
import { useTenantStore } from '../../src/stores/tenant'

// 租户详情配置页（对齐 React TenantDetail.tsx）：
// - 挂载触发 fetchTenant(tenantId)
// - 三段标题渲染（基本信息/主题配置/功能与套餐）
// - 保存调 updateTenant，payload 含 name/theme/config
// - 返回按钮跳 /platform/tenants
function mountAt(_tenantId: string): { wrapper: VueWrapper; router: Router } {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/platform/tenants', name: 'platform-tenants', component: { template: '<div />' } },
      { path: '/platform/tenants/:tenantId', name: 'platform-tenant-detail', component: TenantDetail },
    ],
  })
  const wrapper = mount({ template: '<div><router-view /></div>' }, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
  return { wrapper, router }
}

describe('TenantDetail.vue (对齐 React)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载触发 fetchTenant，三段标题渲染 [fn: M01.F01.I04, M01.F01.I06, M01.F01.I07, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I05, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { router } = mountAt('acme')
    await router.push('/platform/tenants/acme')
    await router.isReady()
    await flushPromises()
    await flushPromises()
    const store = useTenantStore()
    expect(store.current?.id).toBe('acme')
    const text = document.body.textContent ?? ''
    expect(text).toContain('基本信息')
    expect(text).toContain('主题配置')
    expect(text).toContain('功能与套餐')
  })

  it('点保存调用 updateTenant 且 payload 含 name/theme/config [fn: M01.F01.I04, M01.F01.I06, M01.F01.I07, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I05, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { wrapper, router } = mountAt('acme')
    await router.push('/platform/tenants/acme')
    await router.isReady()
    await flushPromises()
    await flushPromises()
    // 确认数据已加载、保存按钮已渲染
    const store = useTenantStore()
    expect(store.current?.id).toBe('acme')

    const spy = vi.spyOn(store, 'updateTenant').mockResolvedValue(undefined)

    const saveBtn = wrapper.find('button.bg-blue-600')
    expect(saveBtn.exists()).toBe(true)
    await saveBtn.trigger('click')
    await flushPromises()
    await flushPromises()

    expect(spy).toHaveBeenCalledTimes(1)
    const payload = spy.mock.calls[0][1] as {
      name: string
      theme: { primary: string; sidebar: string; logoText: string }
      config: { features: string[]; maxUsers: number }
    }
    expect(payload.name).toBe('ACME 集团')
    expect(payload.theme).toBeDefined()
    expect(payload.theme.primary).toMatch(/^#/)
    expect(payload.config).toBeDefined()
    expect(payload.config).toHaveProperty('features')
    expect(payload.config).toHaveProperty('maxUsers')
    expect(wrapper.text()).toContain('保存成功')
  })

  it('点返回跳 /platform/tenants [fn: M01.F01.I04, M01.F01.I06, M01.F01.I07, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I05, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { wrapper, router } = mountAt('acme')
    await router.push('/platform/tenants/acme')
    await router.isReady()
    await flushPromises()
    await flushPromises()
    // header 里的返回按钮（class 含 text-gray-500）
    const backBtn = wrapper.find('button.text-gray-500')
    expect(backBtn.exists()).toBe(true)
    await backBtn.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/platform/tenants')
  })
})
