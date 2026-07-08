import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

// 当前 token（由 auth store 在 login/logout 时通过 setToken 同步）
let currentToken: string | null = null
// 当前租户 ID（由 tenant store 在 init/switch 时通过 setTenantId 同步）
let currentTenantId: string | null = null
// 401 回调（由 App 注册，通常跳 SSO）
let unauthorizedHandler: (() => void) | null = null

export function setToken(token: string | null) {
  currentToken = token
}

export function setTenantId(tenantId: string | null) {
  currentTenantId = tenantId
}

export function getTenantId(): string | null {
  return currentTenantId
}

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler
}

export function resetApiClient() {
  currentToken = null
  currentTenantId = null
  unauthorizedHandler = null
}

export const apiClient: AxiosInstance = axios.create({ baseURL })

// ch39：请求拦截器注入 X-Tenant-ID（来自 tenant store）+ Authorization（来自 auth store）
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`
  }
  if (currentTenantId) {
    config.headers['X-Tenant-ID'] = currentTenantId
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      currentToken = null
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)
