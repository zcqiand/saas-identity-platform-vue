// ch40/ch43 角色管理 store（与 React 姊妹仓 rbac/roleStore.ts 对齐）
// setup store 风格：list/loading/error + fetchRoles/createRole/updateRole/deleteRole/clearError。
// 菜单权限矩阵页（MenuPermissions）复用 updateRole 写入 menuPermissions，不另立 permissionStore（与 React 一致）。
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client'
import type { Role, RoleCreateInput } from '../types/rbac'

export const useRoleStore = defineStore('role', () => {
  const list = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 拉取全部角色 */
  async function fetchRoles(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<Role[]>('/roles')
      list.value = res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '角色列表加载失败')
      list.value = []
    } finally {
      loading.value = false
    }
  }

  /** 新建角色（在列表头部插入，对齐 React roleStore 行为） */
  async function createRole(input: RoleCreateInput): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.post<Role>('/roles', input)
      list.value = [res.data, ...list.value]
    } catch (err) {
      error.value = extractErrorMessage(err, '创建角色失败')
    } finally {
      loading.value = false
    }
  }

  /** 更新角色（name/permissions/menuPermissions 任意子集） */
  async function updateRole(id: string, patch: Partial<RoleCreateInput>): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.put<Role>(`/roles/${id}`, patch)
      list.value = list.value.map((r) => (r.id === id ? res.data : r))
    } catch (err) {
      error.value = extractErrorMessage(err, '更新角色失败')
    } finally {
      loading.value = false
    }
  }

  /** 删除角色 */
  async function deleteRole(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/roles/${id}`)
      list.value = list.value.filter((r) => r.id !== id)
    } catch (err) {
      error.value = extractErrorMessage(err, '删除角色失败')
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return { list, loading, error, fetchRoles, createRole, updateRole, deleteRole, clearError }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
