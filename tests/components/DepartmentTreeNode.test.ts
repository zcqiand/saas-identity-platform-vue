import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DepartmentTreeNode from '../../src/components/DepartmentTreeNode.vue'
import type { DepartmentNode } from '../../src/types/user'

describe('DepartmentTreeNode.vue (ch41 recursive, v0.3.0 rename)', () => {
  const tree: DepartmentNode = {
    id: 'department-root',
    name: 'ACME 集团',
    children: [
      {
        id: 'department-acme',
        name: 'ACME 总部',
        children: [{ id: 'department-tech', name: '技术部' }],
      },
      { id: 'department-globex', name: 'Globex 分部' },
    ],
  }

  it('renders root node name [fn: M02.F01.I08]', () => {
    const wrapper = mount(DepartmentTreeNode, {
      props: { node: tree, depth: 0 },
    })
    expect(wrapper.text()).toContain('ACME 集团')
  })

  it('recursively renders children at greater depth [fn: M02.F01.I08]', () => {
    const wrapper = mount(DepartmentTreeNode, {
      props: { node: tree, depth: 0 },
    })
    expect(wrapper.text()).toContain('ACME 总部')
    expect(wrapper.text()).toContain('技术部')
    expect(wrapper.text()).toContain('Globex 分部')
  })

  it('uses :key=node.id via rendered data-department-node attributes for each node [fn: M02.F01.I08]', () => {
    const wrapper = mount(DepartmentTreeNode, {
      props: { node: tree, depth: 0 },
    })
    const nodes = wrapper.findAll('[data-department-node]')
    const ids = nodes.map((n) => n.attributes('data-department-node'))
    expect(ids).toContain('department-root')
    expect(ids).toContain('department-acme')
    expect(ids).toContain('department-tech')
    expect(ids).toContain('department-globex')
  })

  it('emits select event with node when clicked [fn: M02.F01.I08]', async () => {
    const wrapper = mount(DepartmentTreeNode, {
      props: { node: tree, depth: 0 },
    })
    // 点击根节点 label
    const rootLabel = wrapper.find('[data-department-node="department-root"] [data-testid="node-label"]')
    await rootLabel.trigger('click')
    const selectEvents = wrapper.emitted('select')
    expect(selectEvents).toBeTruthy()
    expect(selectEvents![0][0]).toEqual(tree)
  })

  it('renders leaf node without expand icon [fn: M02.F01.I08]', () => {
    const leaf: DepartmentNode = { id: 'department-leaf', name: '叶子节点' }
    const wrapper = mount(DepartmentTreeNode, {
      props: { node: leaf, depth: 0 },
    })
    expect(wrapper.find('[data-testid="expand-icon"]').exists()).toBe(false)
  })
})
