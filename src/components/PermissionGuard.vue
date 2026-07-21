// @entry M03.F01.I01
// @entry M03.F01.I02
// @entry M03.F01.I03
// @entry M03.F01.I04
// @entry M03.F01.I05
// @entry M03.F01.I06
// @entry M03.F01.I07
// @entry M03.F01.I08
// @entry M03.F01.I09
// @entry M03.F01.I10
// @entry M03.F01.I01
// @entry M03.F01.I02
// @entry M03.F01.I03
// @entry M03.F01.I04
// @entry M03.F01.I05
// @entry M03.F01.I06
// @entry M03.F01.I07
// @entry M03.F01.I08
// @entry M03.F01.I09
// @entry M03.F01.I10
// @entry M03.F01.I01
// @entry M03.F01.I02
// @entry M03.F01.I03
// @entry M03.F01.I04
// @entry M03.F01.I05
// @entry M03.F01.I06
// @entry M03.F01.I07
// @entry M03.F01.I08
// @entry M03.F01.I09
// @entry M03.F01.I10
// @entry M03.F01.I09
<script setup lang="ts">
/**
 * 权限守卫组件：根据当前用户权限条件渲染。
 * 用法：
 *   <PermissionGuard permission="user:create">
 *     <Button>新增用户</Button>
 *   </PermissionGuard>
 *
 *   <PermissionGuard :permission="['user:read', 'user:create']">
 *     <Button>用户操作</Button>
 *   </PermissionGuard>
 */
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  /** 权限码或权限码数组（数组为 anyOf 模式，任一匹配即放行） */
  permission: string | string[]
  /** 无权限时渲染的降级内容，默认 null */
  fallback?: unknown
}>()

const auth = useAuthStore()

const has = computed(() => {
  const perms = auth.permissions
  if (Array.isArray(props.permission)) {
    return props.permission.some((p) => perms.includes(p))
  }
  return perms.includes(props.permission)
})
</script>

<template>
  <slot data-fn="M03.F01.I09" v-if="has" />
  <template v-else-if="fallback">
    <slot name="fallback" />
  </template>
</template>
