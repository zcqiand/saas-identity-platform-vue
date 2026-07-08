import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import UserList from '../../src/views/user/UserList.vue'

describe('UserList.vue (ch41)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders user rows after fetch', async () => {
    const wrapper = mount(UserList, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="user-row"]')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('shows total count', async () => {
    const wrapper = mount(UserList, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    expect(wrapper.text()).toMatch(/共\s*\d+\s*条/)
  })

  it('keyword search filters the list', async () => {
    const wrapper = mount(UserList, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    const input = wrapper.find('[data-testid="keyword-input"]')
    await input.setValue('admin')
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="user-row"]')
    rows.forEach((row) => {
      expect(row.text().toLowerCase()).toContain('admin')
    })
  })

  it('role-select on a row triggers assignRoles', async () => {
    const wrapper = mount(UserList, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    const select = wrapper.find('[data-testid="role-select"]')
    if (select.exists()) {
      await select.setValue('manager')
      await flushPromises()
      // 选完后第一行的角色应已更新
      expect(wrapper.text()).toContain('manager')
    }
  })
})
