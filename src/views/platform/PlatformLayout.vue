<script setup lang="ts">
import { RouterView } from 'vue-router'
import { platformNavItems as navItems } from '@/router/nav'

// 平台级布局（ch42 平台运营）：
// - 平台侧边栏：单一来源 platformNavItems（对齐 React PlatformLayout.tsx）
// - 内容区渲染嵌套 RouterView
</script>

<template>
  <div class="flex h-screen" data-testid="platform-layout">
    <aside
      class="w-56 bg-slate-800 text-white flex flex-col shrink-0"
      data-testid="platform-sidebar"
    >
      <div class="p-4 border-b border-white/10">
        <h1 class="text-base font-bold">平台管理</h1>
        <p class="text-xs text-white/60">SaaS IAM</p>
      </div>
      <nav class="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block px-3 py-2 rounded text-sm transition-colors text-white/70 hover:bg-white/10 hover:text-white"
          active-class="text-white bg-slate-700"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
    <main class="flex-1 overflow-auto p-6 bg-gray-50">
      <RouterView />
    </main>
  </div>
</template>
