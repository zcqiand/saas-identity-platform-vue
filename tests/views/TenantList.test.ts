import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import TenantList from '../../src/views/tenant/TenantList.vue'

// 平台租户列表（对齐 React TenantList.tsx）：
// 列表行有「详情配置」按钮 → 跳 /platform/tenants/:id
describe('TenantList.vue 详情链接（对齐 React）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('每行有详情配置按钮，点击跳 platform-tenant-detail [fn: M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I09, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I10, M01.F01.I11]', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/platform/tenants', name: 'platform-tenants', component: { template: '<div />' } },
        {
          path: '/platform/tenants/:tenantId',
          name: 'platform-tenant-detail',
          component: { template: '<div />' },
        },
      ],
    })
    // 直接 mount TenantList（提供 router 上下文），onMounted 触发 fetchTenants
    const wrapper = mount(TenantList, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const detailBtns = wrapper.findAll('[data-testid="btn-tenant-detail"]')
    expect(detailBtns.length).toBeGreaterThan(0)
    await detailBtns[0].trigger('click')
    await flushPromises()
    // 跳到了详情路由（带某个租户 id 参数）
    expect(router.currentRoute.value.name).toBe('platform-tenant-detail')
    expect(router.currentRoute.value.params.tenantId).toBeTruthy()
  })
})
