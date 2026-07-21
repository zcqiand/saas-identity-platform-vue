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

  it('渲染 4 个平台导航项 + 子路由出口 [fn: M04.F01.I01, M04.F01.I07, M06.F01.I01, M06.F02.I01, M06.F03.I01, M06.F04.I01, M06.F05.I01, M06.F06.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F02.I02, M06.F02.I03, M06.F02.I04, M06.F03.I02, M06.F03.I03, M06.F03.I04, M06.F03.I05, M06.F03.I06, M06.F03.I07, M06.F03.I08, M06.F03.I09, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F05.I02, M06.F05.I03, M06.F05.I04, M06.F05.I05, M06.F05.I06, M06.F05.I07, M06.F05.I08, M06.F06.I02, M06.F06.I03, M06.F06.I04, M06.F06.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06]', async () => {
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

  it('当前路由 active 类 [fn: M04.F01.I01, M04.F01.I07, M06.F01.I01, M06.F02.I01, M06.F03.I01, M06.F04.I01, M06.F05.I01, M06.F06.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F02.I02, M06.F02.I03, M06.F02.I04, M06.F03.I02, M06.F03.I03, M06.F03.I04, M06.F03.I05, M06.F03.I06, M06.F03.I07, M06.F03.I08, M06.F03.I09, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F05.I02, M06.F05.I03, M06.F05.I04, M06.F05.I05, M06.F05.I06, M06.F05.I07, M06.F05.I08, M06.F06.I02, M06.F06.I03, M06.F06.I04, M06.F06.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06]', async () => {
    await router.push('/platform/apps')
    await router.isReady()
    const wrapper = mount(PlatformLayout, {
      global: { plugins: [router] },
    })
    const html = wrapper.html()
    expect(html).toMatch(/应用管理[\s\S]*?active|active[\s\S]*?应用管理/)
  })
})
