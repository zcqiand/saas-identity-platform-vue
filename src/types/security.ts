// 安全/认证配置类型（与 React 姊妹仓 src/types/security.ts 对齐）
// 共享契约：字段名/类型/枚举与 React 仓一致。

// —— 登录方式 ——
export type LoginMethodType = 'password' | 'email_code' | 'sms_code' | 'totp' | 'sso' | 'oauth2'

export interface LoginMethod {
  id: string
  method: LoginMethodType
  name: string
  description?: string
  enabled: boolean
  sort: number
}

// —— SSO 身份提供商 ——
export type SsoProviderType = 'oidc' | 'saml'

export interface SsoProvider {
  id: string
  name: string
  type: SsoProviderType
  clientId?: string
  issuerUrl?: string
  enabled: boolean
}

// —— OAuth2 第三方登录 ——
export type OAuth2ProviderName = 'google' | 'github' | 'wechat' | 'dingtalk' | 'feishu'

export interface OAuth2Provider {
  id: string
  name: string
  provider: OAuth2ProviderName
  clientId?: string
  enabled: boolean
}

// —— Token 配置 ——
export interface TokenConfig {
  id: string
  accessTokenTtl: number
  refreshTokenTtl: number
  refreshTokenEnabled: boolean
  tokenRevocationEnabled: boolean
}

// —— API Key ——
export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  expiresAt?: string
  enabled: boolean
  createdAt: string
  lastUsedAt?: string
}

export interface ApiKeyCreateInput {
  name: string
  scopes?: string[]
  expiresAt?: string
}

export type ApiKeyUpdateInput = Partial<ApiKeyCreateInput & { enabled: boolean }>

// —— 输入/更新辅助类型 ——
export interface LoginMethodUpdateInput {
  name?: string
  description?: string
  enabled?: boolean
  sort?: number
}

export interface SsoProviderUpdateInput {
  name?: string
  type?: SsoProviderType
  clientId?: string
  issuerUrl?: string
  enabled?: boolean
}

export interface OAuth2ProviderUpdateInput {
  name?: string
  provider?: OAuth2ProviderName
  clientId?: string
  enabled?: boolean
}

export interface TokenConfigUpdateInput {
  accessTokenTtl?: number
  refreshTokenTtl?: number
  refreshTokenEnabled?: boolean
  tokenRevocationEnabled?: boolean
}

// —— 登录安全（ch41）——
export interface LoginSecurity {
  id: string
  ipWhitelist: string[]
  ipBlacklist: string[]
  regionRestrictionEnabled: boolean
  allowedRegions: string[]
  failedAttemptLockEnabled: boolean
  lockThreshold: number
  lockDuration: number
}

export interface LoginSecurityUpdateInput {
  ipWhitelist?: string[]
  ipBlacklist?: string[]
  regionRestrictionEnabled?: boolean
  allowedRegions?: string[]
  failedAttemptLockEnabled?: boolean
  lockThreshold?: number
  lockDuration?: number
}

// —— 密码策略（ch41）——
export interface PasswordPolicy {
  id: string
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireDigit: boolean
  requireSpecial: boolean
  expireDays: number
  historyCount: number
  enabled: boolean
}

export interface PasswordPolicyUpdateInput {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireDigit?: boolean
  requireSpecial?: boolean
  expireDays?: number
  historyCount?: number
  enabled?: boolean
}

// —— 风险控制（ch41）——
export interface RiskControl {
  id: string
  anomalyDetectionEnabled: boolean
  crossRegionAlertEnabled: boolean
  deviceFingerprintEnabled: boolean
  riskScoreThreshold: number
}

export interface RiskControlUpdateInput {
  anomalyDetectionEnabled?: boolean
  crossRegionAlertEnabled?: boolean
  deviceFingerprintEnabled?: boolean
  riskScoreThreshold?: number
}

// —— 消息通知（ch42）——
export type NotificationTrigger = 'login' | 'password_change' | 'security_alert' | 'system'

export interface NotificationConfig {
  id: string
  emailEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
  notifyOn: NotificationTrigger[]
}

export interface NotificationConfigUpdateInput {
  emailEnabled?: boolean
  smsEnabled?: boolean
  inAppEnabled?: boolean
  notifyOn?: NotificationTrigger[]
}

// —— 开放平台（ch42）——
export interface OpenPlatformConfig {
  id: string
  apiEnabled: boolean
  webhookEnabled: boolean
  sdkEnabled: boolean
  openScopes: string[]
  callbackWhitelist: string[]
}

export interface OpenPlatformConfigUpdateInput {
  apiEnabled?: boolean
  webhookEnabled?: boolean
  sdkEnabled?: boolean
  openScopes?: string[]
  callbackWhitelist?: string[]
}
