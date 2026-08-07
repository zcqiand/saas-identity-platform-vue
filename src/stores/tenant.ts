// ch39 多租户 store：current 租户 + init（从 URL/domain 解析）+ switch（重置后重新解析）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TenantConfig, TenantCreateInput, ThemeConfig } from '../types/tenant'
import { apiClient, setTenantId } from '../api/client'
import { applyTheme, clearTheme } from '../composables/useTheme'

/** 平台租户详情更新载荷（对齐 React tenantStore.updateTenant） */
export interface TenantUpdateInput {
  name?: string
  theme?: ThemeConfig
  features?: string[]
  config?: { features?: string[]; maxUsers?: number }
}

export const useTenantStore = defineStore('tenant', () => {
  const current = ref<TenantConfig | null>(null)
  const list = ref<TenantConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 当前租户已订阅的功能模块列表（v0.3.0：shared 把 features 移到了 config.features） */
  const subscribedFeatures = computed<string[]>(() => {
    const t = current.value as { features?: string[]; config?: { features?: string[] } } | null
    if (!t) return []
    return t.features ?? t.config?.features ?? []
  })

  /** 从路径中解析租户 id（取第一段） */
  function resolveTenantIdFromPath(path: string): string {
    const clean = path.replace(/^\/+/, '')
    const seg = clean.split('/')[0] ?? ''
    return seg
  }

  /** 根据 tenantId 拉取租户配置并写入 store；同时把 id 注入到 apiClient 与主题 */
  async function initFromLocation(tenantId: string): Promise<void> {
    if (!tenantId) {
      current.value = null
      error.value = '未识别到租户标识'
      setTenantId(null)
      clearTheme()
      return
    }
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<TenantConfig>(`/tenants/${tenantId}`)
      current.value = res.data
      setTenantId(res.data.id)
      applyTheme(res.data.theme)
    } catch (err) {
      current.value = null
      error.value = extractErrorMessage(err, '租户加载失败')
      setTenantId(null)
      clearTheme()
    } finally {
      loading.value = false
    }
  }

  /** 切换租户：清空当前态，重新解析新租户 */
  async function switchTenant(tenantId: string): Promise<void> {
    current.value = null
    error.value = null
    await initFromLocation(tenantId)
  }

  function clearError() {
    error.value = null
  }

  /** 拉取租户列表（分页）。兼容 {items:[]} 与裸数组两种响应 shape */
  async function fetchTenants(keyword?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<{ items: TenantConfig[] } | TenantConfig[]>('/tenants', {
        params: keyword ? { keyword } : undefined,
      })
      const data = res.data as { items?: TenantConfig[] } | TenantConfig[]
      list.value = Array.isArray(data) ? data : (data.items ?? [])
    } catch (err) {
      error.value = extractErrorMessage(err, '租户列表加载失败')
    } finally {
      loading.value = false
    }
  }

  /** 创建租户 */
  async function createTenant(input: TenantCreateInput): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/tenants', input)
    } catch (err) {
      error.value = extractErrorMessage(err, '创建租户失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除租户 */
  async function deleteTenant(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/tenants/${id}`)
    } catch (err) {
      error.value = extractErrorMessage(err, '删除租户失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 平台租户详情：按 id 拉取单个租户写入 current（对齐 React tenantStore.fetchTenant）。
   * 注意：刻意不调用 applyTheme——平台管理页不应被租户主题染色（不同于 initFromLocation
   * 会把主题注入到全局 CSS 变量）。平台租户详情在 PlatformLayout 下，主题保持平台默认。
   */
  async function fetchTenant(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get<TenantConfig>(`/tenants/${id}`)
      current.value = res.data
    } catch (err) {
      current.value = null
      error.value = extractErrorMessage(err, '租户加载失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 平台租户详情：更新单个租户（对齐 React tenantStore.updateTenant）。
   * PUT /tenants/:id；失败抛错并由调用方处理（页面 submitting/saved 状态）。
   */
  async function updateTenant(id: string, payload: TenantUpdateInput): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.put(`/tenants/${id}`, payload)
    } catch (err) {
      error.value = extractErrorMessage(err, '保存租户失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    current,
    list,
    loading,
    error,
    subscribedFeatures,
    resolveTenantIdFromPath,
    initFromLocation,
    switchTenant,
    clearError,
    fetchTenants,
    createTenant,
    deleteTenant,
    fetchTenant,
    updateTenant,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
