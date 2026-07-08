// Mock 内存数据库：仅 mock 层使用，测试间隔离由 tests/setup.ts 的 resetMockDb 保证。
// ch39：租户数据；ch40 追加角色；ch41 追加 userTable/orgTree/auditLogTable（只增）。
// 与 React 双栈仓 msw/db.ts 中 ch39-42 涉及的数据保持一致（租户/用户/组织/审计/角色）。

import type { User, OrgNode, AuditLog } from '../src/types/user'
import type { Role } from '../src/types/rbac'

/** 通用重置入口 */
export function resetMockDb() {
  resetTenants()
  resetUsers()
  resetOrgs()
  resetAuditLogs()
  resetRoles()
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

// 模块加载时初始化 mock 数据（供测试隔离使用）
resetMockDb()
