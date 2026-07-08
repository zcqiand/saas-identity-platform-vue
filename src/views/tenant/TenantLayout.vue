<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { useTenantStore } from '@/stores/tenant'

// 租户布局（ch39）：从路由 :tenantId 取参 → 拉取租户配置 → 应用主题 → 渲染 AppSidebar + RouterView
// 状态：loading / error / 空 / 正常
// 离开租户时清除主题
const route = useRoute()
const tenant = useTenantStore()

const tenantId = computed(() => {
  const t = route.params.tenantId
  return Array.isArray(t) ? t[0] : t
})

onMounted(async () => {
  if (tenantId.value) {
    await tenant.initFromLocation(String(tenantId.value))
  }
})

watch(tenantId, async (id) => {
  if (id) {
    await tenant.initFromLocation(String(id))
  }
})
</script>

<template>
  <div
    v-if="tenantId && tenant.current"
    class="flex h-screen"
    data-testid="tenant-layout"
  >
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <header
        class="bg-white border-b px-6 py-3 shadow-sm flex items-center justify-between"
        data-testid="tenant-header"
      >
        <h1 class="text-lg font-semibold text-gray-800">
          {{ tenant.current.name }}
        </h1>
        <span class="text-xs text-gray-500">{{ tenant.current.id }}</span>
      </header>
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
  <div
    v-else-if="tenant.loading"
    class="min-h-screen flex items-center justify-center"
    data-testid="tenant-loading"
  >
    <p class="text-gray-500">加载租户配置...</p>
  </div>
  <div
    v-else-if="tenant.error"
    class="min-h-screen flex items-center justify-center"
    data-testid="tenant-error"
  >
    <p class="text-red-600 font-medium">错误：{{ tenant.error }}</p>
  </div>
</template>
