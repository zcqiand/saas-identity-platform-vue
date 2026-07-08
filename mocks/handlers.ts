import { http, HttpResponse } from 'msw'
import {
  findTenant,
  type MockTenant,
  insertTenant,
  updateTenantRecord,
  deleteTenantRecord,
  queryTenants,
  listRoles,
  insertRole,
  updateRoleRecord,
  deleteRoleRecord,
  insertUser,
  findUserById,
  updateUserRecord,
  deleteUserRecord,
  queryUsers,
  getOrgTree,
  queryAuditLogs,
  listApps,
  findApp,
  insertApp,
  updateAppRecord,
  deleteAppRecord,
  listMenus,
  findMenu,
  insertMenu,
  updateMenuRecord,
  deleteMenuRecord,
  listPositions,
  findPosition,
  insertPosition,
  updatePositionRecord,
  deletePositionRecord,
  listUserGroups,
  findUserGroup,
  insertUserGroup,
  updateUserGroupRecord,
  deleteUserGroupRecord,
  listPermissionGroups,
  findPermissionGroup,
  insertPermissionGroup,
  updatePermissionGroupRecord,
  deletePermissionGroupRecord,
  listLoginMethods,
  updateLoginMethodRecord,
  listSsoProviders,
  updateSsoProviderRecord,
  listOAuth2Providers,
  updateOAuth2ProviderRecord,
  getTokenConfig,
  updateTokenConfigRecord,
  listApiKeys,
  findApiKey,
  insertApiKey,
  updateApiKeyRecord,
  deleteApiKeyRecord,
  getLoginSecurity,
  updateLoginSecurityRecord,
  insertOrgNode,
  updateOrgNodeRecord,
  deleteOrgNodeRecord,
  getPasswordPolicy,
  updatePasswordPolicyRecord,
  getRiskControl,
  updateRiskControlRecord,
  getNotificationConfig,
  updateNotificationConfigRecord,
  getOpenPlatformConfig,
  updateOpenPlatformConfigRecord,
} from './db'
import { signJwt, verifyJwt } from './jwt'
import type { Role } from '../src/types/rbac'
import type { UserCreateInput, UserUpdateInput, User } from '../src/types/user'
import type {
  AppCreateInput,
  MenuCreateInput,
  MenuUpdateInput,
  AppUpdateInput,
} from '../src/types/app'
import type {
  PositionCreateInput,
  PositionUpdateInput,
  UserGroupCreateInput,
  UserGroupUpdateInput,
  PermissionGroupCreateInput,
  PermissionGroupUpdateInput,
} from '../src/types/org'
import type {
  LoginMethodUpdateInput,
  SsoProviderUpdateInput,
  OAuth2ProviderUpdateInput,
  TokenConfigUpdateInput,
  ApiKeyCreateInput,
  ApiKeyUpdateInput,
  LoginSecurityUpdateInput,
  PasswordPolicyUpdateInput,
  RiskControlUpdateInput,
  NotificationConfigUpdateInput,
  OpenPlatformConfigUpdateInput,
} from '../src/types/security'

