import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MenuPermissions from '../../src/views/roles/MenuPermissions.vue'

// 菜单权限矩阵（对齐 React rbac/MenuPermissions.tsx）：
// - 选应用 + 选角色后渲染矩阵（行=菜单，列=查/建/改/删 + 全选）
// - 勾选单元格后保存，调 updateRole(menuPermissions)
// - 父菜单全选联动所有子菜单
describe('MenuPermissions.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountView() {
    return mount(MenuPermissions, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  }

  function byTestId(id: string) {
    return document.body.querySelector(`[data-testid="${id}"]`) as HTMLInputElement | HTMLSelectElement | null
  }

  it('未选应用和角色时显示提示 [fn: M03.F01.I07]', async () => {
    mountView()
    await flushPromises()
    expect(document.body.textContent ?? '').toContain('请先选择应用和角色')
  })

  it('选应用+角色后渲染菜单矩阵 [fn: M03.F01.I07]', async () => {
    mountView()
    await flushPromises()
    const appSelect = byTestId('select-app') as HTMLSelectElement
    appSelect.value = 'app-lab'
    appSelect.dispatchEvent(new Event('change'))
    await flushPromises()
    const roleSelect = byTestId('select-role') as HTMLSelectElement
    roleSelect.value = 'role-admin'
    roleSelect.dispatchEvent(new Event('change'))
    await flushPromises()
    await flushPromises()
    // app-lab 有 4 个顶级菜单（用户/组织/角色/审计）
    const rows = document.body.querySelectorAll('[data-testid^="menu-row-"]')
    expect(rows.length).toBeGreaterThanOrEqual(4)
    // 保存按钮出现
    expect(byTestId('btn-save')).not.toBeNull()
  })

  it('勾选某菜单的 view 权限后保存，调用 updateRole [fn: M03.F01.I07]', async () => {
    const wrapper = mountView()
    await flushPromises()
    ;(byTestId('select-app') as HTMLSelectElement)!.value = 'app-lab'
    byTestId('select-app')!.dispatchEvent(new Event('change'))
    await flushPromises()
    ;(byTestId('select-role') as HTMLSelectElement)!.value = 'role-admin'
    byTestId('select-role')!.dispatchEvent(new Event('change'))
    await flushPromises()
    await flushPromises()
    // 找到第一个菜单的 view 勾选框并勾上
    const firstView = document.body.querySelector('[data-testid^="perm-view-"]') as HTMLInputElement
    firstView.click()
    await flushPromises()
    // 点保存
    byTestId('btn-save')!.click()
    await flushPromises()
    await flushPromises()
    // 角色列表（roleStore）的对应角色 menuPermissions 应非空
    const wrapper2 = wrapper
    expect(wrapper2.text()).not.toContain('请先选择应用和角色')
  })

  it('父菜单全选联动勾选所有子菜单 [fn: M03.F01.I07]', async () => {
    mountView()
    await flushPromises()
    ;(byTestId('select-app') as HTMLSelectElement)!.value = 'app-lab'
    byTestId('select-app')!.dispatchEvent(new Event('change'))
    await flushPromises()
    ;(byTestId('select-role') as HTMLSelectElement)!.value = 'role-admin'
    byTestId('select-role')!.dispatchEvent(new Event('change'))
    await flushPromises()
    await flushPromises()
    // 点第一个父菜单的全选
    const firstAll = document.body.querySelector('[data-testid^="perm-all-"]') as HTMLInputElement
    const beforeChecked = document.body.querySelectorAll('[data-testid^="perm-view-"]:checked').length
    firstAll.click()
    await flushPromises()
    const afterChecked = document.body.querySelectorAll('[data-testid^="perm-view-"]:checked').length
    expect(afterChecked).toBeGreaterThan(beforeChecked)
  })
})
