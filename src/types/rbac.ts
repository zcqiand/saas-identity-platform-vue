// ch40 RBAC 类型定义
// 镜像 React saas-identity-platform/src/features/rbac/types.ts 的 6 个类型（Permission / PermissionState /
// RoleCreateInput / RoleState / RoleActions / RoleStore）——这是 Vue/React 双栈仓的共享契约。
// 额外新增 RolePermissionMatrix / DEFAULT_ROLE_PERMISSION_MATRIX（Vue 侧，服务 ch40 角色-权限矩阵教学），
// 不属于 React 共享契约。

/** 权限码：资源:操作 */
export interface Permission {
  resource: string
  action: string
  /** 可选：限定组织/范围 */
  scope?: string
}

/** 菜单权限项 */
export interface MenuPermission {
  menuId: string
  actions: ('view' | 'create' | 'update' | 'delete')[]
}

/** 角色 */
export interface Role {
  id: string
  name: string
  permissions: string[]
  /** 菜单权限列表 */
  menuPermissions: MenuPermission[]
}

/** 权限 store 状态 */
export interface PermissionState {
  roles: Role[]
  /** 当前用户权限码列表（如 ['user:read', 'user:create']） */
  permissions: string[]
  loading: boolean
  error: string | null
}

/** 角色创建输入 */
export interface RoleCreateInput {
  name: string
  permissions: string[]
  menuPermissions?: MenuPermission[]
}

/** 角色 store 状态（ch43 新增） */
export interface RoleState {
  list: Role[]
  loading: boolean
  error: string | null
}

/** 角色 store actions */
export interface RoleActions {
  fetchRoles: () => Promise<void>
  createRole: (input: RoleCreateInput) => Promise<void>
  updateRole: (id: string, input: Partial<RoleCreateInput>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  clearError: () => void
}

export type RoleStore = RoleState & RoleActions

/** 所有可选权限码（ch43） */
export const ALL_PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'org:read',
  'org:write',
  'audit:read',
] as const

// ────────────────────────────────────────────────────────────────────────────
// Vue 侧新增（非 React 共享契约）——服务 ch40 角色-权限矩阵教学
// ────────────────────────────────────────────────────────────────────────────

/** 角色→权限矩阵（name → permissions）。Vue 侧教学类型，不在 React 契约内。 */
export type RolePermissionMatrix = Record<string, string[]>

/** 角色→权限默认矩阵（用于初始化/兜底）。Vue 侧教学常量，不在 React 契约内。 */
export const DEFAULT_ROLE_PERMISSION_MATRIX: RolePermissionMatrix = {
  admin: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write', 'audit:read'],
  owner: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write', 'audit:read'],
  manager: ['user:read', 'user:create', 'user:update', 'org:read', 'org:write'],
  auditor: ['user:read', 'org:read', 'audit:read'],
  operator: ['user:read', 'user:update', 'org:read'],
  member: ['user:read', 'org:read'],
  viewer: ['user:read', 'org:read'],
}
