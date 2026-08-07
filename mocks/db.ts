// Mock 内存数据库：仅 mock 层使用，测试间隔离由 tests/setup.ts 的 resetMockDb 保证。
//
// Phase 5d：单一真理源自 @saas/identity-platform-shared/seeds（v0.3.0）—— 19 张表
// 默认值由 shared 提供（除 USERS / DEPARTMENTS 本仓特有），CRUD 仍在本文件维护。
//
// v0.3.0 重命名（org → department）：本文件：
//   1. 初始化时把 shared seeds 拷贝到内存可写副本（其余 19 张表）
//   2. 提供与原 saas-vue 一致的函数 export 名字（findTenant/insertTenant/...
//      findUserById/.../findDepartmentNode/.../listApps/.../listPositions/... 等）
//   3. 兼容 shared v0.3.0 的字段重命名：orgId → departmentId / OrgNode → DepartmentNode
//      `findDepartmentNode` 为新 store 用名，`findOrgNode` 保持为旧别名（5b 边界保留）
//
// 显著差异（同 React 5b）：
//   - shared seeds 只有 2 个租户（acme + tenant-lab）和 19 个用户；
//     原 saas-vue 的 12 租户 + 18 用户 demo 数据（acme/globex/initech/...）已废弃，
//     改由 shared seeds 接管 — 删除 11 mock 租户 + 多余用户。
//   - 部门树（嵌套）仍是 Vue 本仓特有：shared v0.3.0 只有 2 个根级部门，
//     不够支撑 Vue 树形测试，所以 DEFAULT_DEPARTMENT_TREE 保留为 Vue-local
//     （与 5b React "findOrgNode 返回扁平" 不同 — Vue 自家递归组件需要树）。

import {
  TENANTS,
  USERS as SHARED_USERS,
  AUDIT_LOGS,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  USER_GROUPS,
  APPS,
  APP_MENUS,
  POSITIONS,
  LOGIN_METHODS,
  SSO_PROVIDERS,
  OAUTH2_PROVIDERS,
  API_KEYS,
  TOKEN_CONFIG as SHARED_TOKEN_CONFIG,
  LOGIN_SECURITY,
  PASSWORD_POLICY,
  RISK_CONTROL,
  NOTIFICATION_CONFIG,
  OPEN_PLATFORM_CONFIG,
} from '@saas/identity-platform-shared/seeds'
import {
  TenantSchema,
  AuditLogSchema,
  RoleSchema,
  PermissionGroupSchema,
  UserGroupSchema,
  AppSchema,
  MenuSchema,
  PositionSchema,
  LoginMethodEntrySchema,
  SsoProviderSchema,
  OAuth2ProviderSchema,
  ApiKeySchema,
  TokenConfigSchema,
  LoginSecuritySchema,
  PasswordPolicySchema,
  RiskControlSchema,
  NotificationConfigSchema,
  OpenPlatformConfigSchema,
} from '@saas/identity-platform-shared/schemas'
import type {
  AuditLog as SharedAuditLog,
  App as SharedApp,
  Menu as SharedMenu,
  Position as SharedPosition,
  UserGroup as SharedUserGroup,
  PermissionGroup as SharedPermissionGroup,
  LoginMethodEntry as SharedLoginMethodEntry,
  SsoProvider as SharedSsoProvider,
  OAuth2Provider as SharedOAuth2Provider,
  ApiKey as SharedApiKey,
  TokenConfig as SharedTokenConfig,
  LoginSecurity as SharedLoginSecurity,
  PasswordPolicy as SharedPasswordPolicy,
  RiskControl as SharedRiskControl,
  NotificationConfig as SharedNotificationConfig,
  OpenPlatformConfig as SharedOpenPlatformConfig,
} from '@saas/identity-platform-shared/schemas'
import type { User, DepartmentNode } from '../src/types/user'
import type { Role } from '../src/types/rbac'

// ──────────────────────────────────────────────────────────────────────
// 类型：保持与原 db.ts 同名（同构），供既有 handlers/UI 直接使用
// ──────────────────────────────────────────────────────────────────────

type Tenant = (typeof TENANTS)[number]
/** 旧名 MockTenant 别名（兼容原 Vue msw/handlers.ts 的 `MockTenant` 类型 import） */
export type MockTenant = Tenant
type AuditLog = SharedAuditLog
type App = SharedApp
type Menu = SharedMenu
type Position = SharedPosition
type UserGroup = SharedUserGroup
type PermissionGroup = SharedPermissionGroup
type LoginMethod = SharedLoginMethodEntry
type SsoProvider = SharedSsoProvider
type OAuth2Provider = SharedOAuth2Provider
type ApiKey = SharedApiKey
type TokenConfig = SharedTokenConfig
type LoginSecurity = SharedLoginSecurity
type PasswordPolicy = SharedPasswordPolicy
type RiskControl = SharedRiskControl
type NotificationConfig = SharedNotificationConfig
type OpenPlatformConfig = SharedOpenPlatformConfig

