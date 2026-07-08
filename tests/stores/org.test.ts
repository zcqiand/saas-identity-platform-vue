import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOrgStore } from '../../src/stores/org'

// 组织树 store（对齐 React orgStore.ts）：
// - fetchOrgTree 拉 GET /orgs 单根树
// - createOrgNode(name, parentId) POST 后刷新树
// - updateOrgNode(id, name) PUT 后刷新树
// - deleteOrgNode(id) DELETE 后刷新树（根节点不可删）
// MSW handler 在 tests/setup.ts 全局启用，无需手动 mock。
describe('useOrgStore — 组织树 CRUD（对齐 React orgStore）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态：tree=null, loading=false, error=null', () => {
    const store = useOrgStore()
    expect(store.tree).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchOrgTree 拉取组织树（根 org-root）', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    expect(store.tree).not.toBeNull()
    expect(store.tree?.id).toBe('org-root')
    expect(store.tree?.name).toBe('ACME 集团')
    expect(store.tree?.children?.length).toBeGreaterThanOrEqual(2)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('createOrgNode 在指定父节点下新增子节点并刷新树', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    const before = store.tree?.children?.find((c) => c.id === 'org-acme')?.children?.length ?? 0
    await store.createOrgNode('新事业部', 'org-acme')
    const parent = store.tree?.children?.find((c) => c.id === 'org-acme')
    const after = parent?.children?.length ?? 0
    expect(after).toBe(before + 1)
    expect(parent?.children?.some((c) => c.name === '新事业部')).toBe(true)
  })

  it('createOrgNode 不给 parentId 时默认挂到 org-root', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    const before = store.tree?.children?.length ?? 0
    await store.createOrgNode('新分部', 'org-root')
    const after = store.tree?.children?.length ?? 0
    expect(after).toBe(before + 1)
    expect(store.tree?.children?.some((c) => c.name === '新分部')).toBe(true)
  })

  it('updateOrgNode 更新节点名称并刷新树', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    await store.updateOrgNode('org-tech', '技术研发部')
    const node = store.tree?.children?.find((c) => c.id === 'org-acme')
      ?.children?.find((c) => c.id === 'org-tech')
    expect(node?.name).toBe('技术研发部')
  })

  it('deleteOrgNode 删除非根节点并刷新树', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    const before = store.tree?.children?.find((c) => c.id === 'org-acme')?.children?.length ?? 0
    await store.deleteOrgNode('org-sales')
    const parent = store.tree?.children?.find((c) => c.id === 'org-acme')
    const after = parent?.children?.length ?? 0
    expect(after).toBe(before - 1)
    expect(parent?.children?.some((c) => c.id === 'org-sales')).toBe(false)
  })

  it('deleteOrgNode 对根节点失败并设置 error（mock 返回 400）', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    await store.deleteOrgNode('org-root')
    expect(store.error).toBeTruthy()
    // 树仍存在
    expect(store.tree).not.toBeNull()
  })

  it('clearError 清空错误', async () => {
    const store = useOrgStore()
    await store.fetchOrgTree()
    await store.deleteOrgNode('org-root')
    expect(store.error).toBeTruthy()
    store.clearError()
    expect(store.error).toBeNull()
  })
})
