// ch42 组织架构扩展 store：岗位 / 用户组 / 权限组（与 React 姊妹仓 appStore 对齐）
// ch41/终批：追加组织树 CRUD（与 React 姊妹仓 orgStore 对齐，只增不改既有方法）
// @entry M02.F01.I07
// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client'
import type {
  Position,
  UserGroup,
  PermissionGroup,
  PositionCreateInput,
  PositionUpdateInput,
  UserGroupCreateInput,
  UserGroupUpdateInput,
  PermissionGroupCreateInput,
  PermissionGroupUpdateInput,
} from '../types/org'
import type { OrgNode } from '../types/user'

export const useOrgStore = defineStore('org', () => {
  const positions = ref<Position[]>([])
  const userGroups = ref<UserGroup[]>([])
  const permissionGroups = ref<PermissionGroup[]>([])
  // 组织树（单根）：与 React orgStore.tree 对齐
  const tree = ref<OrgNode | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // —— 岗位 ——
  async function fetchPositions(): Promise<void> {
    loading.value = true
    try {
      const { data } = await apiClient.get<Position[]>('/positions')
      positions.value = data
    } catch (err) {
      error.value = extractErrorMessage(err, '岗位列表加载失败')
    } finally { loading.value = false }
  }
  async function createPosition(input: PositionCreateInput): Promise<Position | null> {
    try {
      const { data } = await apiClient.post<Position>('/positions', input)
      positions.value = [...positions.value, data].sort((a, b) => a.sort - b.sort)
      return data
    } catch (err) { error.value = extractErrorMessage(err, '岗位创建失败'); return null }
  }
  async function updatePosition(id: string, patch: PositionUpdateInput): Promise<Position | null> {
    try {
      const { data } = await apiClient.put<Position>(`/positions/${id}`, patch)
      const idx = positions.value.findIndex((p) => p.id === id)
      if (idx !== -1) positions.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, '岗位更新失败'); return null }
  }
  async function removePosition(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/positions/${id}`)
      positions.value = positions.value.filter((p) => p.id !== id)
      return true
    } catch (err) { error.value = extractErrorMessage(err, '岗位删除失败'); return false }
  }

  // —— 用户组 ——
  async function fetchUserGroups(): Promise<void> {
    loading.value = true
    try {
      const { data } = await apiClient.get<UserGroup[]>('/user-groups')
      userGroups.value = data
    } catch (err) { error.value = extractErrorMessage(err, '用户组加载失败') }
    finally { loading.value = false }
  }
  async function createUserGroup(input: UserGroupCreateInput): Promise<UserGroup | null> {
    try {
      const { data } = await apiClient.post<UserGroup>('/user-groups', input)
      userGroups.value = [...userGroups.value, data]
      return data
    } catch (err) { error.value = extractErrorMessage(err, '用户组创建失败'); return null }
  }
  async function updateUserGroup(id: string, patch: UserGroupUpdateInput): Promise<UserGroup | null> {
    try {
      const { data } = await apiClient.put<UserGroup>(`/user-groups/${id}`, patch)
      const idx = userGroups.value.findIndex((g) => g.id === id)
      if (idx !== -1) userGroups.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, '用户组更新失败'); return null }
  }
  async function removeUserGroup(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/user-groups/${id}`)
      userGroups.value = userGroups.value.filter((g) => g.id !== id)
      return true
    } catch (err) { error.value = extractErrorMessage(err, '用户组删除失败'); return false }
  }

  // —— 权限组 ——
  async function fetchPermissionGroups(): Promise<void> {
    loading.value = true
    try {
      const { data } = await apiClient.get<PermissionGroup[]>('/permission-groups')
      permissionGroups.value = data
    } catch (err) { error.value = extractErrorMessage(err, '权限组加载失败') }
    finally { loading.value = false }
  }
  async function createPermissionGroup(input: PermissionGroupCreateInput): Promise<PermissionGroup | null> {
    try {
      const { data } = await apiClient.post<PermissionGroup>('/permission-groups', input)
      permissionGroups.value = [...permissionGroups.value, data]
      return data
    } catch (err) { error.value = extractErrorMessage(err, '权限组创建失败'); return null }
  }
  async function updatePermissionGroup(id: string, patch: PermissionGroupUpdateInput): Promise<PermissionGroup | null> {
    try {
      const { data } = await apiClient.put<PermissionGroup>(`/permission-groups/${id}`, patch)
      const idx = permissionGroups.value.findIndex((p) => p.id === id)
      if (idx !== -1) permissionGroups.value[idx] = data
      return data
    } catch (err) { error.value = extractErrorMessage(err, '权限组更新失败'); return null }
  }
  async function removePermissionGroup(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/permission-groups/${id}`)
      permissionGroups.value = permissionGroups.value.filter((p) => p.id !== id)
      return true
    } catch (err) { error.value = extractErrorMessage(err, '权限组删除失败'); return false }
  }

  // —— 组织树（ch41/终批，与 React orgStore 对齐，只增）——
  async function fetchOrgTree(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<OrgNode>('/orgs')
      tree.value = data
    } catch (err) {
      error.value = extractErrorMessage(err, '组织架构加载失败')
    } finally {
      loading.value = false
    }
  }
  async function createOrgNode(name: string, parentId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/orgs', { name, parentId })
      await fetchOrgTree()
    } catch (err) {
      loading.value = false
      error.value = extractErrorMessage(err, '组织节点创建失败')
    }
  }
  async function updateOrgNode(id: string, name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.put(`/orgs/${id}`, { name })
      await fetchOrgTree()
    } catch (err) {
      loading.value = false
      error.value = extractErrorMessage(err, '组织节点更新失败')
    }
  }
  async function deleteOrgNode(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/orgs/${id}`)
      await fetchOrgTree()
    } catch (err) {
      loading.value = false
      error.value = extractErrorMessage(err, '组织节点删除失败')
    }
  }

  function clearError(): void { error.value = null }

  return {
    positions, userGroups, permissionGroups, tree, loading, error,
    fetchPositions, createPosition, updatePosition, removePosition,
    fetchUserGroups, createUserGroup, updateUserGroup, removeUserGroup,
    fetchPermissionGroups, createPermissionGroup, updatePermissionGroup, removePermissionGroup,
    fetchOrgTree, createOrgNode, updateOrgNode, deleteOrgNode,
    clearError,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
