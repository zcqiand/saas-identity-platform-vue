import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermission } from '../../src/composables/usePermission'
import { useAuthStore } from '../../src/stores/auth'

describe('usePermission composable (ch40)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hasPermission returns true when action matches [fn: M03.F01.I09]', () => {
    const store = useAuthStore()
    store.permissions = ['user:read', 'user:create']
    const { hasPermission } = usePermission()
    expect(hasPermission('user:read')).toBe(true)
    expect(hasPermission('user:create')).toBe(true)
  })

  it('hasPermission returns false when action missing [fn: M03.F01.I09]', () => {
    const store = useAuthStore()
    store.permissions = ['user:read']
    const { hasPermission } = usePermission()
    expect(hasPermission('user:delete')).toBe(false)
  })

  it('hasAnyPermission returns true if any code matches [fn: M03.F01.I09]', () => {
    const store = useAuthStore()
    store.permissions = ['user:read']
    const { hasAnyPermission } = usePermission()
    expect(hasAnyPermission(['user:delete', 'user:read'])).toBe(true)
    expect(hasAnyPermission(['user:delete', 'user:create'])).toBe(false)
  })

  it('hasRole returns true when role name present [fn: M03.F01.I09]', () => {
    const store = useAuthStore()
    store.roles = [{ id: 'r1', name: 'admin', permissions: [], menuPermissions: [] }]
    const { hasRole } = usePermission()
    expect(hasRole('admin')).toBe(true)
    expect(hasRole('viewer')).toBe(false)
  })
})
