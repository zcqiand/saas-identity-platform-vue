// ch41 user store：组织树 + 用户列表（setup-store 风格）
// @entry M02.F02.I08
// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
// @entry M02.F02.I08
// @entry M02.F02.I09
// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
// @entry M02.F02.I08
// @entry M02.F02.I09
// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
// @entry M02.F02.I08
// @entry M02.F02.I09
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client'
import type { User, OrgNode, UserQuery, UserRole } from '../types/user'
import type { PageResult } from '../types/user'

export const useUserStore = defineStore('user', () => {
  const orgTree = ref<OrgNode | null>(null)
  const users = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastQuery = ref<UserQuery>({ page: 1, pageSize: 10 })

  async function fetchOrgTree(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<OrgNode>('/orgs')
      orgTree.value = res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '组织架构加载失败')
    } finally {
      loading.value = false
    }
  }

  async function fetchUsers(query: UserQuery): Promise<void> {
    loading.value = true
    error.value = null
    lastQuery.value = { ...query }
    try {
      const res = await apiClient.get<PageResult<User>>('/users', { params: query })
      users.value = res.data.items
      total.value = res.data.total
    } catch (err) {
      error.value = extractErrorMessage(err, '用户列表加载失败')
      users.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function assignRoles(userId: string, roles: UserRole[]): Promise<void> {
    try {
      const res = await apiClient.put<User>(`/users/${userId}`, { roles })
      // 同步本地列表中的同一用户
      const idx = users.value.findIndex((u) => u.id === userId)
      if (idx !== -1) {
        users.value[idx] = res.data
      }
    } catch (err) {
      error.value = extractErrorMessage(err, '角色分配失败')
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    orgTree,
    users,
    total,
    loading,
    error,
    lastQuery,
    fetchOrgTree,
    fetchUsers,
    assignRoles,
    clearError,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
