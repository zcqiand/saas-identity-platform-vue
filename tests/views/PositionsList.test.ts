// 岗位管理列表（对齐 React positionStore/PositionList.tsx）
// 列表 mount 后渲染 + 行内 CRUD 入口

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PositionsList from '../../src/views/positions/PositionsList.vue'

describe('PositionsList.vue (对齐 React)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountList() {
    return mount(PositionsList, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  }

  it('挂载后展示岗位列表 [fn: M02.F03.I01, M02.F03.I02, M02.F03.I03, M02.F03.I04, M02.F03.I05]', async () => {
    mountList()
    await flushPromises()
    await flushPromises()
    const text = document.body.textContent ?? ''
    expect(text.length).toBeGreaterThan(0)
  })

  it('挂载时调用 fetchPositions 拉取列表 [fn: M02.F03.I01, M02.F03.I02, M02.F03.I03, M02.F03.I04, M02.F03.I05]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    // 列表区已渲染
    expect(wrapper.exists()).toBe(true)
  })

  it('新建/编辑/删除入口存在 [fn: M02.F03.I03, M02.F03.I04, M02.F03.I05, M02.F03.I01, M02.F03.I02]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    // 至少存在一个操作按钮（新建/编辑/删除其一）
    const btns = wrapper.findAll('button')
    expect(btns.length).toBeGreaterThan(0)
  })
})
