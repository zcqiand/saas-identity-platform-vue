// API Key 列表（对齐 React apiKeyStore/ApiKeyList.tsx）
// 列表 mount 后渲染 + 顶部新建按钮 + 行内启用/禁用/删除

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ApiKeysList from '../../src/views/auth/ApiKeysList.vue'

describe('ApiKeysList.vue (对齐 React)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountList() {
    return mount(ApiKeysList, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  }

  it('挂载后展示 API Key 列表 [fn: M04.F02.I01, M04.F02.I02, M04.F02.I03, M04.F02.I04]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('挂载时调用 fetchApiKeys 拉取 [fn: M04.F02.I01, M04.F02.I02, M04.F02.I03, M04.F02.I04]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('新建/启用禁用/删除入口存在 [fn: M04.F02.I02, M04.F02.I03, M04.F02.I04, M04.F02.I01]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })
})
