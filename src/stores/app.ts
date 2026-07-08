// ch42 应用管理 + 菜单管理 store（与 React 姊妹仓 appStore 对齐）
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../api/client'
import type { App, MenuItem, AppCreateInput, AppUpdateInput, MenuCreateInput, MenuUpdateInput } from '../types/app'

export const useAppStore = defineStore('app', () => {
  const apps = ref<App[]>([])
  const menus = ref<MenuItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchApps(keyword?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<App[]>('/apps', { params: keyword ? { keyword } : {} })
      apps.value = res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '应用列表加载失败')
      apps.value = []
    } finally {
      loading.value = false
    }
  }

  async function createApp(input: AppCreateInput): Promise<App | null> {
    try {
      const res = await apiClient.post<App>('/apps', input)
      apps.value = [...apps.value, res.data].sort((a, b) => a.sort - b.sort)
      return res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '应用创建失败')
      return null
    }
  }

  async function updateApp(id: string, patch: AppUpdateInput): Promise<App | null> {
    try {
      const res = await apiClient.put<App>(`/apps/${id}`, patch)
      const idx = apps.value.findIndex((a) => a.id === id)
      if (idx !== -1) apps.value[idx] = res.data
      return res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '应用更新失败')
      return null
    }
  }

  async function removeApp(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/apps/${id}`)
      apps.value = apps.value.filter((a) => a.id !== id)
      // 同步清掉本应用菜单
      menus.value = menus.value.filter((m) => m.appId !== id)
      return true
    } catch (err) {
      error.value = extractErrorMessage(err, '应用删除失败')
      return false
    }
  }

  async function fetchMenus(appId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<MenuItem[]>('/menus', { params: { appId } })
      menus.value = res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '菜单列表加载失败')
      menus.value = []
    } finally {
      loading.value = false
    }
  }

  async function createMenu(input: MenuCreateInput): Promise<MenuItem | null> {
    try {
      const res = await apiClient.post<MenuItem>('/menus', input)
      menus.value = [...menus.value, res.data].sort((a, b) => a.sort - b.sort)
      return res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '菜单创建失败')
      return null
    }
  }

  async function updateMenu(id: string, patch: MenuUpdateInput): Promise<MenuItem | null> {
    try {
      const res = await apiClient.put<MenuItem>(`/menus/${id}`, patch)
      const idx = menus.value.findIndex((m) => m.id === id)
      if (idx !== -1) menus.value[idx] = res.data
      return res.data
    } catch (err) {
      error.value = extractErrorMessage(err, '菜单更新失败')
      return null
    }
  }

  async function removeMenu(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/menus/${id}`)
      menus.value = menus.value.filter((m) => m.id !== id)
      return true
    } catch (err) {
      error.value = extractErrorMessage(err, '菜单删除失败')
      return false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    apps,
    menus,
    loading,
    error,
    fetchApps,
    createApp,
    updateApp,
    removeApp,
    fetchMenus,
    createMenu,
    updateMenu,
    removeMenu,
    clearError,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
