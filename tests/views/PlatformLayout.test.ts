import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import PlatformLayout from '@/views/platform/PlatformLayout.vue'

// 平台布局：顶部平台侧边栏（平台管理 / 租户管理 / 应用管理 / 开放平台 / 平台配置）+ 内容区 + 嵌套 RouterView
describe('PlatformLayout.vue (ch42 平台运营)', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/platform', component: PlatformLayout,
          children: [
            { path: 'tenants', component: { template: '<div class="tenants">TENANTS</div>' } },
            { path: 'apps', component: { template: '<div class="apps">APPS</div>' } },
          ],
        },
      ],
    })
  })

  it('渲染 4 个平台导航项 + 子路由出口', async () => {
    await router.push('/platform/tenants')
    await router.isReady()
    const wrapper = mount(PlatformLayout, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('租户管理')
    expect(wrapper.text()).toContain('应用管理')
    expect(wrapper.text()).toContain('开放平台')
    expect(wrapper.text()).toContain('平台配置')
    expect(wrapper.html()).toContain('TENANTS')
  })

  it('当前路由 active 类', async () => {
    await router.push('/platform/apps')
    await router.isReady()
    const wrapper = mount(PlatformLayout, {
      global: { plugins: [router] },
    })
    const html = wrapper.html()
    expect(html).toMatch(/应用管理[\s\S]*?active|active[\s\S]*?应用管理/)
  })
})
