import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../../src/stores/user'

describe('user store (ch41)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetchOrgTree loads the org tree', async () => {
    const store = useUserStore()
    await store.fetchOrgTree()
    expect(store.orgTree).not.toBeNull()
    expect(store.orgTree?.id).toBe('org-root')
    expect(store.orgTree?.children?.length).toBeGreaterThan(0)
  })

  it('fetchUsers loads paginated user list', async () => {
    const store = useUserStore()
    await store.fetchUsers({ page: 1, pageSize: 5 })
    expect(store.users.length).toBe(5)
    expect(store.total).toBeGreaterThan(5)
    expect(store.loading).toBe(false)
  })

  it('fetchUsers applies keyword filter', async () => {
    const store = useUserStore()
    await store.fetchUsers({ page: 1, pageSize: 50, keyword: 'admin' })
    expect(store.users.every((u) => u.username.includes('admin') || u.displayName.includes('admin') || u.email.includes('admin'))).toBe(true)
  })

  it('assignRoles updates a user roles', async () => {
    const store = useUserStore()
    await store.fetchUsers({ page: 1, pageSize: 5 })
    const target = store.users[0]
    await store.assignRoles(target.id, ['manager'])
    const updated = store.users.find((u) => u.id === target.id)
    expect(updated?.roles).toEqual(['manager'])
  })

  it('fetchUsers applies orgId filter', async () => {
    const store = useUserStore()
    await store.fetchUsers({ page: 1, pageSize: 50, orgId: 'org-fe' })
    expect(store.users.every((u) => u.orgId === 'org-fe')).toBe(true)
    expect(store.total).toBeGreaterThan(0)
  })
})