/** 通用重置入口 */
export function resetMockDb() {
  resetTenants()
  resetUsers()
  resetDepartments()
  resetAuditLogs()
  resetRoles()
  resetApps()
  resetMenus()
  resetPositions()
  resetUserGroups()
  resetPermissionGroups()
  resetLoginMethods()
  resetSsoProviders()
  resetOAuth2Providers()
  resetTokenConfig()
  resetApiKeys()
  resetLoginSecurity()
  resetPasswordPolicy()
  resetRiskControl()
  resetNotificationConfig()
  resetOpenPlatformConfig()
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function now(): string {
  return new Date().toISOString()
}

// ──────────────────────────────────────────────────────────────────────
// Tenants
// ──────────────────────────────────────────────────────────────────────

export interface TenantCreateInput {
  name: string
  theme: { primary: string; sidebar: string; logoText: string }
  config?: { features?: string[]; maxUsers?: number }
}

let tenants: Tenant[] = TENANTS.map((t) => TenantSchema.parse(t) as unknown as Tenant)

function resetTenants() {
  tenants = TENANTS.map((t) => TenantSchema.parse(t) as unknown as Tenant)
}

export function listTenants(): Tenant[] {
  return tenants.map((t) => structuredClone(t))
}

export function findTenant(id: string): Tenant | undefined {
  return tenants.find((t) => t.id === id)
}

export function insertTenant(input: TenantCreateInput): Tenant {
  const tenant = {
    id: genId('tenant'),
    name: input.name,
    theme: input.theme,
    config: input.config ?? { features: [], maxUsers: 100 },
  } as unknown as Tenant
  tenants.push(tenant)
  return structuredClone(tenant)
}

export function updateTenantRecord(id: string, patch: Partial<TenantCreateInput>): Tenant | undefined {
  const idx = tenants.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const updated: Tenant = {
    ...tenants[idx],
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
    ...(patch.config !== undefined ? { config: patch.config } : {}),
  } as unknown as Tenant
  tenants[idx] = updated
  return structuredClone(updated)
}

export function deleteTenantRecord(id: string): boolean {
  const idx = tenants.findIndex((t) => t.id === id)
  if (idx === -1) return false
  tenants.splice(idx, 1)
  return true
}

export function queryTenants(opts?: { keyword?: string }): Tenant[] {
  if (!opts?.keyword) return listTenants()
  const kw = opts.keyword.toLowerCase()
  return tenants.filter((t) => t.name.toLowerCase().includes(kw)).map((t) => structuredClone(t))
}

// ──────────────────────────────────────────────────────────────────────
// Users（v0.3.0：orgId → departmentId）
//
// Vue-local DEFAULT_USERS：保留 React 5b 同款的 18 users demo 数据，但部门 ID
// 字段改名为 departmentId，部门标识从 org-* 重命名为 department-*。
// 这是 Vue 树形测试与 UserList 测试期望的部门 ID 命名（department-acme/fe/...）。
// shared USERS 提供的 tenant-lab 用户 + View store 默认 u-001/u-002 已包含在 DEFAULT_USERS 中。
// ──────────────────────────────────────────────────────────────────────

const DEFAULT_USERS = [
  // v0.3.0 重命名后 User schema（来自 shared）启用 enabled + tenantId 二必填；这里全部显式补齐：
  // - enabled: true（local 字段默认活跃，guest 是 disabled=false）
  // - tenantId：acme/globex 都属 'acme' 顶层租户；lab 用户来自 SHARED_USERS
  // —— acme 用户 ——
  { id: 'u-001', username: 'admin@acme', displayName: 'SaaS 管理员', email: 'admin@acme.com', departmentId: 'department-acme', tenantId: 'acme', roles: ['admin'], status: 'active', createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'u-002', username: 'technician@acme', displayName: '张检测', email: 'tech@acme.com', departmentId: 'department-tech', tenantId: 'acme', roles: ['member'], status: 'active', createdAt: '2026-01-02T09:00:00Z', updatedAt: '2026-01-02T09:00:00Z' },
  { id: 'u-003', username: 'alice.chen@acme', displayName: '陈艾丽丝', email: 'alice@acme.com', departmentId: 'department-fe', tenantId: 'acme', roles: ['admin'], status: 'active', createdAt: '2026-01-03T10:00:00Z', updatedAt: '2026-01-03T10:00:00Z' },
  { id: 'u-004', username: 'bob.wang@acme', displayName: '王大力', email: 'bob@acme.com', departmentId: 'department-fe', tenantId: 'acme', roles: ['member'], status: 'active', createdAt: '2026-01-04T11:00:00Z', updatedAt: '2026-01-04T11:00:00Z' },
  { id: 'u-005', username: 'carol.li@acme', displayName: '李佳慧', email: 'carol@acme.com', departmentId: 'department-sales', tenantId: 'acme', roles: ['manager'], status: 'active', createdAt: '2026-01-05T12:00:00Z', updatedAt: '2026-01-05T12:00:00Z' },
  // —— globex 用户 ——
  { id: 'u-007', username: 'manager@globex', displayName: 'Globex 经理', email: 'manager@globex.com', departmentId: 'department-globex', tenantId: 'acme', roles: ['manager'], status: 'active', createdAt: '2026-01-02T08:00:00Z', updatedAt: '2026-01-02T08:00:00Z' },
  { id: 'u-008', username: 'guest@globex', displayName: '访客账户', email: 'guest@globex.com', departmentId: 'department-globex', tenantId: 'acme', roles: ['viewer'], status: 'disabled', createdAt: '2026-01-03T09:00:00Z', updatedAt: '2026-01-03T09:00:00Z' },
  { id: 'u-009', username: 'eva.liu@globex', displayName: '刘伊娃', email: 'eva@globex.com', departmentId: 'department-globex-tech', tenantId: 'acme', roles: ['admin'], status: 'active', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-01-04T10:00:00Z' },
  // —— lab 业务用户（来自 shared USERS，tenantId='tenant-lab'）——
  ...(SHARED_USERS.filter((u) => u.tenantId === 'tenant-lab')),
] as unknown as User[]

let users: User[] = [...DEFAULT_USERS]

function resetUsers() {
  users = [...DEFAULT_USERS]
}

// v0.3.0：handlers 给的 UserCreateInput 不带 enabled（Vue 本地接口），但 shared User 要求
// enabled 必填。insertUser 接受 Vue 本地插入输入（不带 enabled/tenantId），内部补齐。
type VueUserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'enabled' | 'tenantId'>
  & Partial<Pick<User, 'id' | 'enabled' | 'tenantId'>>

export function insertUser(input: VueUserCreateInput): User {
  const user = {
    ...input,
    id: input.id ?? genId('u'),
    status: input.status ?? 'active',
    createdAt: now(),
    updatedAt: now(),
    tenantId: input.tenantId ?? 'acme',
    enabled: input.enabled ?? true,
  } as unknown as User
  users.push(user)
  return user
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function updateUserRecord(id: string, patch: Partial<User>): User | undefined {
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return undefined
  const updated = { ...users[idx], ...patch, id, updatedAt: now() }
  users[idx] = updated
  return updated
}

export function deleteUserRecord(id: string): boolean {
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return false
  users.splice(idx, 1)
  return true
}

export function queryUsers(opts: {
  page: number
  pageSize: number
  keyword?: string
  role?: string
  status?: string
  /** v0.3.0 改名（原 orgId） */
  departmentId?: string
}): { items: User[]; total: number; page: number; pageSize: number } {
  let filtered = [...users]
  if (opts.keyword) {
    const kw = opts.keyword.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(kw) ||
        u.displayName.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw),
    )
  }
  if (opts.role) {
    filtered = filtered.filter((u) => u.roles.includes(opts.role as User['roles'][number]))
  }
  if (opts.status) {
    filtered = filtered.filter((u) => u.status === opts.status)
  }
  if (opts.departmentId) {
    filtered = filtered.filter((u) => u.departmentId === opts.departmentId)
  }
  filtered.sort((a, b) => ((a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1))
  const total = filtered.length
  const start = (opts.page - 1) * opts.pageSize
  return {
    items: filtered.slice(start, start + opts.pageSize),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  }
}

// ──────────────────────────────────────────────────────────────────────
// Department Tree（v0.3.0：嵌套 DepartmentNode）
//
// DEFAULT_DEPARTMENT_TREE 保留为 Vue 特有的嵌套树（与 React 5b 扁平化的策略
// 不同）— 因为 Vue DepartmentTreeNode.vue 用递归组件渲染 children，扁平数组
// 必须由 handlers 转树（ch41 测试也期望 children 存在）。
// ──────────────────────────────────────────────────────────────────────

const DEFAULT_DEPARTMENT_TREE: DepartmentNode = {
  id: 'department-root',
  name: 'ACME 集团',
  children: [
    {
      id: 'department-acme',
      name: 'ACME 总部',
      children: [
        { id: 'department-tech', name: '技术部', children: [
          { id: 'department-fe', name: '前端组' },
        ] },
        { id: 'department-sales', name: '销售部' },
      ],
    },
    {
      id: 'department-globex',
      name: 'Globex 分部',
      children: [{ id: 'department-globex-tech', name: 'Globex 技术部' }],
    },
  ],
}

let departmentTree: DepartmentNode = DEFAULT_DEPARTMENT_TREE

function resetDepartments() {
  departmentTree = DEFAULT_DEPARTMENT_TREE
}

function cloneTree(node: DepartmentNode): DepartmentNode {
  return {
    id: node.id,
    name: node.name,
    children: node.children?.map(cloneTree),
  }
}

export function getDepartmentTree(): DepartmentNode {
  return cloneTree(departmentTree)
}

/**
 * 旧 `getOrgTree()` 别名 — 保留为 v0.3.0 兼容导出。
 */
export function getOrgTree(): DepartmentNode {
  return getDepartmentTree()
}

export function findDepartmentNode(id: string): DepartmentNode | undefined {
  const search = (node: DepartmentNode): DepartmentNode | undefined => {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = search(child)
        if (found) return found
      }
    }
    return undefined
  }
  return search(departmentTree)
}

