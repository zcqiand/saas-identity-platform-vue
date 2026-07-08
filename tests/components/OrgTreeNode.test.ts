import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrgTreeNode from '../../src/components/OrgTreeNode.vue'
import type { OrgNode } from '../../src/types/user'

describe('OrgTreeNode.vue (ch41 recursive)', () => {
  const tree: OrgNode = {
    id: 'org-root',
    name: 'ACME 集团',
    children: [
      {
        id: 'org-acme',
        name: 'ACME 总部',
        children: [{ id: 'org-tech', name: '技术部' }],
      },
      { id: 'org-globex', name: 'Globex 分部' },
    ],
  }

  it('renders root node name', () => {
    const wrapper = mount(OrgTreeNode, {
      props: { node: tree, depth: 0 },
    })
    expect(wrapper.text()).toContain('ACME 集团')
  })

  it('recursively renders children at greater depth', () => {
    const wrapper = mount(OrgTreeNode, {
      props: { node: tree, depth: 0 },
    })
    expect(wrapper.text()).toContain('ACME 总部')
    expect(wrapper.text()).toContain('技术部')
    expect(wrapper.text()).toContain('Globex 分部')
  })

  it('uses :key=node.id via rendered data-org-node attributes for each node', () => {
    const wrapper = mount(OrgTreeNode, {
      props: { node: tree, depth: 0 },
    })
    const nodes = wrapper.findAll('[data-org-node]')
    const ids = nodes.map((n) => n.attributes('data-org-node'))
    expect(ids).toContain('org-root')
    expect(ids).toContain('org-acme')
    expect(ids).toContain('org-tech')
    expect(ids).toContain('org-globex')
  })

  it('emits select event with node when clicked', async () => {
    const wrapper = mount(OrgTreeNode, {
      props: { node: tree, depth: 0 },
    })
    // 点击根节点 label
    const rootLabel = wrapper.find('[data-org-node="org-root"] [data-testid="node-label"]')
    await rootLabel.trigger('click')
    const selectEvents = wrapper.emitted('select')
    expect(selectEvents).toBeTruthy()
    expect(selectEvents![0][0]).toEqual(tree)
  })

  it('renders leaf node without expand icon', () => {
    const leaf: OrgNode = { id: 'org-leaf', name: '叶子节点' }
    const wrapper = mount(OrgTreeNode, {
      props: { node: leaf, depth: 0 },
    })
    expect(wrapper.find('[data-testid="expand-icon"]').exists()).toBe(false)
  })
})
