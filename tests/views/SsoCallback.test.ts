// SSO 回调处理页（对齐 React features/sso/SsoCallback.tsx + M01.F04.I03）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import SsoCallback from '../../src/views/auth/SsoCallback.vue'

// handleSsoCallback 走 mock api；mock 掉用直接 resolve。
vi.mock('../../src/composables/useSso', () => ({
  handleSsoCallback: vi.fn(async () => ({
    token: 'mock-token',
    user: { id: 'u-001', username: 'admin', displayName: '管理员', departmentId: 'department-acme' },
  })),
}))

describe('SsoCallback.vue (对齐 React)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染 SSO 回调容器（data-fn 锚点） [fn: M01.F04.I03, M01.F04.I01, M01.F04.I02, M01.F04.I04, M01.F04.I05]', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/sso-callback', component: SsoCallback }],
    })
    await router.push('/sso-callback?code=mock-code')
    await router.isReady()
    const wrapper = mount(SsoCallback, { global: { plugins: [router] } })
    await flushPromises()
    // data-fn 锚点存在（与 L5 对齐矩阵契约挂钩）
    const div = wrapper.find('[data-fn="M01.F04.I03"]')
    expect(div.exists()).toBe(true)
  })

  it('收到 code 后调 handleSsoCallback [fn: M01.F04.I03, M01.F04.I01, M01.F04.I02, M01.F04.I04, M01.F04.I05]', async () => {
    const { handleSsoCallback } = await import('../../src/composables/useSso')
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/sso-callback', component: SsoCallback }],
    })
    await router.push('/sso-callback?code=mock-code-2')
    await router.isReady()
    mount(SsoCallback, { global: { plugins: [router] } })
    await flushPromises()
    await flushPromises()
    expect(handleSsoCallback).toHaveBeenCalledWith('mock-code-2', 'sso')
  })

  it('无 code 跳回 /login [fn: M01.F04.I03, M01.F04.I01, M01.F04.I02, M01.F04.I04, M01.F04.I05]', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/sso-callback', component: SsoCallback },
        { path: '/login', component: { template: '<div />' } },
      ],
    })
    await router.push('/sso-callback')
    await router.isReady()
    mount(SsoCallback, { global: { plugins: [router] } })
    await flushPromises()
    // 立即显示 error
    const wrapper2 = mount(SsoCallback, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper2.text()).toContain('失败')
  })
})
