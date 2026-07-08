import { describe, it, expect } from 'vitest'
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSION_MATRIX,
  type Permission,
  type PermissionState,
  type RoleCreateInput,
  type RoleState,
  type RoleActions,
  type RoleStore,
  type RolePermissionMatrix,
} from '../../src/types/rbac'

describe('rbac types mirror React sister contract (ch40)', () => {
  it('Permission shape: resource + action + optional scope', () => {
    const p: Permission = { resource: 'user', action: 'read' }
    const p2: Permission = { resource: 'user', action: 'read', scope: 'org:acme' }
    expect(p.resource).toBe('user')
    expect(p2.scope).toBe('org:acme')
  })

  it('PermissionState shape: roles + permissions + loading + error', () => {
    const s: PermissionState = { roles: [], permissions: ['user:read'], loading: false, error: null }
    expect(s.permissions).toEqual(['user:read'])
    expect(s.loading).toBe(false)
  })

  it('RoleCreateInput shape: name + permissions + optional menuPermissions', () => {
    const input: RoleCreateInput = { name: 'admin', permissions: ['user:read'] }
    expect(input.name).toBe('admin')
    expect(input.menuPermissions).toBeUndefined()
  })

  it('RoleState / RoleActions / RoleStore compose', () => {
    const state: RoleState = { list: [], loading: false, error: null }
    const actions: RoleActions = {
      fetchRoles: async () => {},
      createRole: async () => {},
      updateRole: async () => {},
      deleteRole: async () => {},
      clearError: () => {},
    }
    const store: RoleStore = { ...state, ...actions }
    expect(store.list).toEqual([])
    expect(typeof store.fetchRoles).toBe('function')
  })

  it('ALL_PERMISSIONS lists the 7 shared permission codes', () => {
    expect(ALL_PERMISSIONS).toHaveLength(7)
    expect(ALL_PERMISSIONS).toContain('user:read')
    expect(ALL_PERMISSIONS).toContain('audit:read')
  })

  it('Vue-side RolePermissionMatrix / DEFAULT_ROLE_PERMISSION_MATRIX exist for ch40 pedagogy', () => {
    const matrix: RolePermissionMatrix = DEFAULT_ROLE_PERMISSION_MATRIX
    expect(Object.keys(matrix).length).toBeGreaterThan(0)
    expect(matrix.admin).toContain('user:delete')
    expect(matrix.viewer).toEqual(['user:read', 'org:read'])
  })
})