/** 旧 `findOrgNode()` 别名 — v0.3.0 兼容导出 */
export function findOrgNode(id: string): DepartmentNode | undefined {
  return findDepartmentNode(id)
}

export function insertDepartmentNode(parentId: string, name: string): DepartmentNode | undefined {
  const parent = findDepartmentNode(parentId)
  if (!parent) return undefined
  if (!parent.children) parent.children = []
  const node: DepartmentNode = {
    id: `department-${Math.random().toString(36).slice(2, 10)}`,
    name,
    children: [],
  }
  parent.children.push(node)
  return node
}

/** 旧 `insertOrgNode` 别名 — v0.3.0 兼容导出 */
export function insertOrgNode(parentId: string, name: string): DepartmentNode | undefined {
  return insertDepartmentNode(parentId, name)
}

export function updateDepartmentNodeRecord(id: string, name: string): DepartmentNode | undefined {
  const node = findDepartmentNode(id)
  if (!node) return undefined
  node.name = name
  return node
}

/** 旧 `updateOrgNodeRecord` 别名 */
export function updateOrgNodeRecord(id: string, name: string): DepartmentNode | undefined {
  return updateDepartmentNodeRecord(id, name)
}

export function deleteDepartmentNodeRecord(id: string): boolean {
  if (id === 'department-root') return false
  const remove = (node: DepartmentNode): boolean => {
    if (!node.children) return false
    const idx = node.children.findIndex((c) => c.id === id)
    if (idx !== -1) {
      node.children.splice(idx, 1)
      return true
    }
    for (const child of node.children) {
      if (remove(child)) return true
    }
    return false
  }
  return remove(departmentTree)
}

