// ch41 user store：部门树 + 用户列表（setup-store 风格）
// v0.3.0 重命名（原 orgId → departmentId；orgTree → departmentTree；OrgNode → DepartmentNode）
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
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client'
import type { User, DepartmentNode, UserQuery, UserRole } from '../types/user'
import type { PageResult } from '../types/user'

export const useUserStore = defineStore('user', () => {
  const departmentTree = ref<DepartmentNode | null>(null)
  const users = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastQuery = ref<UserQuery>({ page: 1, pageSize: 10 })

  async function fetchDepartmentTree(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<DepartmentNode>('/departments')
      departmentTree.value = res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '部门架构加载失败')
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
    departmentTree,
    users,
    total,
    loading,
    error,
    lastQuery,
    fetchDepartmentTree,
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
