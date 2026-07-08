import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import TenantLayout from '@/views/tenant/TenantLayout.vue'

// 租户布局（ch39）：从路由 :tenantId 取参 → 调 /tenants/:id → 应用主题 → 渲染 AppSidebar + RouterView
// 状态：loading / error / 空 / 正常
describe('TenantLayout.vue (ch39 多租户架构)', () => {
  let router: Router

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/:tenantId', component: TenantLayout,
          children: [
            { path: 'dashboard', component: { template: '<div class="dash">DASH</div>' } },
          ],
        },
      ],
    })
  })

  it('正常拉取：渲染侧边栏 + 子路由出口（dashboard）', async () => {
    await router.push('/acme/dashboard')
    await router.isReady()
    const wrapper = mount(TenantLayout, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await flushPromises()
    await flushPromises()
    expect(wrapper.html()).toContain('DASH')
    expect(wrapper.find('[data-testid="tenant-layout"]').exists()).toBe(true)
  })

  it('空 tenantId：渲染空状态', async () => {
    await router.push('/dashboard')
    await router.isReady()
    const wrapper = mount(TenantLayout, {
      global: { plugins: [router] },
    })
    await flushPromises()
    // 无 tenantId 不应渲染业务内容
    expect(wrapper.find('[data-testid="tenant-layout"]').exists()).toBe(false)
  })
})
