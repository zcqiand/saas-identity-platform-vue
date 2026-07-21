// @entry M01.F01.I01
// @entry M01.F01.I02
// @entry M01.F01.I03
// @entry M01.F01.I04
// @entry M01.F01.I05
// @entry M01.F01.I06
// @entry M01.F01.I07
// @entry M01.F01.I08
// @entry M01.F01.I09
// @entry M01.F01.I10
// @entry M01.F01.I11
// @entry M01.F01.I01
// @entry M01.F01.I02
// @entry M01.F01.I03
// @entry M01.F01.I04
// @entry M01.F01.I05
// @entry M01.F01.I06
// @entry M01.F01.I07
// @entry M01.F01.I08
// @entry M01.F01.I09
// @entry M01.F01.I10
// @entry M01.F01.I11
// @entry M01.F01.I01
// @entry M01.F01.I02
// @entry M01.F01.I03
// @entry M01.F01.I04
// @entry M01.F01.I05
// @entry M01.F01.I06
// @entry M01.F01.I07
// @entry M01.F01.I08
// @entry M01.F01.I09
// @entry M01.F01.I10
// @entry M01.F01.I11
// @entry M01.F01.I08
<script setup lang="ts">
// 租户布局（ch39/ch41）：侧边栏 + 内容区 + 注入 tenantId 供 AppSidebar 使用
import { computed, provide, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { useTenantStore } from '@/stores/tenant'

const route = useRoute()
const tenant = useTenantStore()

const tenantId = computed<string>(() => {
  const t = route.params.tenantId
  return Array.isArray(t) ? t[0] ?? '' : (t ?? '')
})

// 注入给 AppSidebar 使用
provide('tenantId', tenantId)

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
  <div data-fn="M01.F01.I08" v-if="tenantId && tenant.current" class="flex h-screen" data-testid="tenant-layout">
    <AppSidebar :tenant-id="tenantId" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white border-b px-6 py-3 shadow-sm flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-800">{{ tenant.current.name }}</h1>
        <span class="text-xs text-gray-500">{{ tenant.current.id }}</span>
      </header>
      <main class="flex-1 overflow-auto p-6 bg-gray-50">
        <RouterView />
      </main>
    </div>
  </div>
  <div v-else-if="tenant.loading" class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">加载租户配置...</p>
  </div>
  <div v-else-if="tenant.error" class="min-h-screen flex items-center justify-center">
    <p class="text-red-600 font-medium">错误：{{ tenant.error }}</p>
  </div>
</template>
