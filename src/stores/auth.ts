// ch40 auth store：SSO 登录写入 token/roles/permissions + 切换部门刷新权限（联动 tenant store）
// v0.3.0 重命名（原 orgId → departmentId；currentOrgId → currentDepartmentId；switchOrg → switchDepartment）
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
  /** v0.3.0 改名（原 orgId）：指向 Department.id */
  departmentId: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SaaSUser | null>(null)
  const token = ref<string | null>(null)
  /** 当前部门 ID（SaaS 多部门，可切换）。v0.3.0 改名（原 currentOrgId）。 */
  const currentDepartmentId = ref<string | null>(null)
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
      currentDepartmentId.value = result.user.departmentId
      status.value = 'authenticated'
      // 登录后立即拉取权限集
      await refreshPermissions()
    } catch (err) {
      setToken(null)
      token.value = null
      user.value = null
      currentDepartmentId.value = null
      roles.value = []
      permissions.value = []
      status.value = 'error'
      error.value = extractErrorMessage(err, '认证失败')
    }
  }

  /** 刷新权限：按当前 departmentId 拉 roles + permissions */
  async function refreshPermissions(): Promise<void> {
    if (!token.value) return
    try {
      const res = await apiClient.get<{ roles: Role[]; permissions: string[] }>('/auth/permissions', {
        params: { departmentId: currentDepartmentId.value ?? undefined },
      })
      roles.value = res.data.roles
      permissions.value = res.data.permissions
    } catch (err) {
      // 权限刷新失败不致命，记录到 error 但不退出登录
      error.value = extractErrorMessage(err, '权限刷新失败')
    }
  }

  /** 切换部门：更新 departmentId → 联动刷新权限（权限范围随部门变化）。
   *  v0.3.0 改名（原 switchOrg）。 */
  async function switchDepartment(departmentId: string): Promise<void> {
    currentDepartmentId.value = departmentId
    await refreshPermissions()
  }

  /** 登出：清空全部态 */
  function logout(): void {
    setToken(null)
    user.value = null
    token.value = null
    currentDepartmentId.value = null
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
    currentDepartmentId,
    status,
    error,
    roles,
    permissions,
    loginWithSso,
    refreshPermissions,
    switchDepartment,
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
