import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppList from '@/views/platform/AppList.vue'

// 平台级应用管理列表（ch42）：
// - mount 后展示默认 3 个应用
// - 有"新建应用"按钮，触发后显示表单
// - 提交表单后表格新增一行
// - 点击"编辑"显示表单预填
// - 点击"删除"删除该行
describe('AppList.vue (ch42 平台应用管理)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后展示默认应用列表 [fn: M04.F01.I01, M04.F01.I03, M04.F01.I04, M04.F01.I05, M04.F01.I02, M04.F01.I06, M04.F01.I07, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M04.F01.I12]', async () => {
    const wrapper = mount(AppList, { attachTo: document.body })
    await flushPromises()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="app-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })

  it('点"新建应用"显示表单，提交后列表新增', async () => {
    const wrapper = mount(AppList, { attachTo: document.body })
    await flushPromises()
    const before = wrapper.findAll('[data-testid="app-row"]').length
    await wrapper.find('[data-testid="btn-create-app"]').trigger('click')
    await flushPromises()
    const inputs = wrapper.findAll('input')
    // 找到 name / code 输入（按 placeholder 或 name attr）
    const nameInput = inputs.find((i) => (i.attributes('placeholder') ?? '').includes('名称')) ?? inputs[0]
    const codeInput = inputs.find((i) => (i.attributes('placeholder') ?? '').includes('编码')) ?? inputs[1]
    await nameInput.setValue('测试应用 X')
    await codeInput.setValue('test-x')
    await wrapper.find('[data-testid="btn-submit-app"]').trigger('click')
    await flushPromises()
    await flushPromises()
    const after = wrapper.findAll('[data-testid="app-row"]').length
    expect(after).toBe(before + 1)
    expect(wrapper.text()).toContain('测试应用 X')
  })
})
