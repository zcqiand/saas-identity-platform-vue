import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RolesList from '../../src/views/roles/RolesList.vue'

// 角色管理列表（对齐 React rbac/RoleList.tsx）。
// 列表行在组件内（wrapper.find 可查）；RoleFormModal/ConfirmModal 经 Teleport 到 body，走 document.body 查询。
describe('RolesList.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountList() {
    return mount(RolesList, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  }

  function byTestId(id: string) {
    return document.body.querySelector(`[data-testid="${id}"]`) as HTMLInputElement | null
  }

  it('挂载后展示默认角色列表 [fn: M03.F01.I01, M03.F01.I02, M03.F01.I03, M03.F01.I04, M03.F01.I05, M03.F01.I06, M03.F01.I07, M03.F01.I08, M03.F01.I09, M03.F01.I10]', async () => {
    const wrapper = mountList()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="role-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(4)
    expect(wrapper.text()).toContain('admin')
  })

  it('点「新建角色」显示表单弹窗 [fn: M03.F01.I01, M03.F01.I02, M03.F01.I03, M03.F01.I04, M03.F01.I05, M03.F01.I06, M03.F01.I07, M03.F01.I08, M03.F01.I09, M03.F01.I10]', async () => {
    const wrapper = mountList()
    await flushPromises()
    expect(byTestId('role-form')).toBeNull()
    await wrapper.find('[data-testid="btn-create-role"]').trigger('click')
    await flushPromises()
    expect(byTestId('role-form')).not.toBeNull()
  })

  it('新建表单提交后列表新增一行 [fn: M03.F01.I01, M03.F01.I02, M03.F01.I03, M03.F01.I04, M03.F01.I05, M03.F01.I06, M03.F01.I07, M03.F01.I08, M03.F01.I09, M03.F01.I10]', async () => {
    const wrapper = mountList()
    await flushPromises()
    const before = wrapper.findAll('[data-testid="role-row"]').length
    await wrapper.find('[data-testid="btn-create-role"]').trigger('click')
    await flushPromises()
    const nameInput = byTestId('role-name-input')!
    nameInput.value = 'QA'
    nameInput.dispatchEvent(new Event('input'))
    const perm = byTestId('perm-user:read')!
    perm.click()
    await flushPromises()
    byTestId('role-submit')?.click()
    await flushPromises()
    await flushPromises()
    const after = wrapper.findAll('[data-testid="role-row"]').length
    expect(after).toBe(before + 1)
    expect(wrapper.text()).toContain('QA')
  })

  it('行内「编辑」打开预填表单 [fn: M03.F01.I01, M03.F01.I02, M03.F01.I03, M03.F01.I04, M03.F01.I05, M03.F01.I06, M03.F01.I07, M03.F01.I08, M03.F01.I09, M03.F01.I10]', async () => {
    const wrapper = mountList()
    await flushPromises()
    await wrapper.find('[data-testid="btn-edit-role"]').trigger('click')
    await flushPromises()
    expect(byTestId('role-form')).not.toBeNull()
    const nameInput = byTestId('role-name-input')!
    expect(nameInput.value).not.toBe('')
  })

  it('行内「删除」打开确认弹窗，确认后该行消失 [fn: M03.F01.I01, M03.F01.I02, M03.F01.I03, M03.F01.I04, M03.F01.I05, M03.F01.I06, M03.F01.I07, M03.F01.I08, M03.F01.I09, M03.F01.I10]', async () => {
    const wrapper = mountList()
    await flushPromises()
    const before = wrapper.findAll('[data-testid="role-row"]').length
    await wrapper.find('[data-testid="btn-delete-role"]').trigger('click')
    await flushPromises()
    expect(byTestId('confirm-modal')).not.toBeNull()
    byTestId('confirm-ok')?.click()
    await flushPromises()
    await flushPromises()
    const after = wrapper.findAll('[data-testid="role-row"]').length
    expect(after).toBe(before - 1)
  })
})
