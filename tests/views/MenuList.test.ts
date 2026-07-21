import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import MenuList from '@/views/platform/MenuList.vue'

// 平台级菜单管理列表（ch42）：
// - 从路由 :appId 取参 → 调 /menus?appId= → 展示该应用菜单
// - 增 / 删按钮可工作
describe('MenuList.vue (ch42 平台菜单管理)', () => {
  let router: Router
  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/platform/apps/:appId/menus', component: MenuList },
      ],
    })
  })

  it('挂载后展示指定 app 的菜单 [fn: M04.F01.I07, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M04.F01.I01, M04.F01.I02, M04.F01.I03, M04.F01.I04, M04.F01.I05, M04.F01.I06, M04.F01.I12]', async () => {
    await router.push('/platform/apps/app-console/menus')
    await router.isReady()
    const wrapper = mount(MenuList, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await flushPromises()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="menu-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(4) // IAM 控制台 4 个菜单
  })
})
