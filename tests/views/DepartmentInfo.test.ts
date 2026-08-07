import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import DepartmentInfo from '../../src/views/DepartmentInfo.vue'
import { useDepartmentStore } from '../../src/stores/department'
import DepartmentNodeFormModal from '../../src/components/DepartmentNodeFormModal.vue'
import ConfirmModal from '../../src/components/ConfirmModal.vue'

// 部门管理页（对齐 React DepartmentTree.tsx + Departments.tsx — 原 OrgInfo.vue，v0.3.0 改名）：
// - 挂载触发 fetchDepartmentTree
// - 树节点递归渲染（根 + 子节点）
// - 选中节点 → 工具栏出现 → 新增/编辑/删除
// - 新增/编辑弹窗提交调 store 方法；删除确认调 store 方法
// MSW 在 setup.ts 全局启用，/departments handler 已注册。
function mountDepartmentInfo() {
  return mount(DepartmentInfo, {
    global: { plugins: [getActivePinia()!] },
    attachTo: document.body,
  })
}

describe('DepartmentInfo.vue — 部门管理真页（对齐 React DepartmentTree）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载触发 fetchDepartmentTree 并渲染部门树 [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const store = useDepartmentStore()
    expect(store.tree?.id).toBe('department-root')
    // 根节点 + 子节点渲染
    const text = wrapper.text()
    expect(text).toContain('ACME 集团')
    expect(text).toContain('ACME 总部')
    expect(text).toContain('技术部')
    expect(text).toContain('Globex 分部')
  })

  it('渲染「新增根部门」按钮 [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-create-root"]').exists()).toBe(true)
  })

  it('初始无选中节点时不显示工具栏；选中节点后显示工具栏 [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('[data-testid="node-toolbar"]').exists()).toBe(false)
    // 点击根节点 label（DepartmentTreeNode 的 select 事件由 label click 触发）
    const rootLabel = wrapper.find('[data-department-node="department-root"] [data-testid="node-label"]')
    await rootLabel.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="node-toolbar"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('ACME 集团')
  })

  it('选中根节点时不显示「删除」按钮（根不可删） [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const rootLabel = wrapper.find('[data-department-node="department-root"] [data-testid="node-label"]')
    await rootLabel.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-add-child"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-delete"]').exists()).toBe(false)
  })

  it('选中非根节点时显示「删除」按钮 [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-department-node="department-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-delete"]').exists()).toBe(true)
  })

  it('点「新增根部门」打开弹窗（mode=create, nodeId=department-root） [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    await wrapper.find('[data-testid="btn-create-root"]').trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(DepartmentNodeFormModal)
    expect(modal.props('visible')).toBe(true)
    expect(modal.props('mode')).toBe('create')
    expect(modal.props('nodeId')).toBe('department-root')
  })

  it('选中节点后点「+ 子部门」打开弹窗（mode=create, nodeId=选中节点） [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-department-node="department-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-add-child"]').trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(DepartmentNodeFormModal)
    expect(modal.props('visible')).toBe(true)
    expect(modal.props('mode')).toBe('create')
    expect(modal.props('nodeId')).toBe('department-tech')
  })

  it('选中节点后点「编辑」打开弹窗（mode=edit, nodeId=选中节点, initialName=节点名） [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-department-node="department-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-edit"]').trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(DepartmentNodeFormModal)
    expect(modal.props('visible')).toBe(true)
    expect(modal.props('mode')).toBe('edit')
    expect(modal.props('nodeId')).toBe('department-tech')
    expect(modal.props('initialName')).toBe('技术部')
  })

  it('弹窗提交 create 调 store.createDepartmentNode(name, parentId) [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    // 选中 department-acme 作为父节点
    const acmeLabel = wrapper.find('[data-department-node="department-acme"] [data-testid="node-label"]')
    await acmeLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-add-child"]').trigger('click')
    await flushPromises()
    const store = useDepartmentStore()
    const spy = vi.spyOn(store, 'createDepartmentNode').mockResolvedValue(undefined)
    // 直接触发组件 emit（绕过输入交互），模拟提交
    wrapper.findComponent(DepartmentNodeFormModal).vm.$emit('submit', '新事业部', 'department-acme')
    await flushPromises()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('新事业部', 'department-acme')
  })

  it('弹窗提交 edit 调 store.updateDepartmentNode(id, name) [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-department-node="department-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-edit"]').trigger('click')
    await flushPromises()
    const store = useDepartmentStore()
    const spy = vi.spyOn(store, 'updateDepartmentNode').mockResolvedValue(undefined)
    wrapper.findComponent(DepartmentNodeFormModal).vm.$emit('submit', '技术研发部', 'department-tech')
    await flushPromises()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('department-tech', '技术研发部')
  })

  it('点「删除」打开确认弹窗；确认调 store.deleteDepartmentNode(id) [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-department-node="department-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-delete"]').trigger('click')
    await flushPromises()
    const confirm = wrapper.findComponent(ConfirmModal)
    expect(confirm.props('visible')).toBe(true)
    expect(confirm.props('message')).toContain('技术部')
    const store = useDepartmentStore()
    const spy = vi.spyOn(store, 'deleteDepartmentNode').mockResolvedValue(undefined)
    confirm.vm.$emit('confirm')
    await flushPromises()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('department-tech')
  })

  it('error 态渲染告警条 [fn: M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I02, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const wrapper = mountDepartmentInfo()
    await flushPromises()
    await flushPromises()
    const store = useDepartmentStore()
    // 触发一个会失败的操作（删根节点 → mock 返回 400）
    await store.deleteDepartmentNode('department-root')
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('[data-testid="department-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('根节点不可删除')
  })
})
