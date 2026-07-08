import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import OrgInfo from '../../src/views/OrgInfo.vue'
import { useOrgStore } from '../../src/stores/org'
import OrgNodeFormModal from '../../src/components/OrgNodeFormModal.vue'
import ConfirmModal from '../../src/components/ConfirmModal.vue'

// 组织管理页（对齐 React OrgTree.tsx + Orgs.tsx）：
// - 挂载触发 fetchOrgTree
// - 树节点递归渲染（根 + 子节点）
// - 选中节点 → 工具栏出现 → 新增/编辑/删除
// - 新增/编辑弹窗提交调 store 方法；删除确认调 store 方法
// MSW 在 setup.ts 全局启用，/orgs handler 已注册。
function mountOrgInfo() {
  return mount(OrgInfo, {
    global: { plugins: [getActivePinia()!] },
    attachTo: document.body,
  })
}

describe('OrgInfo.vue — 组织管理真页（对齐 React OrgTree）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载触发 fetchOrgTree 并渲染组织树', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const store = useOrgStore()
    expect(store.tree?.id).toBe('org-root')
    // 根节点 + 子节点渲染
    const text = wrapper.text()
    expect(text).toContain('ACME 集团')
    expect(text).toContain('ACME 总部')
    expect(text).toContain('技术部')
    expect(text).toContain('Globex 分部')
  })

  it('渲染「新增根部门」按钮', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-create-root"]').exists()).toBe(true)
  })

  it('初始无选中节点时不显示工具栏；选中节点后显示工具栏', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('[data-testid="node-toolbar"]').exists()).toBe(false)
    // 点击根节点 label（OrgTreeNode 的 select 事件由 label click 触发）
    const rootLabel = wrapper.find('[data-org-node="org-root"] [data-testid="node-label"]')
    await rootLabel.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="node-toolbar"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('ACME 集团')
  })

  it('选中根节点时不显示「删除」按钮（根不可删）', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const rootLabel = wrapper.find('[data-org-node="org-root"] [data-testid="node-label"]')
    await rootLabel.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-add-child"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-delete"]').exists()).toBe(false)
  })

  it('选中非根节点时显示「删除」按钮', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-org-node="org-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-delete"]').exists()).toBe(true)
  })

  it('点「新增根部门」打开弹窗（mode=create, nodeId=org-root）', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    await wrapper.find('[data-testid="btn-create-root"]').trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(OrgNodeFormModal)
    expect(modal.props('visible')).toBe(true)
    expect(modal.props('mode')).toBe('create')
    expect(modal.props('nodeId')).toBe('org-root')
  })

  it('选中节点后点「+ 子部门」打开弹窗（mode=create, nodeId=选中节点）', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-org-node="org-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-add-child"]').trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(OrgNodeFormModal)
    expect(modal.props('visible')).toBe(true)
    expect(modal.props('mode')).toBe('create')
    expect(modal.props('nodeId')).toBe('org-tech')
  })

  it('选中节点后点「编辑」打开弹窗（mode=edit, nodeId=选中节点, initialName=节点名）', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-org-node="org-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-edit"]').trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(OrgNodeFormModal)
    expect(modal.props('visible')).toBe(true)
    expect(modal.props('mode')).toBe('edit')
    expect(modal.props('nodeId')).toBe('org-tech')
    expect(modal.props('initialName')).toBe('技术部')
  })

  it('弹窗提交 create 调 store.createOrgNode(name, parentId)', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    // 选中 org-acme 作为父节点
    const acmeLabel = wrapper.find('[data-org-node="org-acme"] [data-testid="node-label"]')
    await acmeLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-add-child"]').trigger('click')
    await flushPromises()
    const store = useOrgStore()
    const spy = vi.spyOn(store, 'createOrgNode').mockResolvedValue(undefined)
    // 直接触发组件 emit（绕过输入交互），模拟提交
    wrapper.findComponent(OrgNodeFormModal).vm.$emit('submit', '新事业部', 'org-acme')
    await flushPromises()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('新事业部', 'org-acme')
  })

  it('弹窗提交 edit 调 store.updateOrgNode(id, name)', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-org-node="org-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-edit"]').trigger('click')
    await flushPromises()
    const store = useOrgStore()
    const spy = vi.spyOn(store, 'updateOrgNode').mockResolvedValue(undefined)
    wrapper.findComponent(OrgNodeFormModal).vm.$emit('submit', '技术研发部', 'org-tech')
    await flushPromises()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('org-tech', '技术研发部')
  })

  it('点「删除」打开确认弹窗；确认调 store.deleteOrgNode(id)', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const techLabel = wrapper.find('[data-org-node="org-tech"] [data-testid="node-label"]')
    await techLabel.trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="btn-delete"]').trigger('click')
    await flushPromises()
    const confirm = wrapper.findComponent(ConfirmModal)
    expect(confirm.props('visible')).toBe(true)
    expect(confirm.props('message')).toContain('技术部')
    const store = useOrgStore()
    const spy = vi.spyOn(store, 'deleteOrgNode').mockResolvedValue(undefined)
    confirm.vm.$emit('confirm')
    await flushPromises()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('org-tech')
  })

  it('error 态渲染告警条', async () => {
    const wrapper = mountOrgInfo()
    await flushPromises()
    await flushPromises()
    const store = useOrgStore()
    // 触发一个会失败的操作（删根节点 → mock 返回 400）
    await store.deleteOrgNode('org-root')
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('[data-testid="org-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('根节点不可删除')
  })
})
