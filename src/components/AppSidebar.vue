<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'

// 租户级侧边栏（ch39 多租户 + ch40 RBAC + 后续 ch41 增补）：
// - 列出所有租户可见的功能入口
// - 按当前用户 permissions 过滤（无权限的菜单项不渲染）
// - 顶栏不再有业务按钮，只保留"业务菜单导航"职责

void useAuthStore() // 侧边栏仅依赖 usePermission,保留导入以触发 store 初始化副作用
const { hasPermission } = usePermission()

interface NavItem {
  label: string
  to: string
  permission: string
}

const navItems: NavItem[] = [
  { label: '工作台',     to: 'dashboard',         permission: 'dashboard:read' },
  { label: '用户管理',   to: 'users',             permission: 'user:read' },
  { label: '组织架构',   to: 'org',               permission: 'org:read' },
  { label: '角色与权限', to: 'roles',             permission: 'role:read' },
  { label: '菜单权限',   to: 'menu-permissions',  permission: 'menu:read' },
  { label: '岗位',       to: 'positions',         permission: 'position:read' },
  { label: '用户组',     to: 'user-groups',       permission: 'user-group:read' },
  { label: '权限组',     to: 'permission-groups', permission: 'permission-group:read' },
  { label: '审计日志',   to: 'audit',             permission: 'audit:read' },
  { label: '登录方式',   to: 'login-methods',     permission: 'login-method:read' },
  { label: '令牌配置',   to: 'token-config',      permission: 'token-config:read' },
  { label: 'API Key',    to: 'api-keys',          permission: 'api-key:read' },
  { label: '登录安全',   to: 'login-security',    permission: 'login-security:read' },
  { label: '密码策略',   to: 'password-policy',   permission: 'password-policy:read' },
  { label: '风控配置',   to: 'risk-control',      permission: 'risk-control:read' },
  { label: '通知配置',   to: 'notification-config', permission: 'notification-config:read' },
]

const visibleItems = computed(() => navItems.filter((it) => hasPermission(it.permission)))
</script>

<template>
  <aside
    class="w-56 bg-slate-800 text-white flex flex-col shrink-0"
    data-testid="tenant-sidebar"
  >
    <div class="p-4 border-b border-white/10">
      <h1 class="text-base font-bold">租户控制台</h1>
      <p class="text-xs text-white/60">SaaS IAM</p>
    </div>
    <nav class="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="block px-3 py-2 rounded text-sm transition-colors text-white/70 hover:bg-white/10 hover:text-white"
        active-class="text-white bg-slate-700"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
