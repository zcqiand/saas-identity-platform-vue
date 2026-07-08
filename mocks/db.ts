// Mock 内存数据库：仅 mock 层使用，测试间隔离由 tests/setup.ts 的 resetMockDb 保证。
// ch39：租户数据；ch40 追加角色；ch41 追加 userTable/orgTree/auditLogTable（只增）。
// 与 React 双栈仓 msw/db.ts 中 ch39-42 涉及的数据保持一致（租户/用户/组织/审计/角色）。

import type { User, OrgNode, AuditLog } from '../src/types/user'
import type { Role } from '../src/types/rbac'
import type { App, MenuItem } from '../src/types/app'
import type { Position, UserGroup, PermissionGroup } from '../src/types/org'
import type {
  LoginMethod, SsoProvider, OAuth2Provider, TokenConfig, ApiKey,
  LoginSecurity, PasswordPolicy, RiskControl, NotificationConfig, OpenPlatformConfig,
} from '../src/types/security'

/** 通用重置入口 */
export function resetMockDb() {
  resetTenants()
  resetUsers()
  resetOrgs()
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

// —— ch39：租户表（12 个） ——
export interface MockTenant {
  id: string
  name: string
  theme: {
    primary: string
    sidebar: string
    logoText: string
  }
  /** 启用的功能模块（与 TenantConfig.features 对齐，顶层字段） */
  features: string[]
  config?: {
    maxUsers?: number
    [key: string]: unknown
  }
}

const DEFAULT_TENANTS: MockTenant[] = [
  { id: 'acme', name: 'ACME 集团', theme: { primary: '#2563eb', sidebar: '#1e293b', logoText: 'ACME' }, features: ['sso', 'audit', 'rbac'], config: { maxUsers: 200 } },
  { id: 'globex', name: 'Globex 科技', theme: { primary: '#059669', sidebar: '#064e3b', logoText: 'GLOBEX' }, features: ['sso', 'rbac'], config: { maxUsers: 100 } },
  { id: 'initech', name: 'Initech 工程', theme: { primary: '#7c3aed', sidebar: '#2e1065', logoText: 'INITECH' }, features: ['sso', 'audit', 'rbac'], config: { maxUsers: 50 } },
  { id: 'umbrella', name: 'Umbrella 生物', theme: { primary: '#dc2626', sidebar: '#450a0a', logoText: 'UMBRELLA' }, features: ['audit', 'rbac'], config: { maxUsers: 80 } },
  { id: 'tyrell', name: 'Tyrell 未来', theme: { primary: '#0891b2', sidebar: '#0c4a6e', logoText: 'TYRELL' }, features: ['sso', 'rbac'], config: { maxUsers: 150 } },
  { id: 'massive', name: 'Massive 动态', theme: { primary: '#ea580c', sidebar: '#431407', logoText: 'MASSIVE' }, features: ['sso', 'audit'], config: { maxUsers: 60 } },
  { id: 'weyland', name: 'Weyland 航天', theme: { primary: '#65a30d', sidebar: '#1a2e05', logoText: 'WEYLAND' }, features: ['sso', 'audit', 'rbac'], config: { maxUsers: 300 } },
  { id: 'cyberdyne', name: 'Cyberdyne 系统', theme: { primary: '#0f766e', sidebar: '#134e4a', logoText: 'CYBERDYNE' }, features: ['rbac'], config: { maxUsers: 120 } },
  { id: 'buy', name: 'Buy n Large', theme: { primary: '#f59e0b', sidebar: '#451a03', logoText: 'BnL' }, features: ['sso', 'audit', 'rbac'], config: { maxUsers: 500 } },
  { id: 'no', name: 'Noosphinx 媒体', theme: { primary: '#6366f1', sidebar: '#1e1b4b', logoText: 'NOO' }, features: ['sso', 'rbac'], config: { maxUsers: 75 } },
  { id: 'olympus', name: 'Olympus 影像', theme: { primary: '#be185d', sidebar: '#500724', logoText: 'OLYMPUS' }, features: ['audit', 'rbac'], config: { maxUsers: 90 } },
  { id: 'axiom', name: 'Axiom 航运', theme: { primary: '#2563eb', sidebar: '#1e3a5f', logoText: 'AXIOM' }, features: ['sso', 'audit', 'rbac'], config: { maxUsers: 250 } },
]

let tenants: MockTenant[] = [...DEFAULT_TENANTS]

function resetTenants() {
  tenants = [...DEFAULT_TENANTS]
}

export function listTenants(): MockTenant[] {
  return [...tenants]
}

export function findTenant(id: string): MockTenant | undefined {
  return tenants.find((t) => t.id === id)
}

export interface TenantCreateInput {
  name: string
  theme: { primary: string; sidebar: string; logoText: string }
  features?: string[]
  config?: { maxUsers?: number }
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function insertTenant(input: TenantCreateInput): MockTenant {
  const tenant: MockTenant = {
    id: genId('tenant'),
    name: input.name,
    theme: input.theme,
    features: input.features ?? [],
    config: input.config ?? { maxUsers: 100 },
  }
  tenants.push(tenant)
  return tenant
}

export function updateTenantRecord(id: string, patch: Partial<TenantCreateInput>): MockTenant | undefined {
  const idx = tenants.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const updated: MockTenant = {
    ...tenants[idx],
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
    ...(patch.features !== undefined ? { features: patch.features } : {}),
    ...(patch.config !== undefined ? { config: patch.config } : {}),
  }
  tenants[idx] = updated
  return updated
}

export function deleteTenantRecord(id: string): boolean {
  const idx = tenants.findIndex((t) => t.id === id)
  if (idx === -1) return false
  tenants.splice(idx, 1)
  return true
}

export function queryTenants(opts?: { keyword?: string }): MockTenant[] {
  if (!opts?.keyword) return [...tenants]
  const kw = opts.keyword.toLowerCase()
  return tenants.filter((t) => t.name.toLowerCase().includes(kw))
}

// —— ch41：用户表（18 个） ——
const DEFAULT_USERS: User[] = [
  { id: 'u-001', username: 'admin@acme', displayName: 'SaaS 管理员', email: 'admin@acme.com', orgId: 'org-acme', roles: ['admin'], status: 'active', createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'u-002', username: 'technician@acme', displayName: '张检测', email: 'tech@acme.com', orgId: 'org-tech', roles: ['member'], status: 'active', createdAt: '2026-01-02T09:00:00Z', updatedAt: '2026-01-02T09:00:00Z' },
  { id: 'u-003', username: 'alice.chen@acme', displayName: '陈艾丽丝', email: 'alice@acme.com', orgId: 'org-fe', roles: ['admin'], status: 'active', createdAt: '2026-01-03T10:00:00Z', updatedAt: '2026-01-03T10:00:00Z' },
  { id: 'u-004', username: 'bob.wang@acme', displayName: '王大力', email: 'bob@acme.com', orgId: 'org-fe', roles: ['member'], status: 'active', createdAt: '2026-01-04T11:00:00Z', updatedAt: '2026-01-04T11:00:00Z' },
  { id: 'u-005', username: 'carol.li@acme', displayName: '李佳慧', email: 'carol@acme.com', orgId: 'org-sales', roles: ['manager'], status: 'active', createdAt: '2026-01-05T12:00:00Z', updatedAt: '2026-01-05T12:00:00Z' },
  { id: 'u-006', username: 'david.zhang@acme', displayName: '张明', email: 'david@acme.com', orgId: 'org-acme', roles: ['viewer'], status: 'pending', createdAt: '2026-01-06T13:00:00Z', updatedAt: '2026-01-06T13:00:00Z' },
  { id: 'u-007', username: 'manager@globex', displayName: 'Globex 经理', email: 'manager@globex.com', orgId: 'org-globex', roles: ['manager'], status: 'active', createdAt: '2026-01-02T08:00:00Z', updatedAt: '2026-01-02T08:00:00Z' },
  { id: 'u-008', username: 'guest@globex', displayName: '访客账户', email: 'guest@globex.com', orgId: 'org-globex', roles: ['viewer'], status: 'disabled', createdAt: '2026-01-03T09:00:00Z', updatedAt: '2026-01-03T09:00:00Z' },
  { id: 'u-009', username: 'eva.liu@globex', displayName: '刘伊娃', email: 'eva@globex.com', orgId: 'org-globex-tech', roles: ['admin'], status: 'active', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-01-04T10:00:00Z' },
  { id: 'u-010', username: 'admin@initech', displayName: 'Initech 管理员', email: 'admin@initech.com', orgId: 'org-acme', roles: ['admin'], status: 'active', createdAt: '2026-01-02T08:30:00Z', updatedAt: '2026-01-02T08:30:00Z' },
  { id: 'u-011', username: 'frank.gao@initech', displayName: '高福', email: 'frank@initech.com', orgId: 'org-acme', roles: ['member'], status: 'active', createdAt: '2026-01-03T09:30:00Z', updatedAt: '2026-01-03T09:30:00Z' },
  { id: 'u-012', username: 'admin@umbrella', displayName: 'Umbrella 管理员', email: 'admin@umbrella.com', orgId: 'org-acme', roles: ['admin'], status: 'active', createdAt: '2026-01-02T09:00:00Z', updatedAt: '2026-01-02T09:00:00Z' },
  { id: 'u-013', username: 'researcher@umbrella', displayName: '研究员A', email: 'researcher@umbrella.com', orgId: 'org-acme', roles: ['member'], status: 'active', createdAt: '2026-01-02T10:00:00Z', updatedAt: '2026-01-02T10:00:00Z' },
  { id: 'u-014', username: 'admin@weyland', displayName: 'Weyland 管理员', email: 'admin@weyland.com', orgId: 'org-acme', roles: ['admin'], status: 'active', createdAt: '2026-01-03T08:00:00Z', updatedAt: '2026-01-03T08:00:00Z' },
  { id: 'u-015', username: 'ops@cyberdyne', displayName: 'Cyberdyne 运维', email: 'ops@cyberdyne.com', orgId: 'org-acme', roles: ['member'], status: 'active', createdAt: '2026-01-04T08:00:00Z', updatedAt: '2026-01-04T08:00:00Z' },
  { id: 'u-016', username: 'super@buy', displayName: 'Buy n Large 超管', email: 'super@buy.com', orgId: 'org-acme', roles: ['admin'], status: 'active', createdAt: '2026-01-04T09:00:00Z', updatedAt: '2026-01-04T09:00:00Z' },
  { id: 'u-017', username: 'elena@no', displayName: '诺媒体编辑', email: 'elena@no.com', orgId: 'org-acme', roles: ['member'], status: 'active', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'u-018', username: 'admin@axiom', displayName: 'Axiom 管理员', email: 'admin@axiom.com', orgId: 'org-acme', roles: ['admin'], status: 'active', createdAt: '2026-01-05T11:00:00Z', updatedAt: '2026-01-05T11:00:00Z' },
]

let users: User[] = [...DEFAULT_USERS]

function resetUsers() {
  users = [...DEFAULT_USERS]
}

function now(): string {
  return new Date().toISOString()
}

export function insertUser(
  input: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<User, 'id'>>,
): User {
  const user: User = {
    ...input,
    id: input.id ?? genId('u'),
    status: input.status ?? 'active',
    createdAt: now(),
    updatedAt: now(),
  }
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
  orgId?: string
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
  if (opts.orgId) {
    filtered = filtered.filter((u) => u.orgId === opts.orgId)
  }
  filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const total = filtered.length
  const start = (opts.page - 1) * opts.pageSize
  return {
    items: filtered.slice(start, start + opts.pageSize),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  }
}

// —— ch41：组织树（固定 mock） ——
const DEFAULT_ORG_TREE: OrgNode = {
  id: 'org-root',
  name: 'ACME 集团',
  children: [
    {
      id: 'org-acme',
      name: 'ACME 总部',
      children: [
        { id: 'org-tech', name: '技术部', children: [{ id: 'org-fe', name: '前端组' }] },
        { id: 'org-sales', name: '销售部' },
      ],
    },
    {
      id: 'org-globex',
      name: 'Globex 分部',
      children: [{ id: 'org-globex-tech', name: 'Globex 技术部' }],
    },
  ],
}

let orgTree: OrgNode = DEFAULT_ORG_TREE

function resetOrgs() {
  orgTree = DEFAULT_ORG_TREE
}

export function findOrgNode(id: string): OrgNode | undefined {
  const search = (node: OrgNode): OrgNode | undefined => {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = search(child)
        if (found) return found
      }
    }
    return undefined
  }
  return search(orgTree)
}

export function getOrgTree(): OrgNode {
  return orgTree
}

// —— 终批：orgs CRUD（ch41，与 React 姊妹仓 msw/handlers.ts 对齐）——
export function insertOrgNode(parentId: string, name: string): OrgNode | undefined {
  const parent = findOrgNode(parentId)
  if (!parent) return undefined
  if (!parent.children) parent.children = []
  const node: OrgNode = {
    id: `org-${Math.random().toString(36).slice(2, 10)}`,
    name,
    children: [],
  }
  parent.children.push(node)
  return node
}

export function updateOrgNodeRecord(id: string, name: string): OrgNode | undefined {
  const node = findOrgNode(id)
  if (!node) return undefined
  node.name = name
  return node
}

export function deleteOrgNodeRecord(id: string): boolean {
  if (id === 'org-root') return false
  const remove = (node: OrgNode): boolean => {
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
  return remove(orgTree)
}

// —— ch41：审计日志表（20 条） ——
const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-001', action: 'login', operator: 'admin@acme', resource: 'auth', resourceId: 'u-001', ip: '192.168.1.1', detail: '管理员登录', timestamp: '2026-01-01T10:00:00Z' },
  { id: 'log-002', action: 'create', operator: 'admin@acme', resource: 'user', resourceId: 'u-002', ip: '192.168.1.1', detail: '新建用户 technician@acme', timestamp: '2026-01-01T11:00:00Z' },
  { id: 'log-003', action: 'login', operator: 'technician@acme', resource: 'auth', resourceId: 'u-002', ip: '10.0.0.5', detail: '检测员登录', timestamp: '2026-01-01T12:00:00Z' },
  { id: 'log-004', action: 'permission_change', operator: 'admin@acme', resource: 'role', resourceId: 'role-viewer', ip: '192.168.1.1', detail: '修改 viewer 角色权限', timestamp: '2026-01-01T13:00:00Z' },
  { id: 'log-005', action: 'delete', operator: 'admin@globex', resource: 'user', resourceId: 'u-003', ip: '10.0.0.9', detail: '删除用户 guest@globex', timestamp: '2026-01-01T14:00:00Z' },
  { id: 'log-006', action: 'update', operator: 'admin@globex', resource: 'user', resourceId: 'u-004', ip: '10.0.0.9', detail: '更新用户 manager@globex 角色为 manager', timestamp: '2026-01-02T09:15:00Z' },
  { id: 'log-007', action: 'login', operator: 'manager@initech', resource: 'auth', resourceId: 'u-005', ip: '172.16.0.8', detail: '经理登录', timestamp: '2026-01-02T10:30:00Z' },
  { id: 'log-008', action: 'create', operator: 'admin@umbrella', resource: 'user', resourceId: 'u-006', ip: '10.20.30.1', detail: '新建用户 researcher@umbrella', timestamp: '2026-01-02T14:22:00Z' },
  { id: 'log-009', action: 'permission_change', operator: 'admin@umbrella', resource: 'role', resourceId: 'role-researcher', ip: '10.20.30.1', detail: '新建 researcher 角色并授权', timestamp: '2026-01-02T15:05:00Z' },
  { id: 'log-010', action: 'login', operator: 'viewer@tyrell', resource: 'auth', resourceId: 'u-007', ip: '192.168.50.1', detail: '只读用户登录', timestamp: '2026-01-03T08:00:00Z' },
  { id: 'log-011', action: 'update', operator: 'admin@massive', resource: 'user', resourceId: 'u-008', ip: '172.20.0.15', detail: '禁用违规用户 spam@massive', timestamp: '2026-01-03T11:40:00Z' },
  { id: 'log-012', action: 'login', operator: 'admin@weyland', resource: 'auth', resourceId: 'u-009', ip: '10.100.0.1', detail: 'Weyland 管理员登录', timestamp: '2026-01-03T13:20:00Z' },
  { id: 'log-013', action: 'create', operator: 'admin@weyland', resource: 'user', resourceId: 'u-010', ip: '10.100.0.1', detail: '批量导入 20 名航天工程师', timestamp: '2026-01-03T14:00:00Z' },
  { id: 'log-014', action: 'permission_change', operator: 'admin@cyberdyne', resource: 'role', resourceId: 'role-ops', ip: '172.30.0.5', detail: '更新 ops 角色权限，移除 user:delete', timestamp: '2026-01-04T09:00:00Z' },
  { id: 'log-015', action: 'logout', operator: 'technician@acme', resource: 'auth', resourceId: 'u-002', ip: '10.0.0.5', detail: '检测员登出', timestamp: '2026-01-04T17:30:00Z' },
  { id: 'log-016', action: 'create', operator: 'admin@buy', resource: 'user', resourceId: 'u-011', ip: '10.50.0.20', detail: '新建超级管理员 super@buy', timestamp: '2026-01-04T09:00:00Z' },
  { id: 'log-017', action: 'update', operator: 'admin@no', resource: 'user', resourceId: 'u-012', ip: '172.18.0.99', detail: '更新媒体编辑 elena@no 的组织归属', timestamp: '2026-01-05T10:15:00Z' },
  { id: 'log-018', action: 'login', operator: 'admin@axiom', resource: 'auth', resourceId: 'u-013', ip: '10.80.0.1', detail: '航运平台管理员登录', timestamp: '2026-01-05T11:00:00Z' },
  { id: 'log-019', action: 'permission_change', operator: 'admin@axiom', resource: 'role', resourceId: 'role-fleet', ip: '10.80.0.1', detail: '新建 fleet-manager 角色授权船队管理权限', timestamp: '2026-01-05T11:30:00Z' },
  { id: 'log-020', action: 'delete', operator: 'admin@initech', resource: 'user', resourceId: 'u-014', ip: '172.16.0.8', detail: '删除离职员工 ex@initech', timestamp: '2026-01-05T16:45:00Z' },
]

let auditLogs: AuditLog[] = [...DEFAULT_AUDIT_LOGS]

function resetAuditLogs() {
  auditLogs = [...DEFAULT_AUDIT_LOGS]
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
    filtered = filtered.filter((l) => l.timestamp >= opts.startDate!)
  }
  if (opts.endDate) {
    filtered = filtered.filter((l) => l.timestamp <= opts.endDate!)
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
  // 倒序
  filtered.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
  const total = filtered.length
  const start = (opts.page - 1) * opts.pageSize
  return {
    items: filtered.slice(start, start + opts.pageSize),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  }
}

// —— ch40：角色管理（与 React 仓一致，精简到与本仓 RBAC 模块所需）——
export interface RoleCreateInput {
  name: string
  permissions: string[]
  menuPermissions?: { menuId: string; actions: string[] }[]
}

const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: 'admin',
    permissions: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write', 'audit:read'],
    menuPermissions: [],
  },
  {
    id: 'role-viewer',
    name: 'viewer',
    permissions: ['user:read', 'org:read'],
    menuPermissions: [],
  },
  {
    id: 'role-manager',
    name: 'manager',
    permissions: ['user:read', 'user:create', 'user:update', 'org:read', 'org:write'],
    menuPermissions: [],
  },
  {
    id: 'role-auditor',
    name: 'auditor',
    permissions: ['user:read', 'org:read', 'audit:read'],
    menuPermissions: [],
  },
]

