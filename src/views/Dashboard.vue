<script setup lang="ts">
// 工作台：对齐 React Dashboard.tsx
import { onMounted } from 'vue'
import { useTenantStore } from '@/stores/tenant'

const tenant = useTenantStore()

onMounted(async () => {
  await tenant.fetchTenants()
  // 统计由 MSW mock 数据驱动，真实场景可扩展
})
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold">工作台</h2>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">租户</p>
        <p class="text-2xl font-bold mt-1">{{ tenant.list.length }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">用户</p>
        <p class="text-2xl font-bold mt-1">-</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">应用</p>
        <p class="text-2xl font-bold mt-1">-</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="font-medium mb-2">当前租户</h3>
      <p class="text-sm text-gray-600">{{ tenant.current?.name ?? '未选择' }}</p>
    </div>
  </div>
</template>
