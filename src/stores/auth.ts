// ch40 auth store：SSO 登录写入 token/roles/permissions + 切换组织刷新权限（联动 tenant store）
// @entry M01.F03.I01
// @entry M01.F03.I01
// @entry M01.F03.I01
// @entry M01.F03.I01
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient, setToken } from '../api/client'
import { handleSsoCallback } from '../composables/useSso'
import type { Role } from '../types/rbac'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

export interface SaaSUser {
  id: string
  username: string
  displayName: string
  orgId: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SaaSUser | null>(null)
  const token = ref<string | null>(null)
  /** 当前组织 ID（SaaS 多组织，可切换） */
  const currentOrgId = ref<string | null>(null)
  const status = ref<AuthStatus>('idle')
  const error = ref<string | null>(null)
  const roles = ref<Role[]>([])
  const permissions = ref<string[]>([])

  /** SSO 登录：用 code 换 token + user */
  async function loginWithSso(code: string, provider = 'oidc'): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const result = await handleSsoCallback(code, provider)
      setToken(result.token)
      token.value = result.token
      user.value = result.user
      currentOrgId.value = result.user.orgId
      status.value = 'authenticated'
      // 登录后立即拉取权限集
      await refreshPermissions()
    } catch (err) {
      setToken(null)
      token.value = null
      user.value = null
      currentOrgId.value = null
      roles.value = []
      permissions.value = []
      status.value = 'error'
      error.value = extractErrorMessage(err, '认证失败')
    }
  }

  /** 刷新权限：按当前 orgId 拉 roles + permissions */
  async function refreshPermissions(): Promise<void> {
    if (!token.value) return
    try {
      const res = await apiClient.get<{ roles: Role[]; permissions: string[] }>('/auth/permissions', {
        params: { orgId: currentOrgId.value ?? undefined },
      })
      roles.value = res.data.roles
      permissions.value = res.data.permissions
    } catch (err) {
      // 权限刷新失败不致命，记录到 error 但不退出登录
      error.value = extractErrorMessage(err, '权限刷新失败')
    }
  }

  /** 切换组织：更新 orgId → 联动刷新权限（权限范围随组织变化） */
  async function switchOrg(orgId: string): Promise<void> {
    currentOrgId.value = orgId
    await refreshPermissions()
  }

  /** 登出：清空全部态 */
  function logout(): void {
    setToken(null)
    user.value = null
    token.value = null
    currentOrgId.value = null
    roles.value = []
    permissions.value = []
    status.value = 'idle'
    error.value = null
  }

  function clearError(): void {
    error.value = null
  }

  return {
    user,
    token,
    currentOrgId,
    status,
    error,
    roles,
    permissions,
    loginWithSso,
    refreshPermissions,
    switchOrg,
    logout,
    clearError,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