// MSW handler 注册表（ch39-42 focus）。
// ch39：/tenants GET 列表 + /tenants/:id GET 单个。
// ch40：追加 SSO/OAuth 授权服务器 + auth/permissions + auth/me（只增不改）。
// ch41：追加 users/orgs/audit-logs。
// 路由与响应 shape 与 React 双栈仓完全一致。
export const handlers = [
  // —— ch39：租户 ——
  http.get('*/tenants/:id', ({ params }) => {
    const tenant = findTenant(String(params.id))
    if (!tenant) {
      return HttpResponse.json({ message: '租户不存在' }, { status: 404 })
    }
    return HttpResponse.json(tenant as MockTenant)
  }),

  // —— ch40：SSO 授权服务器（mock IdP）——
  http.get('*/sso/authorize', ({ request }) => {
    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const redirectUri = url.searchParams.get('redirect_uri')
    const state = url.searchParams.get('state')
    if (!clientId || !redirectUri) {
      return HttpResponse.json({ message: '缺少 client_id 或 redirect_uri' }, { status: 400 })
    }
    // mock 签发授权码
    const code = `mock-auth-code-${Date.now()}`
    const callbackUrl = `${redirectUri}?code=${code}&state=${state ?? ''}`
    return new HttpResponse(null, {
      status: 302,
      headers: { Location: callbackUrl },
    })
  }),

  // —— ch40：OAuth 回调换 token ——
  http.post('*/auth/oauth/callback', async ({ request }) => {
    const body = (await request.json()) as { code: string; provider?: string }
    if (!body.code || body.code === 'bad-code') {
      return HttpResponse.json({ message: '无效授权码' }, { status: 401 })
    }
    // mock 用户：固定返回 admin@acme
    const token = signJwt({
      sub: 'u-001',
      username: 'admin@acme',
      orgId: 'org-acme',
      roles: ['admin'],
      permissions: ['user:read', 'user:create', 'user:delete', 'org:read', 'org:write'],
    })
    return HttpResponse.json({
      token,
      user: {
        id: 'u-001',
        username: 'admin@acme',
        displayName: 'SaaS 管理员',
        orgId: 'org-acme',
      },
    })
  }),

  // —— ch40：按组织返回权限集 ——
  http.get('*/auth/permissions', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ message: '未授权' }, { status: 401 })
    }
    const url = new URL(request.url)
    const orgId = url.searchParams.get('orgId') ?? 'org-acme'

    const acmeRoles: Role[] = [
      { id: 'role-admin', name: 'admin', permissions: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write'], menuPermissions: [] },
    ]
    const globexRoles: Role[] = [
      { id: 'role-viewer', name: 'viewer', permissions: ['user:read', 'org:read'], menuPermissions: [] },
    ]

    const roles = orgId === 'org-globex' ? globexRoles : acmeRoles
    const permissions = roles.flatMap((r) => r.permissions)
    return HttpResponse.json({ roles, permissions })
  }),

  // —— ch40：当前用户 ——
  http.get('*/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ message: '未授权' }, { status: 401 })
    }
    const token = auth.slice(7)
    const payload = verifyJwt(token)
    if (!payload) {
      return HttpResponse.json({ message: 'token 无效或已过期' }, { status: 401 })
    }
    return HttpResponse.json({
      user: {
        id: payload.sub,
        username: payload.username,
        displayName: 'SaaS 管理员',
        orgId: payload.orgId,
      },
    })
  }),

  // —— ch41：users CRUD ——
  http.get('*/users', ({ request }) => {
    const url = new URL(request.url)
    const result = queryUsers({
      page: Number(url.searchParams.get('page') ?? '1'),
      pageSize: Number(url.searchParams.get('pageSize') ?? '10'),
      keyword: url.searchParams.get('keyword') ?? undefined,
      role: url.searchParams.get('role') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      orgId: url.searchParams.get('orgId') ?? undefined,
    })
    return HttpResponse.json(result)
  }),

  http.post('*/users', async ({ request }) => {
    const body = (await request.json()) as Partial<UserCreateInput>
    if (!body.username || !body.displayName || !body.email || !body.orgId || !body.roles) {
      return HttpResponse.json({ message: 'username/displayName/email/orgId/roles 必填' }, { status: 400 })
    }
    const created = insertUser({
      username: body.username,
      displayName: body.displayName,
      email: body.email,
      orgId: body.orgId,
      roles: body.roles,
      status: body.status ?? 'active',
    })
    return HttpResponse.json(created as User, { status: 201 })
  }),

  http.get('*/users/:id', ({ params }) => {
    const found = findUserById(String(params.id))
    if (!found) return HttpResponse.json({ message: '用户不存在' }, { status: 404 })
    return HttpResponse.json(found)
  }),

  http.put('*/users/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as UserUpdateInput
    const updated = updateUserRecord(id, body)
    if (!updated) return HttpResponse.json({ message: '用户不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.delete('*/users/:id', ({ params }) => {
    const ok = deleteUserRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '用户不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // —— ch41：orgs 组织树 ——
  http.get('*/orgs', () => {
    return HttpResponse.json(getOrgTree())
  }),

  // —— ch41：audit-logs 审计日志 ——
  http.get('*/audit-logs', ({ request }) => {
    const url = new URL(request.url)
    const result = queryAuditLogs({
      page: Number(url.searchParams.get('page') ?? '1'),
      pageSize: Number(url.searchParams.get('pageSize') ?? '20'),
      action: url.searchParams.get('action') ?? undefined,
      operator: url.searchParams.get('operator') ?? undefined,
      ip: url.searchParams.get('ip') ?? undefined,
    })
    return HttpResponse.json(result)
  }),

  // —— ch42：错误/web-vitals 上报接收（mock）——
  http.post('*/api/vitals', () => {
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('*/vitals', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // —— 平台租户管理 CRUD（ch39 列表/详情已含；此处补增改删）——
  http.get('*/tenants', ({ request }) => {
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword') ?? undefined
    return HttpResponse.json(queryTenants({ keyword }))
  }),

  http.post('*/tenants', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      theme: { primary: string; sidebar: string; logoText: string }
      features?: string[]
      config?: { maxUsers?: number }
    }
    if (!body.name || !body.theme) {
      return HttpResponse.json({ message: 'name 和 theme 必填' }, { status: 400 })
    }
    const created = insertTenant(body)
    return HttpResponse.json(created as MockTenant, { status: 201 })
  }),

  http.put('*/tenants/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as Partial<{
      name: string
      theme: { primary: string; sidebar: string; logoText: string }
      features: string[]
      config: { maxUsers: number }
    }>
    const updated = updateTenantRecord(id, body)
    if (!updated) return HttpResponse.json({ message: '租户不存在' }, { status: 404 })
    return HttpResponse.json(updated as MockTenant)
  }),

  http.delete('*/tenants/:id', ({ params }) => {
    const ok = deleteTenantRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '租户不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // —— 角色管理 ——
  http.get('*/roles', () => {
    return HttpResponse.json(listRoles())
  }),

  http.post('*/roles', async ({ request }) => {
    const body = (await request.json()) as { name: string; permissions: string[]; menuPermissions?: { menuId: string; actions: string[] }[] }
    if (!body.name || !body.permissions) {
      return HttpResponse.json({ message: 'name 和 permissions 必填' }, { status: 400 })
    }
    const created = insertRole(body)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/roles/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as Partial<{ name: string; permissions: string[]; menuPermissions: { menuId: string; actions: string[] }[] }>
    const updated = updateRoleRecord(id, body)
    if (!updated) return HttpResponse.json({ message: '角色不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.delete('*/roles/:id', ({ params }) => {
    const ok = deleteRoleRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '角色不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // ===========================================================
  // 应用管理 / 菜单管理（ch42，与 React 姊妹仓 msw/handlers.ts 对齐）
  // ===========================================================

  // —— 应用 ——
  http.get('*/apps', ({ request }) => {
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword') ?? undefined
    return HttpResponse.json(listApps({ keyword: keyword ?? undefined }))
  }),

  http.get('*/apps/:id', ({ params }) => {
    const app = findApp(String(params.id))
    if (!app) return HttpResponse.json({ message: '应用不存在' }, { status: 404 })
    return HttpResponse.json(app)
  }),

  http.post('*/apps', async ({ request }) => {
    const body = (await request.json()) as AppCreateInput
    if (!body.name || !body.code) {
      return HttpResponse.json({ message: 'name 和 code 必填' }, { status: 400 })
    }
    const created = insertApp({
      name: body.name,
      code: body.code,
      description: body.description,
      theme: body.theme ?? '#2563eb',
      sort: body.sort ?? 100,
      enabled: body.enabled ?? true,
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/apps/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as AppUpdateInput
    const updated = updateAppRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.theme !== undefined ? { theme: body.theme } : {}),
      ...(body.sort !== undefined ? { sort: body.sort } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: '应用不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.delete('*/apps/:id', ({ params }) => {
    const ok = deleteAppRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '应用不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // —— 菜单 ——
  http.get('*/menus', ({ request }) => {
    const url = new URL(request.url)
    const appId = url.searchParams.get('appId') ?? undefined
    return HttpResponse.json(listMenus(appId))
  }),

  http.get('*/menus/:id', ({ params, request }) => {
    const url = new URL(request.url)
    const appId = url.searchParams.get('appId') ?? undefined
    const id = String(params.id)
    if (appId) {
      const inApp = listMenus(appId).find((m) => m.id === id)
      if (!inApp) return HttpResponse.json({ message: '菜单不存在' }, { status: 404 })
      return HttpResponse.json(inApp)
    }
    const menu = findMenu(id)
    if (!menu) return HttpResponse.json({ message: '菜单不存在' }, { status: 404 })
    return HttpResponse.json(menu)
  }),

  http.post('*/menus', async ({ request }) => {
    const body = (await request.json()) as MenuCreateInput
    if (!body.name || !body.path || !body.appId) {
      return HttpResponse.json({ message: 'name / path / appId 必填' }, { status: 400 })
    }
    if (!findApp(body.appId)) {
      return HttpResponse.json({ message: '所属应用不存在' }, { status: 400 })
    }
    const created = insertMenu({
      name: body.name,
      path: body.path,
      appId: body.appId,
      parentId: body.parentId ?? null,
      icon: body.icon,
      sort: body.sort ?? 100,
      enabled: body.enabled ?? true,
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/menus/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as MenuUpdateInput
    const updated = updateMenuRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.path !== undefined ? { path: body.path } : {}),
      ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.sort !== undefined ? { sort: body.sort } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: '菜单不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.delete('*/menus/:id', ({ params }) => {
    const ok = deleteMenuRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '菜单不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // ===========================================================
  // 岗位 / 用户组 / 权限组（ch42）
  // ===========================================================

  // —— 岗位 ——
  http.get('*/positions', () => HttpResponse.json(listPositions())),
  http.get('*/positions/:id', ({ params }) => {
    const p = findPosition(String(params.id))
    if (!p) return HttpResponse.json({ message: '岗位不存在' }, { status: 404 })
    return HttpResponse.json(p)
  }),
  http.post('*/positions', async ({ request }) => {
    const body = (await request.json()) as PositionCreateInput
    if (!body.name || !body.code) return HttpResponse.json({ message: 'name 和 code 必填' }, { status: 400 })
    const created = insertPosition({
      name: body.name, code: body.code, description: body.description,
      sort: body.sort ?? 100, enabled: body.enabled ?? true,
    })
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('*/positions/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as PositionUpdateInput
    const updated = updatePositionRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.sort !== undefined ? { sort: body.sort } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: '岗位不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),
  http.delete('*/positions/:id', ({ params }) => {
    const ok = deletePositionRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '岗位不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // —— 用户组 ——
  http.get('*/user-groups', () => HttpResponse.json(listUserGroups())),
  http.get('*/user-groups/:id', ({ params }) => {
    const g = findUserGroup(String(params.id))
    if (!g) return HttpResponse.json({ message: '用户组不存在' }, { status: 404 })
    return HttpResponse.json(g)
  }),
  http.post('*/user-groups', async ({ request }) => {
    const body = (await request.json()) as UserGroupCreateInput
    if (!body.name) return HttpResponse.json({ message: 'name 必填' }, { status: 400 })
    const created = insertUserGroup({
      name: body.name, description: body.description, enabled: body.enabled ?? true,
    })
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('*/user-groups/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as UserGroupUpdateInput
    const updated = updateUserGroupRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: '用户组不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),
  http.delete('*/user-groups/:id', ({ params }) => {
    const ok = deleteUserGroupRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '用户组不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // —— 权限组 ——
  http.get('*/permission-groups', () => HttpResponse.json(listPermissionGroups())),
  http.get('*/permission-groups/:id', ({ params }) => {
    const p = findPermissionGroup(String(params.id))
    if (!p) return HttpResponse.json({ message: '权限组不存在' }, { status: 404 })
    return HttpResponse.json(p)
  }),
  http.post('*/permission-groups', async ({ request }) => {
    const body = (await request.json()) as PermissionGroupCreateInput
    if (!body.name || !body.code) return HttpResponse.json({ message: 'name 和 code 必填' }, { status: 400 })
    const created = insertPermissionGroup({
      name: body.name, code: body.code, description: body.description,
      permissions: body.permissions ?? [], menuIds: body.menuIds ?? [],
      sort: body.sort ?? 100, enabled: body.enabled ?? true,
    })
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('*/permission-groups/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as PermissionGroupUpdateInput
    const updated = updatePermissionGroupRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.permissions !== undefined ? { permissions: body.permissions } : {}),
      ...(body.menuIds !== undefined ? { menuIds: body.menuIds } : {}),
      ...(body.sort !== undefined ? { sort: body.sort } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: '权限组不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),
  http.delete('*/permission-groups/:id', ({ params }) => {
    const ok = deletePermissionGroupRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: '权限组不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // ===========================================================
  // 登录方式 / SSO / OAuth2 / Token / API Key（ch40）
  // ===========================================================

  // —— 登录方式（仅 GET + PUT，不支持创建/删除）——
  http.get('*/login-methods', () => HttpResponse.json(listLoginMethods())),
  http.put('*/login-methods/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as LoginMethodUpdateInput
    const updated = updateLoginMethodRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      ...(body.sort !== undefined ? { sort: body.sort } : {}),
    })
    if (!updated) return HttpResponse.json({ message: '登录方式不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  // —— SSO Provider（仅 GET + PUT）——
  http.get('*/sso-providers', () => HttpResponse.json(listSsoProviders())),
  http.put('*/sso-providers/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as SsoProviderUpdateInput
    const updated = updateSsoProviderRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.clientId !== undefined ? { clientId: body.clientId } : {}),
      ...(body.issuerUrl !== undefined ? { issuerUrl: body.issuerUrl } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: 'SSO 提供商不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  // —— OAuth2 Provider（仅 GET + PUT）——
  http.get('*/oauth2-providers', () => HttpResponse.json(listOAuth2Providers())),
  http.put('*/oauth2-providers/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as OAuth2ProviderUpdateInput
    const updated = updateOAuth2ProviderRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.provider !== undefined ? { provider: body.provider } : {}),
      ...(body.clientId !== undefined ? { clientId: body.clientId } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: 'OAuth2 提供商不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  // —— Token Config（单例 GET + PUT）——
  http.get('*/token-config', () => HttpResponse.json(getTokenConfig())),
  http.put('*/token-config', async ({ request }) => {
    const body = (await request.json()) as TokenConfigUpdateInput
    const updated = updateTokenConfigRecord({
      ...(body.accessTokenTtl !== undefined ? { accessTokenTtl: body.accessTokenTtl } : {}),
      ...(body.refreshTokenTtl !== undefined ? { refreshTokenTtl: body.refreshTokenTtl } : {}),
      ...(body.refreshTokenEnabled !== undefined ? { refreshTokenEnabled: body.refreshTokenEnabled } : {}),
      ...(body.tokenRevocationEnabled !== undefined ? { tokenRevocationEnabled: body.tokenRevocationEnabled } : {}),
    })
    return HttpResponse.json(updated)
  }),

  // —— API Key（CRUD）——
  http.get('*/api-keys', () => HttpResponse.json(listApiKeys())),
  http.get('*/api-keys/:id', ({ params }) => {
    const k = findApiKey(String(params.id))
    if (!k) return HttpResponse.json({ message: 'API Key 不存在' }, { status: 404 })
    return HttpResponse.json(k)
  }),
  http.post('*/api-keys', async ({ request }) => {
    const body = (await request.json()) as ApiKeyCreateInput
    if (!body.name) return HttpResponse.json({ message: 'name 必填' }, { status: 400 })
    const created = insertApiKey({
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt,
    })
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('*/api-keys/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as ApiKeyUpdateInput
    const updated = updateApiKeyRecord(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.scopes !== undefined ? { scopes: body.scopes } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    if (!updated) return HttpResponse.json({ message: 'API Key 不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),
  http.delete('*/api-keys/:id', ({ params }) => {
    const ok = deleteApiKeyRecord(String(params.id))
    if (!ok) return HttpResponse.json({ message: 'API Key 不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // ===========================================================
  // 登录安全 / 密码策略 / 风险控制 / 消息通知 / 开放平台（ch41-42，单例）
  // ===========================================================

  // 登录安全
  http.get('*/login-security', () => HttpResponse.json(getLoginSecurity())),
  http.put('*/login-security', async ({ request }) => {
    const body = (await request.json()) as LoginSecurityUpdateInput
    const updated = updateLoginSecurityRecord({
      ...(body.ipWhitelist !== undefined ? { ipWhitelist: body.ipWhitelist } : {}),
      ...(body.ipBlacklist !== undefined ? { ipBlacklist: body.ipBlacklist } : {}),
      ...(body.regionRestrictionEnabled !== undefined ? { regionRestrictionEnabled: body.regionRestrictionEnabled } : {}),
      ...(body.allowedRegions !== undefined ? { allowedRegions: body.allowedRegions } : {}),
      ...(body.failedAttemptLockEnabled !== undefined ? { failedAttemptLockEnabled: body.failedAttemptLockEnabled } : {}),
      ...(body.lockThreshold !== undefined ? { lockThreshold: body.lockThreshold } : {}),
      ...(body.lockDuration !== undefined ? { lockDuration: body.lockDuration } : {}),
    })
    return HttpResponse.json(updated)
  }),

  // 密码策略
  http.get('*/password-policy', () => HttpResponse.json(getPasswordPolicy())),
  http.put('*/password-policy', async ({ request }) => {
    const body = (await request.json()) as PasswordPolicyUpdateInput
    const updated = updatePasswordPolicyRecord({
      ...(body.minLength !== undefined ? { minLength: body.minLength } : {}),
      ...(body.requireUppercase !== undefined ? { requireUppercase: body.requireUppercase } : {}),
      ...(body.requireLowercase !== undefined ? { requireLowercase: body.requireLowercase } : {}),
      ...(body.requireDigit !== undefined ? { requireDigit: body.requireDigit } : {}),
      ...(body.requireSpecial !== undefined ? { requireSpecial: body.requireSpecial } : {}),
      ...(body.expireDays !== undefined ? { expireDays: body.expireDays } : {}),
      ...(body.historyCount !== undefined ? { historyCount: body.historyCount } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    return HttpResponse.json(updated)
  }),

  // 风险控制
  http.get('*/risk-control', () => HttpResponse.json(getRiskControl())),
  http.put('*/risk-control', async ({ request }) => {
    const body = (await request.json()) as RiskControlUpdateInput
    const updated = updateRiskControlRecord({
      ...(body.anomalyDetectionEnabled !== undefined ? { anomalyDetectionEnabled: body.anomalyDetectionEnabled } : {}),
      ...(body.crossRegionAlertEnabled !== undefined ? { crossRegionAlertEnabled: body.crossRegionAlertEnabled } : {}),
      ...(body.deviceFingerprintEnabled !== undefined ? { deviceFingerprintEnabled: body.deviceFingerprintEnabled } : {}),
      ...(body.riskScoreThreshold !== undefined ? { riskScoreThreshold: body.riskScoreThreshold } : {}),
    })
    return HttpResponse.json(updated)
  }),

  // 消息通知
  http.get('*/notification-config', () => HttpResponse.json(getNotificationConfig())),
  http.put('*/notification-config', async ({ request }) => {
    const body = (await request.json()) as NotificationConfigUpdateInput
    const updated = updateNotificationConfigRecord({
      ...(body.emailEnabled !== undefined ? { emailEnabled: body.emailEnabled } : {}),
      ...(body.smsEnabled !== undefined ? { smsEnabled: body.smsEnabled } : {}),
      ...(body.inAppEnabled !== undefined ? { inAppEnabled: body.inAppEnabled } : {}),
      ...(body.notifyOn !== undefined ? { notifyOn: body.notifyOn } : {}),
    })
    return HttpResponse.json(updated)
  }),

  // 开放平台
  http.get('*/open-platform-config', () => HttpResponse.json(getOpenPlatformConfig())),
  http.put('*/open-platform-config', async ({ request }) => {
    const body = (await request.json()) as OpenPlatformConfigUpdateInput
    const updated = updateOpenPlatformConfigRecord({
      ...(body.apiEnabled !== undefined ? { apiEnabled: body.apiEnabled } : {}),
      ...(body.webhookEnabled !== undefined ? { webhookEnabled: body.webhookEnabled } : {}),
      ...(body.sdkEnabled !== undefined ? { sdkEnabled: body.sdkEnabled } : {}),
      ...(body.openScopes !== undefined ? { openScopes: body.openScopes } : {}),
      ...(body.callbackWhitelist !== undefined ? { callbackWhitelist: body.callbackWhitelist } : {}),
    })
    return HttpResponse.json(updated)
  }),

  // ===========================================================
  // 组织架构 CRUD（ch41，终批补齐）
  // ===========================================================
  http.post('*/orgs', async ({ request }) => {
    const body = (await request.json()) as { name: string; parentId?: string }
    if (!body.name) return HttpResponse.json({ message: 'name 必填' }, { status: 400 })
    const parentId = body.parentId ?? 'org-root'
    const created = insertOrgNode(parentId, body.name)
    if (!created) return HttpResponse.json({ message: '父节点不存在' }, { status: 404 })
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('*/orgs/:id', async ({ params, request }) => {
    const body = (await request.json()) as { name: string }
    if (!body.name) return HttpResponse.json({ message: 'name 必填' }, { status: 400 })
    const updated = updateOrgNodeRecord(String(params.id), body.name)
    if (!updated) return HttpResponse.json({ message: '节点不存在' }, { status: 404 })
    return HttpResponse.json(updated)
  }),
  http.delete('*/orgs/:id', ({ params }) => {
    const id = String(params.id)
    if (id === 'org-root') return HttpResponse.json({ message: '根节点不可删除' }, { status: 400 })
    const ok = deleteOrgNodeRecord(id)
    if (!ok) return HttpResponse.json({ message: '节点不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),
]
