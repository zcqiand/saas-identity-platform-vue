// ch40 OAuth2.0 authorization-code flow：构造授权 URL + 处理回调换 token
// @entry M01.F04.I01
// @entry M01.F04.I02
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
import { generateState } from './useSso'

interface BuildOAuthOptions {
  provider: 'google' | 'github' | 'wechat' | 'dingtalk' | 'feishu'
  state: string
  clientId?: string
  redirectUri?: string
}

interface OAuthCallbackResult {
  token: string
  user: { id: string; username: string; displayName: string; orgId: string }
}

/** 各 provider 默认 clientId（来自 .env.example，仅 mock 层使用，非真实凭证） */
const PROVIDER_CLIENT_ID_ENV: Record<BuildOAuthOptions['provider'], string> = {
  github: import.meta.env.VITE_OAUTH_GITHUB_CLIENT_ID ?? 'github-demo-client',
  google: 'google-demo-client',
  wechat: 'wechat-demo-client',
  dingtalk: 'dingtalk-demo-client',
  feishu: 'feishu-demo-client',
}

/** 构造 OAuth2.0 /authorize URL（复用 mock IdP 的 /sso/authorize） */
export function buildOAuthAuthorizeUrl(options: BuildOAuthOptions): string {
  const ssoBaseUrl = import.meta.env.VITE_SSO_BASE_URL ?? '/sso'
  const clientId = options.clientId ?? PROVIDER_CLIENT_ID_ENV[options.provider]
  const redirectUri =
    options.redirectUri ??
    `${window.location.origin}${import.meta.env.VITE_OAUTH_REDIRECT_URI ?? '/oauth/callback'}`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: options.state,
    provider: options.provider,
  })
  return `${ssoBaseUrl}/authorize?${params.toString()}`
}

/** 跳转到 OAuth2.0 授权服务器 */
export function redirectToOAuth(options: BuildOAuthOptions): void {
  const url = buildOAuthAuthorizeUrl(options)
  window.location.href = url
}

/** 启动 OAuth 流程：生成 state + 跳转（便捷封装） */
export function startOAuthFlow(provider: BuildOAuthOptions['provider']): void {
  redirectToOAuth({ provider, state: generateState() })
}

/** 处理 OAuth 回调：用 code 换 token + user */
export async function handleOAuthCallback(code: string, provider: BuildOAuthOptions['provider']): Promise<OAuthCallbackResult> {
  const res = await apiClient.post<OAuthCallbackResult>('/auth/oauth/callback', { code, provider })
  return res.data
}
