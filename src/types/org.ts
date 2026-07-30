// 组织架构扩展类型 barrel —— 与 React 姊妹仓 src/types/{position,userGroup}.ts 对齐。
// 共享契约：字段名/类型/枚举与 React 仓一致。
//
// 本文件原合并持有 Position / UserGroup / PermissionGroup 三个领域类型；现已按 REF
// 结构拆为 position.ts / userGroup.ts，本文件改为 re-export 桶，向后兼容旧
// `import { ... } from '@/types/org'` 的 6 处调用方（stores/org.ts 等）。
//
// PermissionGroup（Vue 独有，原 src/types/security.ts 未涵盖）继续保留在本文件，
// 待 React 端 security.ts 拆分后单独落 src/types/permissionGroup.ts。

export type {
  Position,
  PositionMember,
  PositionCreateInput,
  PositionUpdateInput,
} from './position';

export type {
  UserGroup,
  UserGroupMember,
  UserGroupCreateInput,
  UserGroupUpdateInput,
} from './userGroup';

// —— 权限组（Vue 独有，暂未与 React security.ts 对齐）——
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
  id?: string
  name: string
  code: string
  description?: string
  permissions?: string[]
  menuIds?: string[]
  sort?: number
  enabled?: boolean
}

export type PermissionGroupUpdateInput = Partial<PermissionGroupCreateInput>
