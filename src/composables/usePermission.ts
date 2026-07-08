// ch40 usePermission：脚本侧权限判定（v-permission 用于模板，本 composable 用于逻辑）
import { useAuthStore } from '../stores/auth'

export function usePermission() {
  const auth = useAuthStore()

  /** 是否拥有某权限码（如 'user:read'） */
  function hasPermission(action: string): boolean {
    return auth.permissions.includes(action)
  }

  /** 是否拥有任一权限码（anyOf） */
  function hasAnyPermission(actions: string[]): boolean {
    return actions.some((a) => auth.permissions.includes(a))
  }

  /** 是否拥有全部权限码（allOf） */
  function hasAllPermissions(actions: string[]): boolean {
    return actions.every((a) => auth.permissions.includes(a))
  }

  /** 是否拥有某角色名（如 'admin'） */
  function hasRole(name: string): boolean {
    return auth.roles.some((r) => r.name === name)
  }

  /** 是否拥有任一角色 */
  function hasAnyRole(names: string[]): boolean {
    return names.some((n) => auth.roles.some((r) => r.name === n))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  }
}
