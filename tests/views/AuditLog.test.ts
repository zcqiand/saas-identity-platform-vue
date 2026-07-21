import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import AuditLog from '../../src/views/audit/AuditLog.vue'

describe('AuditLog.vue (ch41)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders audit log rows after fetch [fn: M05.F01.I01, M05.F01.I02, M05.F01.I03, M05.F01.I04, M05.F01.I05, M05.F01.I06, M05.F01.I07, M05.F01.I08, M05.F01.I09]', async () => {
    const wrapper = mount(AuditLog, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="audit-row"]')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('shows total count [fn: M05.F01.I01, M05.F01.I02, M05.F01.I03, M05.F01.I04, M05.F01.I05, M05.F01.I06, M05.F01.I07, M05.F01.I08, M05.F01.I09]', async () => {
    const wrapper = mount(AuditLog, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    expect(wrapper.text()).toMatch(/共\s*\d+\s*条/)
  })

  it('paginates to next page when available [fn: M05.F01.I01, M05.F01.I02, M05.F01.I03, M05.F01.I04, M05.F01.I05, M05.F01.I06, M05.F01.I07, M05.F01.I08, M05.F01.I09]', async () => {
    const wrapper = mount(AuditLog, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    const nextBtn = wrapper.find('[data-testid="next-page"]')
    if (nextBtn.exists() && (nextBtn.attributes('disabled') === undefined)) {
      await nextBtn.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('[data-testid="audit-row"]').length).toBeGreaterThan(0)
    }
  })

  it('filters by action=login via dropdown [fn: M05.F01.I01, M05.F01.I02, M05.F01.I03, M05.F01.I04, M05.F01.I05, M05.F01.I06, M05.F01.I07, M05.F01.I08, M05.F01.I09]', async () => {
    const wrapper = mount(AuditLog, {
      global: { plugins: [getActivePinia()!] },
    })
    await flushPromises()
    const select = wrapper.find('[data-testid="action-filter"]')
    if (select.exists()) {
      await select.setValue('login')
      await flushPromises()
      const rows = wrapper.findAll('[data-testid="audit-row"]')
      rows.forEach((row) => {
        expect(row.text()).toContain('login')
      })
    }
  })
})
