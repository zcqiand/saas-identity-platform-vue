<script setup lang="ts">
// 根组件：dev 启动时模拟已登录 admin（授予全菜单权限）+ provide 主题 + 路由出口。
// 侧边栏由各布局组件提供：/:tenantId → TenantLayout/AppSidebar，/platform/* → PlatformLayout。
// 生产环境由真实 SSO 登录流程（ch40 useSso + authStore.loginWithSso）接管。
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useTenantStore } from './stores/tenant'
import { provideTheme } from './composables/useTheme'
import { setToken } from './api/client'
import type { ThemeConfig } from './types/tenant'

const tenantStore = useTenantStore()

// provide 当前主题（响应式），供后代 useTheme() 注入消费
const theme = computed<ThemeConfig | null>(() => tenantStore.current?.theme ?? null)
provideTheme(theme)

// dev 模拟登录：设置 mock token + 授予 admin 全菜单权限。
// AppSidebar 按 hasPermission 过滤每一项，故需把菜单用到的全部权限码授予 demo 用户，
// 才能看到完整的 身份管理/认证授权/安全控制/平台运营/平台管理 菜单。
// （mock 的 /auth/permissions 与种子 admin 角色未随 v1.1-011 新增模块同步扩展，仅含 user/org/audit，
//  故 demo 在此直接补齐；真实登录走 SSO。）
const auth = useAuthStore()
onMounted(() => {
  if (auth.permissions.length > 0) return
  setToken('dev-mock-token')
  auth.permissions = [
    'dashboard:read',
    'user:read', 'org:read', 'position:read', 'role:read',
    'permission-group:read', 'menu:read', 'user-group:read',
    'login-method:read', 'token-config:read', 'api-key:read',
    'login-security:read', 'password-policy:read', 'risk-control:read',
    'audit:read', 'notification-config:read', 'platform:read',
  ]
})
</script>

<template>
  <router-view />
</template>
