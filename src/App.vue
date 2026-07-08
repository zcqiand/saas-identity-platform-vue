<script setup lang="ts">
// 根组件：极简布局（侧边栏 + 内容区 router-view）
import { computed, ref } from 'vue'
import { useTenantStore } from './stores/tenant'
import { provideTheme } from './composables/useTheme'
import type { ThemeConfig } from './types/tenant'

const tenantStore = useTenantStore()

// provide 当前主题（响应式），供后代 useTheme() 注入消费
const theme = computed<ThemeConfig | null>(() => tenantStore.current?.theme ?? null)
provideTheme(theme)

const title = ref(import.meta.env.VITE_APP_TITLE ?? 'SaaS 多租户身份平台')
</script>

<template>
  <div class="min-h-screen flex">
    <aside
      class="w-56 text-white p-4 space-y-2"
      :style="{ backgroundColor: 'var(--tenant-sidebar)' }"
    >
      <div class="font-bold text-lg mb-4">{{ title }}</div>
      <router-link to="/acme/dashboard" class="block py-1 px-2 rounded hover:bg-white/10">仪表盘</router-link>
      <router-link to="/acme/users" class="block py-1 px-2 rounded hover:bg-white/10">用户管理</router-link>
      <router-link to="/acme/audit" class="block py-1 px-2 rounded hover:bg-white/10">审计日志</router-link>
    </aside>
    <main class="flex-1 p-6">
      <router-view />
    </main>
  </div>
</template>