/** 旧 `deleteOrgNodeRecord` 别名 */
export function deleteOrgNodeRecord(id: string): boolean {
  return deleteDepartmentNodeRecord(id)
}

// ──────────────────────────────────────────────────────────────────────
// Audit Logs（来自 shared seeds）
// ──────────────────────────────────────────────────────────────────────

let auditLogs: AuditLog[] = AUDIT_LOGS.map((a) => AuditLogSchema.parse(a) as AuditLog)

function resetAuditLogs() {
  auditLogs = AUDIT_LOGS.map((a) => AuditLogSchema.parse(a) as AuditLog)
}

export function queryAuditLogs(opts: {
  page: number
  pageSize: number
  action?: string
  operator?: string
  ip?: string
  startDate?: string
  endDate?: string
  type?: 'login' | 'security' | 'operation'
}): { items: AuditLog[]; total: number; page: number; pageSize: number } {
  let filtered = [...auditLogs]
  if (opts.action) {
    filtered = filtered.filter((l) => l.action === opts.action)
  }
  if (opts.operator) {
    const op = opts.operator.toLowerCase()
    filtered = filtered.filter((l) => l.operator.toLowerCase().includes(op))
  }
  if (opts.ip) {
    filtered = filtered.filter((l) => l.ip.includes(opts.ip!))
  }
  if (opts.startDate) {
    filtered = filtered.filter((l) => (l.timestamp ?? '') >= opts.startDate!)
  }
  if (opts.endDate) {
    filtered = filtered.filter((l) => (l.timestamp ?? '') <= opts.endDate!)
  }
  if (opts.type) {
    const typeMap: Record<string, string[]> = {
      login: ['login'],
      security: ['login', 'logout', 'permission_change'],
      operation: ['create', 'update', 'delete'],
    }
    const allowed = typeMap[opts.type] ?? [opts.type]
    filtered = filtered.filter((l) => allowed.includes(l.action))
  }
  filtered.sort((a, b) => ((a.timestamp ?? '') < (b.timestamp ?? '') ? 1 : -1))
  const total = filtered.length
  const start = (opts.page - 1) * opts.pageSize
  return {
    items: filtered.slice(start, start + opts.pageSize),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  }
}