let roles: Role[] = [...DEFAULT_ROLES]

function resetRoles() {
  roles = [...DEFAULT_ROLES]
}

export function listRoles(): Role[] {
  return [...roles]
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

// —— ch42：应用管理 + 菜单管理（与 React 姊妹仓 msw/db.ts 字段对齐）——
const DEFAULT_APPS: App[] = [
  {
    id: 'app-console',
    name: 'IAM 控制台',
    code: 'iam-console',
    description: '统一身份管理后台',
    theme: '#2563eb',
    sort: 1,
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'app-portal',
    name: '员工自助门户',
    code: 'employee-portal',
    description: '员工查岗/请假/资料维护',
    theme: '#059669',
    sort: 2,
    enabled: true,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'app-tenant',
    name: '租户运营',
    code: 'tenant-ops',
    description: '面向平台运营的租户管理',
    theme: '#7c3aed',
    sort: 3,
    enabled: true,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
]

const DEFAULT_MENUS: MenuItem[] = [
  { id: 'm-console-users',  name: '用户管理', path: '/users',   icon: 'users',  appId: 'app-console', parentId: null, sort: 1, enabled: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'm-console-orgs',   name: '组织架构', path: '/org',     icon: 'org',    appId: 'app-console', parentId: null, sort: 2, enabled: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'm-console-roles',  name: '角色权限', path: '/roles',   icon: 'shield', appId: 'app-console', parentId: null, sort: 3, enabled: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'm-console-audit',  name: '审计日志', path: '/audit',   icon: 'log',    appId: 'app-console', parentId: null, sort: 4, enabled: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'm-portal-profile', name: '我的资料', path: '/profile', icon: 'user',   appId: 'app-portal',  parentId: null, sort: 1, enabled: true, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
  { id: 'm-portal-leave',   name: '请假申请', path: '/leave',   icon: 'cal',    appId: 'app-portal',  parentId: null, sort: 2, enabled: true, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
  { id: 'm-tenant-list',    name: '租户列表', path: '/tenants', icon: 'building', appId: 'app-tenant', parentId: null, sort: 1, enabled: true, createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' },
  { id: 'm-tenant-bill',    name: '账单',     path: '/billing', icon: 'card',  appId: 'app-tenant',  parentId: null, sort: 2, enabled: true, createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' },
]

let apps: App[] = [...DEFAULT_APPS]
let menus: MenuItem[] = [...DEFAULT_MENUS]

function resetApps() {
  apps = [...DEFAULT_APPS]
}
function resetMenus() {
  menus = [...DEFAULT_MENUS]
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
  const now = new Date().toISOString()
  const app: App = { ...input, id: genId('app'), createdAt: now, updatedAt: now }
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
  // 删应用时一并清掉旗下菜单（与 React 姊妹仓一致）
  menus = menus.filter((m) => m.appId !== id)
  apps.splice(idx, 1)
  return true
}

export function listMenus(appId?: string): MenuItem[] {
  const list = appId ? menus.filter((m) => m.appId === appId) : [...menus]
  return list.sort((a, b) => a.sort - b.sort)
}

export function findMenu(id: string): MenuItem | undefined {
  return menus.find((m) => m.id === id)
}

export function insertMenu(input: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): MenuItem {
  const now = new Date().toISOString()
  const menu: MenuItem = { ...input, id: genId('m'), createdAt: now, updatedAt: now }
  menus.push(menu)
  return menu
}

export function updateMenuRecord(
  id: string,
  patch: Partial<Omit<MenuItem, 'id' | 'createdAt' | 'appId'>>,
): MenuItem | undefined {
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

// —— ch42：岗位 / 用户组 / 权限组（与 React 姊妹仓 msw/db.ts 字段对齐）——

const DEFAULT_POSITIONS: Position[] = [
  { id: 'pos-dev',  name: '研发工程师', code: 'developer', description: '产品研发',     sort: 1, enabled: true, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'pos-pm',   name: '产品经理',   code: 'product-manager', description: '产品规划', sort: 2, enabled: true, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'pos-ops',  name: '运营',       code: 'operations', description: '日常运营',       sort: 3, enabled: true, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'pos-hr',   name: 'HR',         code: 'hr', description: '人力资源',               sort: 4, enabled: true, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'pos-fin',  name: '财务',       code: 'finance', description: '财务核算',             sort: 5, enabled: true, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
]

const DEFAULT_USER_GROUPS: UserGroup[] = [
  { id: 'ug-all',  name: '全体员工',   description: '默认全员组', memberCount: 120, enabled: true, createdAt: '2026-02-02T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' },
  { id: 'ug-rd',   name: '研发组',     description: '研发部',     memberCount: 45,  enabled: true, createdAt: '2026-02-02T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' },
  { id: 'ug-pm',   name: '产品组',     description: '产品部',     memberCount: 12,  enabled: true, createdAt: '2026-02-02T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' },
  { id: 'ug-ops',  name: '运营组',     description: '运营部',     memberCount: 18,  enabled: true, createdAt: '2026-02-02T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' },
  { id: 'ug-vip',  name: 'VIP 用户',   description: '高价值客户', memberCount: 5,   enabled: false, createdAt: '2026-02-02T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' },
]

const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  { id: 'pg-admin',  name: '系统管理员', code: 'system-admin',  description: '全部权限', permissions: ['*'], menuIds: [], sort: 1, enabled: true, createdAt: '2026-02-03T00:00:00.000Z', updatedAt: '2026-02-03T00:00:00.000Z' },
  { id: 'pg-audit',  name: '审计员',     code: 'auditor',       description: '只读审计', permissions: ['user:read', 'org:read', 'audit:read'], menuIds: ['m-console-audit'], sort: 2, enabled: true, createdAt: '2026-02-03T00:00:00.000Z', updatedAt: '2026-02-03T00:00:00.000Z' },
  { id: 'pg-rw',     name: '读写用户',   code: 'read-write',    description: 'CRUD 不含删', permissions: ['user:read', 'user:write', 'org:read', 'org:write'], menuIds: ['m-console-users', 'm-console-orgs'], sort: 3, enabled: true, createdAt: '2026-02-03T00:00:00.000Z', updatedAt: '2026-02-03T00:00:00.000Z' },
  { id: 'pg-ro',     name: '只读用户',   code: 'read-only',     description: '只读',     permissions: ['user:read', 'org:read'], menuIds: [], sort: 4, enabled: true, createdAt: '2026-02-03T00:00:00.000Z', updatedAt: '2026-02-03T00:00:00.000Z' },
]

let positions: Position[] = [...DEFAULT_POSITIONS]
let userGroups: UserGroup[] = [...DEFAULT_USER_GROUPS]
let permissionGroups: PermissionGroup[] = [...DEFAULT_PERMISSION_GROUPS]

function resetPositions() { positions = [...DEFAULT_POSITIONS] }
function resetUserGroups() { userGroups = [...DEFAULT_USER_GROUPS] }
function resetPermissionGroups() { permissionGroups = [...DEFAULT_PERMISSION_GROUPS] }

// —— 岗位 CRUD ——
export function listPositions(): Position[] { return [...positions].sort((a, b) => a.sort - b.sort) }
export function findPosition(id: string): Position | undefined { return positions.find((p) => p.id === id) }
export function insertPosition(input: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Position {
  const now = new Date().toISOString()
  const p: Position = { ...input, id: genId('pos'), createdAt: now, updatedAt: now }
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

// —— 用户组 CRUD ——
export function listUserGroups(): UserGroup[] { return [...userGroups].sort((a, b) => a.id.localeCompare(b.id)) }
export function findUserGroup(id: string): UserGroup | undefined { return userGroups.find((g) => g.id === id) }
export function insertUserGroup(input: Omit<UserGroup, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>): UserGroup {
  const now = new Date().toISOString()
  const g: UserGroup = { ...input, id: genId('ug'), memberCount: 0, createdAt: now, updatedAt: now }
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

// —— 权限组 CRUD ——
export function listPermissionGroups(): PermissionGroup[] { return [...permissionGroups] }
export function findPermissionGroup(id: string): PermissionGroup | undefined { return permissionGroups.find((p) => p.id === id) }
export function insertPermissionGroup(input: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>): PermissionGroup {
  const now = new Date().toISOString()
  const p: PermissionGroup = { ...input, id: genId('pg'), createdAt: now, updatedAt: now }
  permissionGroups.push(p)
  return p
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

// —— ch40：登录方式 / SSO / OAuth2 / Token / API Key（与 React 姊妹仓 msw/db.ts 字段对齐）——

const DEFAULT_LOGIN_METHODS: LoginMethod[] = [
  { id: 'lm-password',  method: 'password',   name: '账密登录', description: '用户名 + 密码',   enabled: true,  sort: 1 },
  { id: 'lm-email',     method: 'email_code', name: '邮箱验证码', description: '邮件发送一次性码', enabled: true,  sort: 2 },
  { id: 'lm-sms',       method: 'sms_code',   name: '短信验证码', description: '短信发送一次性码', enabled: true,  sort: 3 },
  { id: 'lm-totp',      method: 'totp',       name: 'TOTP',     description: '动态口令(Google Authenticator)', enabled: false, sort: 4 },
  { id: 'lm-sso',       method: 'sso',        name: 'SSO 单点', description: 'OIDC / SAML',     enabled: true,  sort: 5 },
  { id: 'lm-oauth',     method: 'oauth2',     name: '第三方登录', description: 'Google / GitHub / 微信 / 钉钉 / 飞书', enabled: true, sort: 6 },
]

const DEFAULT_SSO_PROVIDERS: SsoProvider[] = [
  { id: 'sso-okta',  name: 'Okta',  type: 'oidc', clientId: 'okta-client',  issuerUrl: 'https://example.okta.com', enabled: true },
  { id: 'sso-azure', name: 'Azure AD', type: 'saml', clientId: 'azure-client', issuerUrl: 'https://sts.windows.net', enabled: false },
]

const DEFAULT_OAUTH2_PROVIDERS: OAuth2Provider[] = [
  { id: 'oa-google',  name: 'Google',  provider: 'google',  clientId: 'google-client',  enabled: true },
  { id: 'oa-github',  name: 'GitHub',  provider: 'github',  clientId: 'github-client',  enabled: true },
  { id: 'oa-wechat',  name: '微信',    provider: 'wechat',  clientId: 'wechat-appid',    enabled: false },
  { id: 'oa-ding',    name: '钉钉',    provider: 'dingtalk', clientId: 'ding-appid',     enabled: false },
]

const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  id: 'token-default',
  accessTokenTtl: 3600,           // 1h
  refreshTokenTtl: 60 * 60 * 24 * 7, // 7d
  refreshTokenEnabled: true,
  tokenRevocationEnabled: true,
}

const DEFAULT_API_KEYS: ApiKey[] = [
  { id: 'ak-ci-1',     name: 'CI 流水线',  keyPrefix: 'ak_ci_xxx',  scopes: ['user:read', 'audit:read'], expiresAt: '2027-01-01T00:00:00.000Z', enabled: true, createdAt: '2026-03-01T00:00:00.000Z', lastUsedAt: '2026-07-01T00:00:00.000Z' },
  { id: 'ak-monitor',  name: '监控系统',  keyPrefix: 'ak_mon_xxx', scopes: ['audit:read'],                expiresAt: '2026-12-31T00:00:00.000Z', enabled: true, createdAt: '2026-03-15T00:00:00.000Z', lastUsedAt: '2026-07-05T00:00:00.000Z' },
  { id: 'ak-legacy',   name: '旧集成 (已禁用)', keyPrefix: 'ak_old_xxx', scopes: ['user:read'],          enabled: false, createdAt: '2025-06-01T00:00:00.000Z' },
]

let loginMethods: LoginMethod[] = [...DEFAULT_LOGIN_METHODS]
let ssoProviders: SsoProvider[] = [...DEFAULT_SSO_PROVIDERS]
let oauth2Providers: OAuth2Provider[] = [...DEFAULT_OAUTH2_PROVIDERS]
let tokenConfig: TokenConfig = { ...DEFAULT_TOKEN_CONFIG }
let apiKeys: ApiKey[] = [...DEFAULT_API_KEYS]

function resetLoginMethods() { loginMethods = [...DEFAULT_LOGIN_METHODS] }
function resetSsoProviders() { ssoProviders = [...DEFAULT_SSO_PROVIDERS] }
function resetOAuth2Providers() { oauth2Providers = [...DEFAULT_OAUTH2_PROVIDERS] }
function resetTokenConfig() { tokenConfig = { ...DEFAULT_TOKEN_CONFIG } }
function resetApiKeys() { apiKeys = [...DEFAULT_API_KEYS] }

// —— 登录方式 ——
export function listLoginMethods(): LoginMethod[] { return [...loginMethods].sort((a, b) => a.sort - b.sort) }
export function findLoginMethod(id: string): LoginMethod | undefined { return loginMethods.find((m) => m.id === id) }
export function updateLoginMethodRecord(id: string, patch: Partial<Omit<LoginMethod, 'id' | 'method'>>): LoginMethod | undefined {
  const idx = loginMethods.findIndex((m) => m.id === id)
  if (idx === -1) return undefined
  loginMethods[idx] = { ...loginMethods[idx], ...patch, id }
  return loginMethods[idx]
}

// —— SSO Provider ——
export function listSsoProviders(): SsoProvider[] { return [...ssoProviders] }
export function findSsoProvider(id: string): SsoProvider | undefined { return ssoProviders.find((p) => p.id === id) }
export function updateSsoProviderRecord(id: string, patch: Partial<Omit<SsoProvider, 'id'>>): SsoProvider | undefined {
  const idx = ssoProviders.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  ssoProviders[idx] = { ...ssoProviders[idx], ...patch, id }
  return ssoProviders[idx]
}

// —— OAuth2 Provider ——
export function listOAuth2Providers(): OAuth2Provider[] { return [...oauth2Providers] }
export function findOAuth2Provider(id: string): OAuth2Provider | undefined { return oauth2Providers.find((p) => p.id === id) }
export function updateOAuth2ProviderRecord(id: string, patch: Partial<Omit<OAuth2Provider, 'id'>>): OAuth2Provider | undefined {
  const idx = oauth2Providers.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  oauth2Providers[idx] = { ...oauth2Providers[idx], ...patch, id }
  return oauth2Providers[idx]
}

// —— Token Config（单例）——
export function getTokenConfig(): TokenConfig { return { ...tokenConfig } }
export function updateTokenConfigRecord(patch: Partial<Omit<TokenConfig, 'id'>>): TokenConfig {
  tokenConfig = { ...tokenConfig, ...patch, id: 'token-default' }
  return { ...tokenConfig }
}

// —— API Key ——
export function listApiKeys(): ApiKey[] { return [...apiKeys] }
export function findApiKey(id: string): ApiKey | undefined { return apiKeys.find((k) => k.id === id) }
export function insertApiKey(input: { name: string; scopes?: string[]; expiresAt?: string }): ApiKey {
  const now = new Date().toISOString()
  const k: ApiKey = {
    id: genId('ak'),
    name: input.name,
    keyPrefix: `ak_${Math.random().toString(36).slice(2, 8)}_xxx`,
    scopes: input.scopes ?? [],
    expiresAt: input.expiresAt,
    enabled: true,
    createdAt: now,
  }
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

// —— ch41-42：登录安全 / 密码策略 / 风险控制 / 消息通知 / 开放平台（单例配置）——

const DEFAULT_LOGIN_SECURITY: LoginSecurity = {
  id: 'login-security-default',
  ipWhitelist: [],
  ipBlacklist: [],
  regionRestrictionEnabled: false,
  allowedRegions: ['CN', 'US'],
  failedAttemptLockEnabled: true,
  lockThreshold: 5,
  lockDuration: 900, // 15 min
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  id: 'password-policy-default',
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: false,
  expireDays: 90,
  historyCount: 5,
  enabled: true,
}

const DEFAULT_RISK_CONTROL: RiskControl = {
  id: 'risk-control-default',
  anomalyDetectionEnabled: true,
  crossRegionAlertEnabled: true,
  deviceFingerprintEnabled: false,
  riskScoreThreshold: 70,
}

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  id: 'notification-config-default',
  emailEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  notifyOn: ['login', 'password_change', 'security_alert'],
}

const DEFAULT_OPEN_PLATFORM_CONFIG: OpenPlatformConfig = {
  id: 'open-platform-default',
  apiEnabled: true,
  webhookEnabled: true,
  sdkEnabled: false,
  openScopes: ['user:read', 'org:read'],
  callbackWhitelist: [],
}

let loginSecurity: LoginSecurity = { ...DEFAULT_LOGIN_SECURITY }
let passwordPolicy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY }
let riskControl: RiskControl = { ...DEFAULT_RISK_CONTROL }
let notificationConfig: NotificationConfig = { ...DEFAULT_NOTIFICATION_CONFIG }
let openPlatformConfig: OpenPlatformConfig = { ...DEFAULT_OPEN_PLATFORM_CONFIG }

function resetLoginSecurity() { loginSecurity = { ...DEFAULT_LOGIN_SECURITY } }
function resetPasswordPolicy() { passwordPolicy = { ...DEFAULT_PASSWORD_POLICY } }
function resetRiskControl() { riskControl = { ...DEFAULT_RISK_CONTROL } }
function resetNotificationConfig() { notificationConfig = { ...DEFAULT_NOTIFICATION_CONFIG } }
function resetOpenPlatformConfig() { openPlatformConfig = { ...DEFAULT_OPEN_PLATFORM_CONFIG } }

// 单例 GET + PUT
export function getLoginSecurity(): LoginSecurity { return { ...loginSecurity } }
export function updateLoginSecurityRecord(patch: Partial<Omit<LoginSecurity, 'id'>>): LoginSecurity {
  loginSecurity = { ...loginSecurity, ...patch, id: 'login-security-default' }
  return { ...loginSecurity }
}

export function getPasswordPolicy(): PasswordPolicy { return { ...passwordPolicy } }
export function updatePasswordPolicyRecord(patch: Partial<Omit<PasswordPolicy, 'id'>>): PasswordPolicy {
  passwordPolicy = { ...passwordPolicy, ...patch, id: 'password-policy-default' }
  return { ...passwordPolicy }
}

export function getRiskControl(): RiskControl { return { ...riskControl } }
export function updateRiskControlRecord(patch: Partial<Omit<RiskControl, 'id'>>): RiskControl {
  riskControl = { ...riskControl, ...patch, id: 'risk-control-default' }
  return { ...riskControl }
}

export function getNotificationConfig(): NotificationConfig { return { ...notificationConfig } }
export function updateNotificationConfigRecord(patch: Partial<Omit<NotificationConfig, 'id'>>): NotificationConfig {
  notificationConfig = { ...notificationConfig, ...patch, id: 'notification-config-default' }
  return { ...notificationConfig }
}

export function getOpenPlatformConfig(): OpenPlatformConfig { return { ...openPlatformConfig } }
export function updateOpenPlatformConfigRecord(patch: Partial<Omit<OpenPlatformConfig, 'id'>>): OpenPlatformConfig {
  openPlatformConfig = { ...openPlatformConfig, ...patch, id: 'open-platform-default' }
  return { ...openPlatformConfig }
}

// 模块加载时初始化 mock 数据（供测试隔离使用）
resetMockDb()
