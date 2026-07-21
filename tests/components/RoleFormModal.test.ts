import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RoleFormModal from '../../src/components/RoleFormModal.vue'

// 角色表单弹窗（对齐 React rbac/RoleFormModal.tsx）。
// 组件用 Teleport to body，故查询走 document.body（vue-test-utils 的 wrapper.text() 不含 teleport 内容）。
describe('RoleFormModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountModal(props: Record<string, unknown>) {
    return mount(RoleFormModal, {
      props: { visible: true, mode: 'create', ...props },
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  }

  function byTestId(id: string) {
    return document.body.querySelector(`[data-testid="${id}"]`) as HTMLInputElement | null
  }

  it('visible=false 时不渲染 [fn: M03.F01.I06]', async () => {
    mountModal({ visible: false })
    await flushPromises()
    expect(byTestId('role-form')).toBeNull()
  })

  it('create 模式标题为「新建角色」且表单为空 [fn: M03.F01.I06]', async () => {
    mountModal({ mode: 'create' })
    await flushPromises()
    expect(document.body.textContent ?? '').toContain('新建角色')
    const nameInput = byTestId('role-name-input')
    expect(nameInput?.value).toBe('')
  })

  it('edit 模式预填 name 与 permissions [fn: M03.F01.I06]', async () => {
    mountModal({
      mode: 'edit',
      role: { id: 'r1', name: 'manager', permissions: ['user:read', 'org:read'] },
    })
    await flushPromises()
    const nameInput = byTestId('role-name-input')
    expect(nameInput?.value).toBe('manager')
    const permCheckbox = byTestId('perm-user:read')
    expect(permCheckbox?.checked).toBe(true)
  })

  it('空名提交时报错且不 emit submit [fn: M03.F01.I06]', async () => {
    const wrapper = mountModal({ mode: 'create' })
    await flushPromises()
    byTestId('role-submit')?.click()
    await flushPromises()
    expect(document.body.textContent ?? '').toContain('请输入角色名称')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('未选权限提交时报错且不 emit submit [fn: M03.F01.I06]', async () => {
    const wrapper = mountModal({ mode: 'create' })
    await flushPromises()
    const nameInput = byTestId('role-name-input')
    nameInput!.value = 'tester'
    nameInput!.dispatchEvent(new Event('input'))
    await flushPromises()
    byTestId('role-submit')?.click()
    await flushPromises()
    expect(document.body.textContent ?? '').toContain('请至少选择一个权限')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('合法提交 emit submit 携带 name/permissions/menuPermissions [fn: M03.F01.I06]', async () => {
    const wrapper = mountModal({ mode: 'create' })
    await flushPromises()
    const nameInput = byTestId('role-name-input')
    nameInput!.value = 'tester'
    nameInput!.dispatchEvent(new Event('input'))
    const perm = byTestId('perm-user:read')
    perm!.click()
    await flushPromises()
    byTestId('role-submit')?.click()
    await flushPromises()
    const evt = wrapper.emitted('submit')
    expect(evt).toBeTruthy()
    const values = evt![0][0] as { name: string; permissions: string[]; menuPermissions: unknown[] }
    expect(values.name).toBe('tester')
    expect(values.permissions).toContain('user:read')
    expect(Array.isArray(values.menuPermissions)).toBe(true)
  })

  it('取消按钮 emit cancel [fn: M03.F01.I06]', async () => {
    const wrapper = mountModal({ mode: 'create' })
    await flushPromises()
    byTestId('role-cancel')?.click()
    await flushPromises()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