// ──────────────────────────────────────────────────────────────────────
// Roles（来自 shared seeds，tenantId 已上提）
// ──────────────────────────────────────────────────────────────────────

export interface RoleCreateInput {
  name: string
  permissions: string[]
  menuPermissions?: { menuId: string; actions: string[] }[]
}

let roles: Role[] = ROLE_PERMISSIONS.map((r) => {
  const parsed = RoleSchema.parse(r)
  return {
    id: parsed.id,
    name: parsed.name,
    permissions: parsed.permissions as string[],
    menuPermissions: (parsed.menuPermissions ?? []) as Role['menuPermissions'],
  }
})

function resetRoles() {
  roles = ROLE_PERMISSIONS.map((r) => {
    const parsed = RoleSchema.parse(r)
    return {
      id: parsed.id,
      name: parsed.name,
      permissions: parsed.permissions as string[],
      menuPermissions: (parsed.menuPermissions ?? []) as Role['menuPermissions'],
    }
  })
}

export function listRoles(): Role[] {
  return roles.map((r) => ({ ...r, menuPermissions: [...r.menuPermissions] }))
}

export function insertRole(input: RoleCreateInput): Role {
  const role: Role = {
    id: genId('role'),
    name: input.name,
    permissions: input.permissions,
    menuPermissions: (input.menuPermissions ?? []) as Role['menuPermissions'],
  }
  roles.push(role)
  return role
}

export function updateRoleRecord(id: string, patch: Partial<RoleCreateInput>): Role | undefined {
  const idx = roles.findIndex((r) => r.id === id)
  if (idx === -1) return undefined
  const updated: Role = {
    ...roles[idx],
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.permissions !== undefined ? { permissions: patch.permissions } : {}),
    ...(patch.menuPermissions !== undefined ? { menuPermissions: patch.menuPermissions as Role['menuPermissions'] } : {}),
  }
  roles[idx] = updated
  return updated
}

export function deleteRoleRecord(id: string): boolean {
  const idx = roles.findIndex((r) => r.id === id)
  if (idx === -1) return false
  roles.splice(idx, 1)
  return true
}

// ──────────────────────────────────────────────────────────────────────
// Apps + Menus（来自 shared seeds）
// ──────────────────────────────────────────────────────────────────────

let apps: App[] = APPS.map((a) => AppSchema.parse(a) as App)
let menus: Menu[] = APP_MENUS.map((m) => MenuSchema.parse(m) as Menu)

function resetApps() {
  apps = APPS.map((a) => AppSchema.parse(a) as App)
}
function resetMenus() {
  menus = APP_MENUS.map((m) => MenuSchema.parse(m) as Menu)
}

export function listApps(opts?: { keyword?: string }): App[] {
  if (!opts?.keyword) return [...apps].sort((a, b) => a.sort - b.sort)
  const kw = opts.keyword.toLowerCase()
  return apps
    .filter(
      (a) =>
        a.name.toLowerCase().includes(kw) ||
        a.code.toLowerCase().includes(kw) ||
        (a.description ?? '').toLowerCase().includes(kw),
    )
    .sort((a, b) => a.sort - b.sort)
}

export function findApp(id: string): App | undefined {
  return apps.find((a) => a.id === id)
}

export function insertApp(input: Omit<App, 'id' | 'createdAt' | 'updatedAt'>): App {
  const ts = new Date().toISOString()
  // shared App schema 要求 type 必填（web/mobile/api），Vue handlers 默认没传；兜底 'web'
  const app = { ...input, id: genId('app'), createdAt: ts, updatedAt: ts, type: (input as { type?: string }).type ?? 'web' } as unknown as App
  apps.push(app)
  return app
}

export function updateAppRecord(
  id: string,
  patch: Partial<Omit<App, 'id' | 'createdAt'>>,
): App | undefined {
  const idx = apps.findIndex((a) => a.id === id)
  if (idx === -1) return undefined
  apps[idx] = { ...apps[idx], ...patch, id, updatedAt: new Date().toISOString() }
  return apps[idx]
}

export function deleteAppRecord(id: string): boolean {
  const idx = apps.findIndex((a) => a.id === id)
  if (idx === -1) return false
  // 删应用时一并清掉旗下菜单
  menus = menus.filter((m) => m.appId !== id)
  apps.splice(idx, 1)
  return true
}

