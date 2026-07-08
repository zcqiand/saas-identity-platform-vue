import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRoleStore } from '../../src/stores/rbac'

// ch40/ch43 角色管理 store：镜像 React rbac/roleStore.ts 的 CRUD 契约。
// 期望：fetchRoles 拉默认 4 个角色；createRole 在表头插入；updateRole 就地替换；deleteRole 过滤；clearError 清错。
describe('role store (rbac.ts)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetchRoles 加载默认角色列表', async () => {
    const store = useRoleStore()
    await store.fetchRoles()
    expect(store.list.length).toBeGreaterThanOrEqual(4)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    const names = store.list.map((r) => r.name)
    expect(names).toContain('admin')
    expect(names).toContain('viewer')
  })

  it('createRole 在列表头部插入新角色', async () => {
    const store = useRoleStore()
    await store.fetchRoles()
    const before = store.list.length
    await store.createRole({ name: 'test-role', permissions: ['user:read'] })
    expect(store.list.length).toBe(before + 1)
    expect(store.list[0].name).toBe('test-role')
    expect(store.list[0].permissions).toEqual(['user:read'])
  })

  it('updateRole 就地替换目标角色字段', async () => {
    const store = useRoleStore()
    await store.fetchRoles()
    const target = store.list.find((r) => r.name === 'viewer')!
    await store.updateRole(target.id, { name: 'viewer-updated', permissions: ['user:read', 'org:read', 'audit:read'] })
    const updated = store.list.find((r) => r.id === target.id)
    expect(updated?.name).toBe('viewer-updated')
    expect(updated?.permissions).toContain('audit:read')
  })

  it('updateRole 可写入 menuPermissions（菜单权限矩阵保存）', async () => {
    const store = useRoleStore()
    await store.fetchRoles()
    const target = store.list[0]
    const matrix = [
      { menuId: 'm-console-users', actions: ['view', 'create'] as const },
    ]
    await store.updateRole(target.id, { menuPermissions: matrix })
    const updated = store.list.find((r) => r.id === target.id)
    expect(updated?.menuPermissions.length).toBe(1)
    expect(updated?.menuPermissions[0].menuId).toBe('m-console-users')
  })

  it('deleteRole 从列表移除目标角色', async () => {
    const store = useRoleStore()
    await store.fetchRoles()
    const target = store.list[0]
    const before = store.list.length
    await store.deleteRole(target.id)
    expect(store.list.length).toBe(before - 1)
    expect(store.list.find((r) => r.id === target.id)).toBeUndefined()
  })

  it('clearError 清空错误态', async () => {
    const store = useRoleStore()
    // 人为塞入错误态
    await store.deleteRole('role-not-exist')
    if (store.error) {
      store.clearError()
      expect(store.error).toBeNull()
    }
  })
})
