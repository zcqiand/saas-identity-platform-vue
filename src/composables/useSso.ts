// ch40 SSO 单点登录：构造授权 URL + 处理回调换 token
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I05
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
import { apiClient } from '../api/client'

interface BuildSsoRedirectOptions {
  ssoBaseUrl?: string
  clientId?: string
  redirectUri?: string
  state: string
}

interface OAuthCallbackResult {
  token: string
  user: { id: string; username: string; displayName: string; orgId: string }
}

/** 构造 SSO /authorize 跳转 URL */
export function buildSsoRedirectUrl(options: BuildSsoRedirectOptions): string {
  const ssoBaseUrl = options.ssoBaseUrl ?? import.meta.env.VITE_SSO_BASE_URL ?? '/sso'
  const clientId = options.clientId ?? import.meta.env.VITE_SSO_CLIENT_ID ?? 'saas-demo-client'
  const redirectUri =
    options.redirectUri ?? `${window.location.origin}/sso-callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: options.state,
  })
  return `${ssoBaseUrl}/authorize?${params.toString()}`
}

/** 跳转到 SSO 授权服务器（mock IdP 在 MSW 层拦截） */
export function redirectToSso(options: BuildSsoRedirectOptions): void {
  const url = buildSsoRedirectUrl(options)
  window.location.href = url
}

/** 生成随机 state（防 CSRF） */
export function generateState(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** 处理 SSO 回调：用 code 换 token + user（走 mock IdP 的 /auth/oauth/callback） */
export async function handleSsoCallback(code: string, provider = 'oidc'): Promise<OAuthCallbackResult> {
  const res = await apiClient.post<OAuthCallbackResult>('/auth/oauth/callback', { code, provider })
  return res.data
}
