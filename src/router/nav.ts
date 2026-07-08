// 平台导航单一来源（对齐 React PlatformLayout.tsx 的 navItems）。
// PlatformLayout.vue 与 AppSidebar.vue 共用此定义，消除历史两处重复。
export interface PlatformNavItem {
  label: string
  to: string
  permission?: string
}

export const platformNavItems: PlatformNavItem[] = [
  { label: '租户管理', to: '/platform/tenants', permission: 'platform:read' },
  { label: '应用管理', to: '/platform/apps', permission: 'platform:read' },
  { label: '开放平台', to: '/platform/open-platform', permission: 'platform:read' },
  { label: '平台配置', to: '/platform/config', permission: 'platform:read' },
]
