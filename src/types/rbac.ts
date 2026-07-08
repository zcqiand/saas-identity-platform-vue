// ch40 RBAC 类型定义（与 React 双栈仓 src/features/rbac/types.ts 一致）

/** 权限码：资源:操作（字符串形式，如 'user:read'） */

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

/** 角色→权限矩阵（name → permissions） */
export type RolePermissionMatrix = Record<string, string[]>

/** 所有可选权限码 */
export const ALL_PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'org:read',
  'org:write',
  'audit:read',
] as const

/** 角色→权限默认矩阵（用于初始化/兜底） */
export const DEFAULT_ROLE_PERMISSION_MATRIX: RolePermissionMatrix = {
  admin: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write', 'audit:read'],
  owner: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write', 'audit:read'],
  manager: ['user:read', 'user:create', 'user:update', 'org:read', 'org:write'],
  auditor: ['user:read', 'org:read', 'audit:read'],
  operator: ['user:read', 'user:update', 'org:read'],
  member: ['user:read', 'org:read'],
  viewer: ['user:read', 'org:read'],
}
