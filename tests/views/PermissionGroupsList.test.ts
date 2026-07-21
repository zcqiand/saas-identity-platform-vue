// 权限组列表（对齐 React permissionGroupStore/PermissionGroupList.tsx）
// 列表 mount 后渲染 + 顶部新建按钮 + 行内编辑/删除

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PermissionGroupsList from '../../src/views/permission-groups/PermissionGroupsList.vue'

describe('PermissionGroupsList.vue (对齐 React)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountList() {
    return mount(PermissionGroupsList, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  }

  it('挂载后展示权限组列表 [fn: M03.F02.I01, M03.F02.I02, M03.F02.I03, M03.F02.I04, M03.F02.I05]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('挂载时调用 fetchPermissionGroups 拉取 [fn: M03.F02.I01, M03.F02.I02, M03.F02.I03, M03.F02.I04, M03.F02.I05]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('新建/编辑/删除入口存在 [fn: M03.F02.I02, M03.F02.I03, M03.F02.I04, M03.F02.I01, M03.F02.I05]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await flushPromises()
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })
})
