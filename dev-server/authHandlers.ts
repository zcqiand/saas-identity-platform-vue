/**
 * dev-server/authHandlers.ts
 *
 * 从 saas-identity-platform（React）/dev-server/authHandlers.ts 复制并适配 saas-vue：
 *   - msw/db.ts → 直接用 mocks/identity.ts
 *   - msw/jwt.ts → 直接复用（已含 roles[]/tenantId/appId/departmentId 字段）
 *
 * ch40 4 条 auth 端点 / M01.F04.I04 动态菜单契约不变。
 *
 * v0.3.0 重命名（原 orgId → departmentId；org-lab-root → department-lab-root）：
 *   - signJwt payload 现签 departmentId 而非 orgId
 *   - /auth/permissions 读 ?departmentId=，兼容新名
 *   - URL 表面 ?orgId= 旧名继续保留（小步拆迁移）
 */

import { signJwt, verifyJwt } from '../mocks/jwt'
import { LAB_APP_MENUS, LAB_ROLES, type IdentityRole } from '../mocks/identity'

// ===== 1. GET /sso/authorize =====
export function handleSsoAuthorize(req: Request): Response {
  const url = new URL(req.url)
  const clientId = url.searchParams.get('client_id')
  const redirectUri = url.searchParams.get('redirect_uri')
  const state = url.searchParams.get('state')
  if (!clientId || !redirectUri) {
    return json({ message: '缺少 client_id 或 redirect_uri' }, 400)
  }
  // mock 直接在 authorize 内签 code 并 302 回调（伪两步合一，无 /token 交换层）
  const code = 'mock-code'
  const callbackUrl = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}code=${code}&state=${state ?? ''}`
  return new Response(null, { status: 302, headers: { Location: callbackUrl } })
}

// ===== 2. POST /auth/oauth/callback =====
export async function handleOAuthCallback(req: Request): Promise<Response> {
  const body = (await req.json()) as {
    code?: string
    clientId?: string
    provider?: string
  }
  return handleOAuthCallbackFromBody(body)
}

export async function handleOAuthCallbackFromBody(body: {
  code?: string
  clientId?: string
  provider?: string
}): Promise<Response> {
  if (!body.code || body.code === 'bad-code') {
    return json({ message: '无效授权码' }, 401)
  }
  // lab 集成：clientId='lab-management' → 返回 lab 租户身份（部门根 = department-lab-root / org-lab-root）
  if (body.clientId === 'lab-management') {
    const labAdmin = LAB_ROLES.find((r) => r.name === 'labadmin')
    const perms = labAdmin?.permissions ?? []
    const labToken = signJwt({
      sub: 'u-lab-admin',
      username: 'labadmin',
      departmentId: 'org-lab-root',
      roles: ['labadmin'],
      permissions: perms,
      tenantId: 'tenant-lab',
      appId: 'app-lab',
    })
    return json({
      token: labToken,
      user: {
        id: 'u-lab-admin',
        username: 'labadmin',
        displayName: '实验室管理员',
        // role + permissions 必带：lab-vue 的菜单/权限过滤依赖 user.permissions
        // （与 lab-vue 自身 msw ssoHandler 返回形状一致）
        role: { id: labAdmin?.id ?? 'role-admin', name: 'labadmin', permissions: perms },
        permissions: perms,
        departmentId: 'org-lab-root',
        tenantId: 'tenant-lab',
        appId: 'app-lab',
      },
    })
  }
  // 默认 acme 流（与 saas-vue mocks/handlers.ts 行为一致）
  const token = signJwt({
    sub: 'u-001',
    username: 'admin@acme',
    departmentId: 'department-acme',
    roles: ['admin'],
    permissions: ['user:read', 'user:create', 'user:delete', 'org:read', 'org:write'],
  })
  return json({
    token,
    user: {
      id: 'u-001',
      username: 'admin@acme',
      displayName: 'SaaS 管理员',
      departmentId: 'department-acme',
    },
  })
}

// ===== 3. GET /auth/permissions =====
export function handleAuthPermissions(req: Request): Response {
  const auth = req.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return json({ message: '未授权' }, 401)
  }
  const url = new URL(req.url)
  // v0.3.0 改名（原 orgId → departmentId）；兼容旧名（5b/5c 边界保留）
  const departmentId = url.searchParams.get('departmentId')
    ?? url.searchParams.get('orgId')
    ?? 'org-lab-root'

  // lab 单租户：org-lab-root → LAB_ROLES
  if (departmentId === 'org-lab-root') {
    const permissions = Array.from(new Set(LAB_ROLES.flatMap((r) => r.permissions)))
    return json({ roles: LAB_ROLES satisfies IdentityRole[], permissions })
  }
  // 与 mocks/handlers.ts 一致：acme / globex 兜底
  const acmeRoles: IdentityRole[] = [
    {
      id: 'role-admin',
      name: 'admin',
      permissions: ['user:read', 'user:create', 'user:update', 'user:delete', 'org:read', 'org:write'],
    },
  ]
  const roles = acmeRoles
  return json({ roles, permissions: roles.flatMap((r) => r.permissions) })
}

// ===== 4. GET /menus?appId=... =====
export function handleGetMenus(req: Request): Response {
  const auth = req.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return json({ message: '未授权' }, 401)
  }
  const payload = verifyJwt(auth.slice(7))
  if (!payload) {
    return json({ message: 'token 无效或已过期' }, 401)
  }
  const url = new URL(req.url)
  const appId = url.searchParams.get('appId')
  if (payload.tenantId !== 'tenant-lab' || payload.appId !== 'app-lab') {
    return json([], { status: 200 })
  }
  const items = appId === 'app-lab' ? LAB_APP_MENUS : LAB_APP_MENUS.filter((m) => m.appId === appId)
  return json(items)
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
