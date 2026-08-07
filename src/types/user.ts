// ch41 用户/部门/审计类型定义（与 React 双栈仓字段一致）
// v0.3.0 重命名：orgId → departmentId；OrgNode → DepartmentNode（共享 zod source-of-truth）

export type { User } from '@saas/identity-platform-shared/schemas'
export type { DepartmentNode } from '@saas/identity-platform-shared/schemas'

/**
 * 用户角色枚举（Vue 仓本地保留别名，给 store/template 旧 import 用）
 * v0.3.0 不再重新定义 — 共享层 zod 已定义 RoleCodeEnum。
 * 这里只导出 Vue 自家 audit 字段 + 审计相关 local type。
 */

/** 用户角色 */
export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'

/** 用户状态 */
export type UserStatus = 'active' | 'disabled' | 'pending'

/** 审计操作类型 */
export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'permission_change'

/** 审计日志 */
export interface AuditLog {
  id: string
  action: AuditAction
  operator: string
  resource: string
  resourceId: string
  ip: string
  detail: string
  timestamp: string
}

/** 分页查询基础 */
interface PageQuery {
  page: number
  pageSize: number
}

/** 用户查询参数 */
export interface UserQuery extends PageQuery {
  keyword?: string
  role?: UserRole
  status?: UserStatus
  /** v0.3.0 改名（原 orgId）：指向 Department.id */
  departmentId?: string
}

/** 用户新建载荷 */
export interface UserCreateInput {
  username: string
  displayName: string
  email: string
  /** v0.3.0 改名（原 orgId）：指向 Department.id */
  departmentId: string
  /** v0.3.0 起 shared User 必填 tenantId */
  tenantId?: string
  roles: UserRole[]
  status?: UserStatus
}

/** 用户更新载荷 */
export interface UserUpdateInput {
  displayName?: string
  email?: string
  /** v0.3.0 改名（原 orgId）：指向 Department.id */
  departmentId?: string
  roles?: UserRole[]
  status?: UserStatus
}

/** 审计日志查询参数 */
export interface AuditQuery extends PageQuery {
  action?: AuditAction
  operator?: string
  ip?: string
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
