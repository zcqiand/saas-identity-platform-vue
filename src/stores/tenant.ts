// ch39 多租户 store：current 租户 + init（从 URL/domain 解析）+ switch（重置后重新解析）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TenantConfig } from '../types/tenant'
import { apiClient, setTenantId } from '../api/client'
import { applyTheme, clearTheme } from '../composables/useTheme'

export const useTenantStore = defineStore('tenant', () => {
  const current = ref<TenantConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 当前租户已订阅的功能模块列表 */
  const subscribedFeatures = computed<string[]>(() => current.value?.features ?? [])

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

  return {
    current,
    loading,
    error,
    subscribedFeatures,
    resolveTenantIdFromPath,
    initFromLocation,
    switchTenant,
    clearError,
  }
})

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
