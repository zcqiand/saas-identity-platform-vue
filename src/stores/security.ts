// ch40 安全/认证配置 store：登录方式 / SSO / OAuth2 / Token / API Key
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client'
import type {
  LoginMethod, SsoProvider, OAuth2Provider, TokenConfig, ApiKey,
  LoginMethodUpdateInput, SsoProviderUpdateInput, OAuth2ProviderUpdateInput,
  TokenConfigUpdateInput, ApiKeyCreateInput, ApiKeyUpdateInput,
  LoginSecurity, PasswordPolicy, RiskControl, NotificationConfig, OpenPlatformConfig,
  LoginSecurityUpdateInput, PasswordPolicyUpdateInput, RiskControlUpdateInput,
  NotificationConfigUpdateInput, OpenPlatformConfigUpdateInput,
} from '../types/security'

export const useSecurityStore = defineStore('security', () => {
  const loginMethods = ref<LoginMethod[]>([])
  const ssoProviders = ref<SsoProvider[]>([])
  const oauth2Providers = ref<OAuth2Provider[]>([])
  const tokenConfig = ref<TokenConfig | null>(null)
  const apiKeys = ref<ApiKey[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // —— 登录方式 ——
  async function fetchLoginMethods(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<LoginMethod[]>('/login-methods'); loginMethods.value = data }
    catch (err) { error.value = extractErrorMessage(err, '登录方式加载失败') } finally { loading.value = false }
  }
  async function updateLoginMethod(id: string, patch: LoginMethodUpdateInput): Promise<LoginMethod | null> {
    try {
      const { data } = await apiClient.put<LoginMethod>(`/login-methods/${id}`, patch)
      const idx = loginMethods.value.findIndex((m) => m.id === id)
      if (idx !== -1) loginMethods.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, '登录方式更新失败'); return null }
  }

  // —— SSO ——
  async function fetchSsoProviders(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<SsoProvider[]>('/sso-providers'); ssoProviders.value = data }
    catch (err) { error.value = extractErrorMessage(err, 'SSO 加载失败') } finally { loading.value = false }
  }
  async function updateSsoProvider(id: string, patch: SsoProviderUpdateInput): Promise<SsoProvider | null> {
    try {
      const { data } = await apiClient.put<SsoProvider>(`/sso-providers/${id}`, patch)
      const idx = ssoProviders.value.findIndex((p) => p.id === id)
      if (idx !== -1) ssoProviders.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, 'SSO 更新失败'); return null }
  }

  // —— OAuth2 ——
  async function fetchOAuth2Providers(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<OAuth2Provider[]>('/oauth2-providers'); oauth2Providers.value = data }
    catch (err) { error.value = extractErrorMessage(err, 'OAuth2 加载失败') } finally { loading.value = false }
  }
  async function updateOAuth2Provider(id: string, patch: OAuth2ProviderUpdateInput): Promise<OAuth2Provider | null> {
    try {
      const { data } = await apiClient.put<OAuth2Provider>(`/oauth2-providers/${id}`, patch)
      const idx = oauth2Providers.value.findIndex((p) => p.id === id)
      if (idx !== -1) oauth2Providers.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, 'OAuth2 更新失败'); return null }
  }

  // —— Token Config ——
  async function fetchTokenConfig(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<TokenConfig>('/token-config'); tokenConfig.value = data }
    catch (err) { error.value = extractErrorMessage(err, 'Token 配置加载失败') } finally { loading.value = false }
  }
  async function updateTokenConfig(patch: TokenConfigUpdateInput): Promise<TokenConfig | null> {
    try {
      const { data } = await apiClient.put<TokenConfig>('/token-config', patch)
      tokenConfig.value = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, 'Token 配置更新失败'); return null }
  }

  // —— API Key ——
  async function fetchApiKeys(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<ApiKey[]>('/api-keys'); apiKeys.value = data }
    catch (err) { error.value = extractErrorMessage(err, 'API Key 加载失败') } finally { loading.value = false }
  }
  async function createApiKey(input: ApiKeyCreateInput): Promise<ApiKey | null> {
    try {
      const { data } = await apiClient.post<ApiKey>('/api-keys', input)
      apiKeys.value = [...apiKeys.value, data]
      return data
    } catch (err) { error.value = extractErrorMessage(err, 'API Key 创建失败'); return null }
  }
  async function updateApiKey(id: string, patch: ApiKeyUpdateInput): Promise<ApiKey | null> {
    try {
      const { data } = await apiClient.put<ApiKey>(`/api-keys/${id}`, patch)
      const idx = apiKeys.value.findIndex((k) => k.id === id)
      if (idx !== -1) apiKeys.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, 'API Key 更新失败'); return null }
  }
  async function removeApiKey(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api-keys/${id}`)
      apiKeys.value = apiKeys.value.filter((k) => k.id !== id)
      return true
    } catch (err) { error.value = extractErrorMessage(err, 'API Key 删除失败'); return false }
  }

  // —— 5 个单例配置 ——
  const loginSecurity = ref<LoginSecurity | null>(null)
  const passwordPolicy = ref<PasswordPolicy | null>(null)
  const riskControl = ref<RiskControl | null>(null)
  const notificationConfig = ref<NotificationConfig | null>(null)
  const openPlatformConfig = ref<OpenPlatformConfig | null>(null)

  async function fetchLoginSecurity(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<LoginSecurity>('/login-security'); loginSecurity.value = data }
    catch (err) { error.value = extractErrorMessage(err, '登录安全配置加载失败') } finally { loading.value = false }
  }
  async function updateLoginSecurity(patch: LoginSecurityUpdateInput): Promise<LoginSecurity | null> {
    try { const { data } = await apiClient.put<LoginSecurity>('/login-security', patch); loginSecurity.value = data; return data }
    catch (err) { error.value = extractErrorMessage(err, '登录安全更新失败'); return null }
  }
  async function fetchPasswordPolicy(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<PasswordPolicy>('/password-policy'); passwordPolicy.value = data }
    catch (err) { error.value = extractErrorMessage(err, '密码策略加载失败') } finally { loading.value = false }
  }
  async function updatePasswordPolicy(patch: PasswordPolicyUpdateInput): Promise<PasswordPolicy | null> {
    try { const { data } = await apiClient.put<PasswordPolicy>('/password-policy', patch); passwordPolicy.value = data; return data }
    catch (err) { error.value = extractErrorMessage(err, '密码策略更新失败'); return null }
  }
  async function fetchRiskControl(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<RiskControl>('/risk-control'); riskControl.value = data }
    catch (err) { error.value = extractErrorMessage(err, '风险控制加载失败') } finally { loading.value = false }
  }
  async function updateRiskControl(patch: RiskControlUpdateInput): Promise<RiskControl | null> {
    try { const { data } = await apiClient.put<RiskControl>('/risk-control', patch); riskControl.value = data; return data }
    catch (err) { error.value = extractErrorMessage(err, '风险控制更新失败'); return null }
  }
  async function fetchNotificationConfig(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<NotificationConfig>('/notification-config'); notificationConfig.value = data }
    catch (err) { error.value = extractErrorMessage(err, '通知配置加载失败') } finally { loading.value = false }
  }
  async function updateNotificationConfig(patch: NotificationConfigUpdateInput): Promise<NotificationConfig | null> {
    try { const { data } = await apiClient.put<NotificationConfig>('/notification-config', patch); notificationConfig.value = data; return data }
    catch (err) { error.value = extractErrorMessage(err, '通知配置更新失败'); return null }
  }
  async function fetchOpenPlatformConfig(): Promise<void> {
    loading.value = true
    try { const { data } = await apiClient.get<OpenPlatformConfig>('/open-platform-config'); openPlatformConfig.value = data }
    catch (err) { error.value = extractErrorMessage(err, '开放平台配置加载失败') } finally { loading.value = false }
  }
  async function updateOpenPlatformConfig(patch: OpenPlatformConfigUpdateInput): Promise<OpenPlatformConfig | null> {
    try { const { data } = await apiClient.put<OpenPlatformConfig>('/open-platform-config', patch); openPlatformConfig.value = data; return data }
    catch (err) { error.value = extractErrorMessage(err, '开放平台更新失败'); return null }
  }

  function clearError(): void { error.value = null }
  return {
    loginMethods, ssoProviders, oauth2Providers, tokenConfig, apiKeys, loading, error,
    loginSecurity, passwordPolicy, riskControl, notificationConfig, openPlatformConfig,
    fetchLoginMethods, updateLoginMethod,
    fetchSsoProviders, updateSsoProvider,
    fetchOAuth2Providers, updateOAuth2Provider,
    fetchTokenConfig, updateTokenConfig,
    fetchApiKeys, createApiKey, updateApiKey, removeApiKey,
    fetchLoginSecurity, updateLoginSecurity,
    fetchPasswordPolicy, updatePasswordPolicy,
    fetchRiskControl, updateRiskControl,
    fetchNotificationConfig, updateNotificationConfig,
    fetchOpenPlatformConfig, updateOpenPlatformConfig,
    clearError,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
