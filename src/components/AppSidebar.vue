<script setup lang="ts">
/**
 * 侧边栏（Phase 1.4 对齐 React Layout.tsx）：
 * 分组：首页 / 身份管理 / 认证授权 / 安全控制 / 平台运营 / 平台管理
 * 按 hasPermission 过滤，平台链接跳 /platform/*，租户链接自动加 tenantId 前缀。
 */
import { computed, inject, ref as makeRef, type Ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePermission } from '@/composables/usePermission'
import { platformNavItems } from '@/router/nav'

const { hasPermission } = usePermission()
const route = useRoute()
const tenantId = inject<Ref<string>>('tenantId', makeRef(''))

interface NavItem {
  label: string
  to: string
  permission?: string
  platform?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const tenantNav: NavGroup[] = [
  {
    label: '首页',
    items: [{ label: '工作台', to: 'dashboard', permission: 'dashboard:read' }],
  },
  {
    label: '身份管理',
    items: [
      { label: '部门管理', to: 'departments', permission: 'org:read' },
      { label: '岗位管理', to: 'positions', permission: 'position:read' },
      { label: '角色管理', to: 'roles', permission: 'role:read' },
      { label: '权限组别', to: 'permission-groups', permission: 'permission-group:read' },
      { label: '菜单权限', to: 'menu-permissions', permission: 'menu:read' },
      { label: '用户组别', to: 'user-groups', permission: 'user-group:read' },
      { label: '用户管理', to: 'users', permission: 'user:read' },
    ],
  },
  {
    label: '认证授权',
    items: [
      { label: '登录认证', to: 'login-methods', permission: 'login-method:read' },
      { label: 'Token 管理', to: 'token-config', permission: 'token-config:read' },
      { label: 'API Key', to: 'api-keys', permission: 'api-key:read' },
    ],
  },
  {
    label: '安全控制',
    items: [
      { label: '登录安全', to: 'login-security', permission: 'login-security:read' },
      { label: '密码策略', to: 'password-policy', permission: 'password-policy:read' },
      { label: '风险控制', to: 'risk-control', permission: 'risk-control:read' },
    ],
  },
  {
    label: '平台运营',
    items: [
      { label: '审计日志', to: 'audit', permission: 'audit:read' },
      { label: '消息通知', to: 'notification-config', permission: 'notification-config:read' },
    ],
  },
]

const platformNav: NavGroup[] = [
  {
    label: '平台管理',
    items: platformNavItems.map((it) => ({ ...it, platform: true })),
  },
]

const visibleTenantGroups = computed(() =>
  tenantNav
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.permission || hasPermission(it.permission)),
    }))
    .filter((g) => g.items.length > 0)
)

const visiblePlatformGroups = computed(() =>
  platformNav
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.permission || hasPermission(it.permission)),
    }))
    .filter((g) => g.items.length > 0)
)

/** 构建完整路径：平台路由直接用 to，租户路由拼接 /:tenantId/ */
function buildPath(to: string): string {
  return to.startsWith('/') ? to : `/${tenantId.value}/${to}`
}

function isActive(to: string): boolean {
  if (to.startsWith('/')) return route.path.startsWith(to)
  return route.path.includes(`/${to}`)
}
</script>

<template>
  <aside class="w-56 bg-slate-800 text-white flex flex-col shrink-0">
    <div class="p-4 border-b border-white/10">
      <h1 class="text-base font-bold">SaaS IAM</h1>
      <p class="text-xs text-white/60">租户控制台</p>
    </div>
    <nav class="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">

      <!-- 租户菜单 -->
      <div v-for="group in visibleTenantGroups" :key="group.label" class="mb-2">
        <div class="px-3 py-1 text-xs text-white/30 uppercase tracking-wider">{{ group.label }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="buildPath(item.to)"
          class="block px-3 py-1.5 rounded text-sm transition-colors"
          :class="isActive(item.to) ? 'text-white bg-slate-700' : 'text-white/70 hover:bg-white/10 hover:text-white'"
        >
          {{ item.label }}
        </RouterLink>
      </div>

      <!-- 分隔线 -->
      <div v-if="visibleTenantGroups.length && visiblePlatformGroups.length" class="my-2 border-t border-white/10" />

      <!-- 平台菜单 -->
      <div v-for="group in visiblePlatformGroups" :key="group.label" class="mb-2">
        <div class="px-3 py-1 text-xs text-white/30 uppercase tracking-wider">{{ group.label }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="block px-3 py-1.5 rounded text-sm transition-colors"
          :class="isActive(item.to) ? 'text-white bg-slate-700' : 'text-white/70 hover:bg-white/10 hover:text-white'"
        >
          {{ item.label }}
        </RouterLink>
      </div>

    </nav>
  </aside>
</template>