export function listMenus(appId?: string): Menu[] {
  const list = appId ? menus.filter((m) => m.appId === appId) : [...menus]
  return list.sort((a, b) => a.sort - b.sort)
}

export function findMenu(id: string): Menu | undefined {
  return menus.find((m) => m.id === id)
}

export function insertMenu(input: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Menu {
  const ts = new Date().toISOString()
  const menu: Menu = { ...input, id: genId('m'), createdAt: ts, updatedAt: ts }
  menus.push(menu)
  return menu
}

export function updateMenuRecord(
  id: string,
  patch: Partial<Omit<Menu, 'id' | 'createdAt' | 'appId'>>,
): Menu | undefined {
  const idx = menus.findIndex((m) => m.id === id)
  if (idx === -1) return undefined
  menus[idx] = { ...menus[idx], ...patch, id, updatedAt: new Date().toISOString() }
  return menus[idx]
}

export function deleteMenuRecord(id: string): boolean {
  const idx = menus.findIndex((m) => m.id === id)
  if (idx === -1) return false
  menus.splice(idx, 1)
  return true
}

// ──────────────────────────────────────────────────────────────────────
// Positions / User Groups / Permission Groups（来自 shared seeds）
// ──────────────────────────────────────────────────────────────────────

let positions: Position[] = POSITIONS.map((p) => PositionSchema.parse(p) as Position)
let userGroups: UserGroup[] = USER_GROUPS.map((g) => UserGroupSchema.parse(g) as UserGroup)
let permissionGroups: PermissionGroup[] = PERMISSION_GROUPS.map((g) => PermissionGroupSchema.parse(g) as PermissionGroup)

function resetPositions() { positions = POSITIONS.map((p) => PositionSchema.parse(p) as Position) }
function resetUserGroups() { userGroups = USER_GROUPS.map((g) => UserGroupSchema.parse(g) as UserGroup) }
function resetPermissionGroups() { permissionGroups = PERMISSION_GROUPS.map((g) => PermissionGroupSchema.parse(g) as PermissionGroup) }

// —— 岗位 ——
export function listPositions(): Position[] { return [...positions].sort((a, b) => a.sort - b.sort) }
export function findPosition(id: string): Position | undefined { return positions.find((p) => p.id === id) }
export function insertPosition(input: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Position {
  const ts = new Date().toISOString()
  // shared Position schema 要求 tenantId 必填；Vue handlers 默认没传，兜底 'acme'
  const p = { ...input, id: genId('pos'), createdAt: ts, updatedAt: ts, tenantId: (input as { tenantId?: string }).tenantId ?? 'acme' } as unknown as Position
  positions.push(p)
  return p
}
export function updatePositionRecord(id: string, patch: Partial<Omit<Position, 'id' | 'createdAt'>>): Position | undefined {
  const idx = positions.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  positions[idx] = { ...positions[idx], ...patch, id, updatedAt: new Date().toISOString() }
  return positions[idx]
}
export function deletePositionRecord(id: string): boolean {
  const idx = positions.findIndex((p) => p.id === id)
  if (idx === -1) return false
  positions.splice(idx, 1)
  return true
}

// —— 用户组 ——
export function listUserGroups(): UserGroup[] { return [...userGroups].sort((a, b) => a.id.localeCompare(b.id)) }
export function findUserGroup(id: string): UserGroup | undefined { return userGroups.find((g) => g.id === id) }
export function insertUserGroup(input: Omit<UserGroup, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>): UserGroup {
  const ts = new Date().toISOString()
  const g = { ...input, id: genId('ug'), memberCount: 0, createdAt: ts, updatedAt: ts, tenantId: (input as { tenantId?: string }).tenantId ?? 'acme' } as unknown as UserGroup
  userGroups.push(g)
  return g
}
export function updateUserGroupRecord(id: string, patch: Partial<Omit<UserGroup, 'id' | 'createdAt'>>): UserGroup | undefined {
  const idx = userGroups.findIndex((g) => g.id === id)
  if (idx === -1) return undefined
  userGroups[idx] = { ...userGroups[idx], ...patch, id, updatedAt: new Date().toISOString() }
  return userGroups[idx]
}
export function deleteUserGroupRecord(id: string): boolean {
  const idx = userGroups.findIndex((g) => g.id === id)
  if (idx === -1) return false
  userGroups.splice(idx, 1)
  return true
}

// —— 权限组 ——
export function listPermissionGroups(): PermissionGroup[] { return [...permissionGroups] }
export function findPermissionGroup(id: string): PermissionGroup | undefined { return permissionGroups.find((p) => p.id === id) }
export function insertPermissionGroup(input: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>): PermissionGroup {
  const ts = new Date().toISOString()
  // shared PermissionGroup.permissions 是 PermissionCodeEnum 枚举；Vue handlers 给 string[]，
  // mock 阶段不强严格。
  const g = {
    ...input,
    id: genId('pg'),
    createdAt: ts,
    updatedAt: ts,
    appId: (input as { appId?: string }).appId ?? 'app-lab',
  } as unknown as PermissionGroup
  permissionGroups.push(g)
  return g
}
export function updatePermissionGroupRecord(id: string, patch: Partial<Omit<PermissionGroup, 'id' | 'createdAt'>>): PermissionGroup | undefined {
  const idx = permissionGroups.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  permissionGroups[idx] = { ...permissionGroups[idx], ...patch, id, updatedAt: new Date().toISOString() }
  return permissionGroups[idx]
}
export function deletePermissionGroupRecord(id: string): boolean {
  const idx = permissionGroups.findIndex((p) => p.id === id)
  if (idx === -1) return false
  permissionGroups.splice(idx, 1)
  return true
}

// ──────────────────────────────────────────────────────────────────────
// Login Methods / SSO / OAuth2 / Token / API Key（来自 shared seeds）
// ──────────────────────────────────────────────────────────────────────

let loginMethods: LoginMethod[] = LOGIN_METHODS.map((m) => LoginMethodEntrySchema.parse(m) as LoginMethod)
let ssoProviders: SsoProvider[] = SSO_PROVIDERS.map((p) => SsoProviderSchema.parse(p) as SsoProvider)
let oauth2Providers: OAuth2Provider[] = OAUTH2_PROVIDERS.map((p) => OAuth2ProviderSchema.parse(p) as OAuth2Provider)

function resetLoginMethods() { loginMethods = LOGIN_METHODS.map((m) => LoginMethodEntrySchema.parse(m) as LoginMethod) }
function resetSsoProviders() { ssoProviders = SSO_PROVIDERS.map((p) => SsoProviderSchema.parse(p) as SsoProvider) }
function resetOAuth2Providers() { oauth2Providers = OAUTH2_PROVIDERS.map((p) => OAuth2ProviderSchema.parse(p) as OAuth2Provider) }

export function listLoginMethods(): LoginMethod[] { return [...loginMethods].sort((a, b) => a.sort - b.sort) }
export function findLoginMethod(id: string): LoginMethod | undefined { return loginMethods.find((m) => m.id === id) }
export function updateLoginMethodRecord(id: string, patch: Partial<Omit<LoginMethod, 'id' | 'method'>>): LoginMethod | undefined {
  const idx = loginMethods.findIndex((m) => m.id === id)
  if (idx === -1) return undefined
  loginMethods[idx] = { ...loginMethods[idx], ...patch, id }
  return loginMethods[idx]
}

export function listSsoProviders(): SsoProvider[] { return [...ssoProviders] }
export function findSsoProvider(id: string): SsoProvider | undefined { return ssoProviders.find((p) => p.id === id) }
export function updateSsoProviderRecord(id: string, patch: Partial<Omit<SsoProvider, 'id'>>): SsoProvider | undefined {
  const idx = ssoProviders.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  ssoProviders[idx] = { ...ssoProviders[idx], ...patch, id }
  return ssoProviders[idx]
}

export function listOAuth2Providers(): OAuth2Provider[] { return [...oauth2Providers] }
export function findOAuth2Provider(id: string): OAuth2Provider | undefined { return oauth2Providers.find((p) => p.id === id) }
export function updateOAuth2ProviderRecord(id: string, patch: Partial<Omit<OAuth2Provider, 'id'>>): OAuth2Provider | undefined {
  const idx = oauth2Providers.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  oauth2Providers[idx] = { ...oauth2Providers[idx], ...patch, id }
  return oauth2Providers[idx]
}

let tokenConfig: TokenConfig = TokenConfigSchema.parse(SHARED_TOKEN_CONFIG[0]) as TokenConfig

function resetTokenConfig() { tokenConfig = TokenConfigSchema.parse(SHARED_TOKEN_CONFIG[0]) as TokenConfig }
export function getTokenConfig(): TokenConfig { return structuredClone(tokenConfig) }
export function updateTokenConfigRecord(patch: Partial<Omit<TokenConfig, 'id'>>): TokenConfig {
  tokenConfig = { ...tokenConfig, ...patch, id: 'token-default' }
  return structuredClone(tokenConfig)
}

let apiKeys: ApiKey[] = API_KEYS.map((k) => ApiKeySchema.parse(k) as ApiKey)
function resetApiKeys() { apiKeys = API_KEYS.map((k) => ApiKeySchema.parse(k) as ApiKey) }

export function listApiKeys(): ApiKey[] { return [...apiKeys] }
export function findApiKey(id: string): ApiKey | undefined { return apiKeys.find((k) => k.id === id) }
export function insertApiKey(input: { name: string; scopes?: string[]; expiresAt?: string }): ApiKey {
  const ts = new Date().toISOString()
  const k: ApiKey = {
    id: genId('ak'),
    name: input.name,
    keyPrefix: `ak_${Math.random().toString(36).slice(2, 8)}_xxx`,
    scopes: input.scopes ?? [],
    expiresAt: input.expiresAt,
    enabled: true,
    createdAt: ts,
  } as ApiKey
  apiKeys.push(k)
  return k
}
export function updateApiKeyRecord(id: string, patch: Partial<Omit<ApiKey, 'id' | 'keyPrefix' | 'createdAt'>>): ApiKey | undefined {
  const idx = apiKeys.findIndex((k) => k.id === id)
  if (idx === -1) return undefined
  apiKeys[idx] = { ...apiKeys[idx], ...patch, id }
  return apiKeys[idx]
}
export function deleteApiKeyRecord(id: string): boolean {
  const idx = apiKeys.findIndex((k) => k.id === id)
  if (idx === -1) return false
  apiKeys.splice(idx, 1)
  return true
}

// ──────────────────────────────────────────────────────────────────────
// Login Security / Password Policy / Risk Control / Notification / Open Platform
// ──────────────────────────────────────────────────────────────────────

let loginSecurity: LoginSecurity = LoginSecuritySchema.parse(LOGIN_SECURITY[0]) as LoginSecurity
let passwordPolicy: PasswordPolicy = PasswordPolicySchema.parse(PASSWORD_POLICY[0]) as PasswordPolicy
let riskControl: RiskControl = RiskControlSchema.parse(RISK_CONTROL[0]) as RiskControl
let notificationConfig: NotificationConfig = NotificationConfigSchema.parse(NOTIFICATION_CONFIG[0]) as NotificationConfig
let openPlatformConfig: OpenPlatformConfig = OpenPlatformConfigSchema.parse(OPEN_PLATFORM_CONFIG[0]) as OpenPlatformConfig

function resetLoginSecurity() { loginSecurity = LoginSecuritySchema.parse(LOGIN_SECURITY[0]) as LoginSecurity }
function resetPasswordPolicy() { passwordPolicy = PasswordPolicySchema.parse(PASSWORD_POLICY[0]) as PasswordPolicy }
function resetRiskControl() { riskControl = RiskControlSchema.parse(RISK_CONTROL[0]) as RiskControl }
function resetNotificationConfig() { notificationConfig = NotificationConfigSchema.parse(NOTIFICATION_CONFIG[0]) as NotificationConfig }
function resetOpenPlatformConfig() { openPlatformConfig = OpenPlatformConfigSchema.parse(OPEN_PLATFORM_CONFIG[0]) as OpenPlatformConfig }

export function getLoginSecurity(): LoginSecurity { return structuredClone(loginSecurity) }
export function updateLoginSecurityRecord(patch: Partial<Omit<LoginSecurity, 'id'>>): LoginSecurity {
  loginSecurity = { ...loginSecurity, ...patch, id: 'login-security-default' }
  return structuredClone(loginSecurity)
}

export function getPasswordPolicy(): PasswordPolicy { return structuredClone(passwordPolicy) }
export function updatePasswordPolicyRecord(patch: Partial<Omit<PasswordPolicy, 'id'>>): PasswordPolicy {
  passwordPolicy = { ...passwordPolicy, ...patch, id: 'password-policy-default' }
  return structuredClone(passwordPolicy)
}

export function getRiskControl(): RiskControl { return structuredClone(riskControl) }
export function updateRiskControlRecord(patch: Partial<Omit<RiskControl, 'id'>>): RiskControl {
  riskControl = { ...riskControl, ...patch, id: 'risk-control-default' }
  return structuredClone(riskControl)
}

export function getNotificationConfig(): NotificationConfig { return structuredClone(notificationConfig) }
export function updateNotificationConfigRecord(patch: Partial<Omit<NotificationConfig, 'id'>>): NotificationConfig {
  notificationConfig = { ...notificationConfig, ...patch, id: 'notification-config-default' }
  return structuredClone(notificationConfig)
}

export function getOpenPlatformConfig(): OpenPlatformConfig { return structuredClone(openPlatformConfig) }
export function updateOpenPlatformConfigRecord(patch: Partial<Omit<OpenPlatformConfig, 'id'>>): OpenPlatformConfig {
  openPlatformConfig = { ...openPlatformConfig, ...patch, id: 'open-platform-default' }
  return structuredClone(openPlatformConfig)
}

// 模块加载时初始化 mock 数据（供测试隔离使用）
resetMockDb()
