// 登录入口页（对齐 React pages/Login.tsx + M01.F04.I04）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '../../src/views/auth/Login.vue'

// redirectToSso 会跳 window.location.href，jsdom 没真路由，mock 掉。
vi.mock('../../src/composables/useSso', () => ({
  redirectToSso: vi.fn(),
  generateState: vi.fn(() => 'mock-state'),
}))

describe('Login.vue (对齐 React)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染「登录」标题与 SSO 按钮 [fn: M01.F04.I04, M01.F04.I01, M01.F04.I02, M01.F04.I03, M01.F04.I05]', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/login', component: Login }] })
    const wrapper = mount(Login, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('登录')
    const ssoBtn = wrapper.find('[data-fn="M01.F04.I04"]')
    expect(ssoBtn.exists()).toBe(true)
  })

  it('点 SSO 按钮调 redirectToSso [fn: M01.F04.I04, M01.F04.I01, M01.F04.I02, M01.F04.I03, M01.F04.I05]', async () => {
    const { redirectToSso } = await import('../../src/composables/useSso')
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/login', component: Login }] })
    const wrapper = mount(Login, { global: { plugins: [router] } })
    await flushPromises()
    const buttons = wrapper.findAll('button')
    // 第一个按钮是 SSO 登录
    await buttons[0].trigger('click')
    expect(redirectToSso).toHaveBeenCalled()
  })
})
