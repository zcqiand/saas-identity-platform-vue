// 组织架构扩展类型：岗位 / 用户组 / 权限组（与 React 姊妹仓 src/types/{position,userGroup}.ts 对齐）
// 共享契约：字段名/类型/枚举与 React 仓一致。

// —— 岗位 ——
export interface Position {
  id: string
  name: string
  code: string
  description?: string
  sort: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface PositionMember {
  id: string
  positionId: string
  userId: string
  userName: string
  displayName: string
  joinedAt: string
}

export interface PositionCreateInput {
  name: string
  code: string
  description?: string
  sort?: number
  enabled?: boolean
}

export type PositionUpdateInput = Partial<PositionCreateInput>

// —— 用户组 ——
export interface UserGroup {
  id: string
  name: string
  description?: string
  memberCount: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface UserGroupCreateInput {
  name: string
  description?: string
  enabled?: boolean
}

export type UserGroupUpdateInput = Partial<UserGroupCreateInput>

// —— 权限组（与 React 姊妹仓 src/types/security.ts 中的 PermissionGroup 对齐）——
export interface PermissionGroup {
  id: string
  name: string
  code: string
  description?: string
  /** 包含的权限码列表 */
  permissions: string[]
  /** 关联菜单 ID 列表 */
  menuIds: string[]
  sort: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface PermissionGroupCreateInput {
  name: string
  code: string
  description?: string
  permissions?: string[]
  menuIds?: string[]
  sort?: number
  enabled?: boolean
}

export type PermissionGroupUpdateInput = Partial<PermissionGroupCreateInput>
