import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDepartmentStore } from '../../src/stores/department'

// 部门树 store（对齐 React departmentStore.ts — 原 orgStore，v0.3.0 改名）：
// - fetchDepartmentTree 拉 GET /departments 单根树
// - createDepartmentNode(name, parentId) POST 后刷新树
// - updateDepartmentNode(id, name) PUT 后刷新树
// - deleteDepartmentNode(id) DELETE 后刷新树（根节点不可删）
// MSW handler 在 tests/setup.ts 全局启用，无需手动 mock。
describe('useDepartmentStore — 部门树 CRUD（对齐 React departmentStore）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态：tree=null, loading=false, error=null [fn: M02.F01.I01, M02.F01.I07]', () => {
    const store = useDepartmentStore()
    expect(store.tree).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchDepartmentTree 拉取部门树（根 department-root） [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    expect(store.tree).not.toBeNull()
    expect(store.tree?.id).toBe('department-root')
    expect(store.tree?.name).toBe('ACME 集团')
    expect(store.tree?.children?.length).toBeGreaterThanOrEqual(2)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('createDepartmentNode 在指定父节点下新增子节点并刷新树 [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    const before = store.tree?.children?.find((c) => c.id === 'department-acme')?.children?.length ?? 0
    await store.createDepartmentNode('新事业部', 'department-acme')
    const parent = store.tree?.children?.find((c) => c.id === 'department-acme')
    const after = parent?.children?.length ?? 0
    expect(after).toBe(before + 1)
    expect(parent?.children?.some((c) => c.name === '新事业部')).toBe(true)
  })

  it('createDepartmentNode 不给 parentId 时默认挂到 department-root [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    const before = store.tree?.children?.length ?? 0
    await store.createDepartmentNode('新分部', 'department-root')
    const after = store.tree?.children?.length ?? 0
    expect(after).toBe(before + 1)
    expect(store.tree?.children?.some((c) => c.name === '新分部')).toBe(true)
  })

  it('updateDepartmentNode 更新节点名称并刷新树 [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    await store.updateDepartmentNode('department-tech', '技术研发部')
    const node = store.tree?.children?.find((c) => c.id === 'department-acme')
      ?.children?.find((c) => c.id === 'department-tech')
    expect(node?.name).toBe('技术研发部')
  })

  it('deleteDepartmentNode 删除非根节点并刷新树 [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    const before = store.tree?.children?.find((c) => c.id === 'department-acme')?.children?.length ?? 0
    await store.deleteDepartmentNode('department-sales')
    const parent = store.tree?.children?.find((c) => c.id === 'department-acme')
    const after = parent?.children?.length ?? 0
    expect(after).toBe(before - 1)
    expect(parent?.children?.some((c) => c.id === 'department-sales')).toBe(false)
  })

  it('deleteDepartmentNode 对根节点失败并设置 error（mock 返回 400） [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    await store.deleteDepartmentNode('department-root')
    expect(store.error).toBeTruthy()
    // 树仍存在
    expect(store.tree).not.toBeNull()
  })

  it('clearError 清空错误 [fn: M02.F01.I01, M02.F01.I07]', async () => {
    const store = useDepartmentStore()
    await store.fetchDepartmentTree()
    await store.deleteDepartmentNode('department-root')
    expect(store.error).toBeTruthy()
    store.clearError()
    expect(store.error).toBeNull()
  })
})
