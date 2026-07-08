// ch39 租户主题：通过 provide/inject + CSS 变量实现响应式主题切换
import { provide, inject, readonly, type Ref } from 'vue'
import type { ThemeConfig } from '../types/tenant'

export const THEME_VARS = {
  primary: '--tenant-primary',
  sidebar: '--tenant-sidebar',
  logoText: '--tenant-logo-text',
} as const

const TENANT_THEME_KEY = Symbol('tenant-theme')

/** 将主题写入 document.documentElement 的 CSS 变量 */
export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement
  root.style.setProperty(THEME_VARS.primary, theme.primary)
  root.style.setProperty(THEME_VARS.sidebar, theme.sidebar)
  root.style.setProperty(THEME_VARS.logoText, theme.logoText)
}

/** 清除所有租户主题 CSS 变量（登出/切换时调用） */
export function clearTheme(): void {
  const root = document.documentElement
  root.style.removeProperty(THEME_VARS.primary)
  root.style.removeProperty(THEME_VARS.sidebar)
  root.style.removeProperty(THEME_VARS.logoText)
}

/** provide 当前主题 ref（根组件使用） */
export function provideTheme(themeRef: Ref<ThemeConfig | null>): void {
  provide(TENANT_THEME_KEY, readonly(themeRef))
}

/** inject 当前主题 ref（任意后代组件使用） */
export function useTheme(): Ref<ThemeConfig | null> {
  const theme = inject<Ref<ThemeConfig | null> | null>(TENANT_THEME_KEY, null)
  if (theme === null) {
    throw new Error('useTheme 必须在 provideTheme 之后使用')
  }
  return theme
}
