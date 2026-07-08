<script setup lang="ts">
// 组织信息概览（ch41 占位实现）：展示当前租户名，后续可扩展组织树编辑。
// 仓库历史缺该视图导致 router 悬空 import，此处补最小实现以恢复可加载性。
import { useTenantStore } from '@/stores/tenant'

const tenantStore = useTenantStore()
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">组织信息</h2>
    <div class="bg-white rounded shadow p-6">
      <p class="text-sm text-gray-500">当前租户</p>
      <p class="text-lg font-semibold mt-1">{{ tenantStore.current?.name ?? '未加载' }}</p>
    </div>
  </div>
</template>
