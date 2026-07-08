<script setup lang="ts">
// 菜单权限矩阵（对齐 React rbac/MenuPermissions.tsx）。
// 选应用 + 选角色 → 渲染「菜单 × 操作」矩阵（查/建/改/删 + 全选），父菜单全选联动子菜单。
// 保存调 roleStore.updateRole(menuPermissions)，复用既有 /roles PUT 端点（无需新增 handler）。
import { ref, computed, onMounted, watch } from 'vue'
import { useRoleStore } from '@/stores/rbac'
import { useAppStore } from '@/stores/app'
import type { MenuPermission } from '@/types/rbac'
import type { MenuItem } from '@/types/app'

const roleStore = useRoleStore()
const appStore = useAppStore()

const ALL_ACTIONS = ['view', 'create', 'update', 'delete'] as const
const ACTION_LABELS: Record<string, string> = { view: '查', create: '建', update: '改', delete: '删' }

const selectedAppId = ref('')
const selectedRoleId = ref('')
const saving = ref(false)

// 本地权限态：roleId -> menuId -> actions[]
const permMap = ref<Record<string, Record<string, string[]>>>({})

const roles = computed(() => roleStore.list)
// 当前应用的菜单（useAppStore.menus 即 fetchMenus(appId) 后的当前应用菜单列表，对齐 React currentAppMenus）
const currentAppMenus = computed<MenuItem[]>(() => appStore.menus)
const topMenus = computed(() => currentAppMenus.value.filter((m) => m.parentId === null))

onMounted(() => {
  roleStore.fetchRoles()
  appStore.fetchApps()
})

// 切换应用时拉取该应用菜单
watch(selectedAppId, (id) => {
  if (id) appStore.fetchMenus(id)
})

// 角色首次载入时初始化 permMap（保留已有值，避免覆盖本地编辑）
watch(roles, (list) => {
  if (list.length === 0) return
  const next = { ...permMap.value }
  for (const role of list) {
    if (!next[role.id]) {
      next[role.id] = {}
      for (const mp of role.menuPermissions ?? []) {
        next[role.id][mp.menuId] = [...mp.actions]
      }
    }
  }
  permMap.value = next
}, { immediate: true })

// 应用切换后：清掉当前角色中不属于本应用的旧 menuId，避免脏数据
watch([selectedAppId, selectedRoleId, currentAppMenus], () => {
  if (!selectedAppId.value || !selectedRoleId.value) return
  const rolePerms = { ...(permMap.value[selectedRoleId.value] ?? {}) }
  const appMenuIds = new Set(currentAppMenus.value.map((m) => m.id))
  for (const menuId of Object.keys(rolePerms)) {
    if (!appMenuIds.has(menuId)) delete rolePerms[menuId]
  }
  permMap.value = { ...permMap.value, [selectedRoleId.value]: rolePerms }
})

function getChildren(parentId: string): MenuItem[] {
  return currentAppMenus.value.filter((m) => m.parentId === parentId)
}

function getAllDescendants(parentId: string): string[] {
  const children = getChildren(parentId)
  return children.flatMap((c) => [c.id, ...getAllDescendants(c.id)])
}

function isActionChecked(roleId: string, menuId: string, action: string): boolean {
  return permMap.value[roleId]?.[menuId]?.includes(action) ?? false
}

function isMenuAllChecked(roleId: string, menuId: string): boolean {
  return (permMap.value[roleId]?.[menuId]?.length ?? 0) === 4
}

function isMenuIndeterminate(roleId: string, menuId: string): boolean {
  const len = permMap.value[roleId]?.[menuId]?.length ?? 0
  return len > 0 && len < 4
}

function toggleAction(roleId: string, menuId: string, action: string) {
  const rolePerms = { ...(permMap.value[roleId] ?? {}), [menuId]: [...(permMap.value[roleId]?.[menuId] ?? [])] }
  const menuPerms = rolePerms[menuId]
  rolePerms[menuId] = menuPerms.includes(action) ? menuPerms.filter((a) => a !== action) : [...menuPerms, action]
  permMap.value = { ...permMap.value, [roleId]: rolePerms }
}

function toggleMenuAll(roleId: string, menuId: string) {
  const current = permMap.value[roleId]?.[menuId] ?? []
  const willCheck = current.length !== 4
  const rolePerms = { ...(permMap.value[roleId] ?? {}) }
  const descendants = getAllDescendants(menuId)
  for (const mid of [menuId, ...descendants]) {
    rolePerms[mid] = willCheck ? [...ALL_ACTIONS] : []
  }
  permMap.value = { ...permMap.value, [roleId]: rolePerms }
}

async function handleSave() {
  if (!selectedRoleId.value) return
  saving.value = true
  try {
    const menuPermissions: MenuPermission[] = []
    for (const menu of currentAppMenus.value) {
      const actions = permMap.value[selectedRoleId.value]?.[menu.id]
      if (actions && actions.length > 0) {
        menuPermissions.push({ menuId: menu.id, actions: actions as MenuPermission['actions'] })
      }
    }
    await roleStore.updateRole(selectedRoleId.value, { menuPermissions })
    await roleStore.fetchRoles()
  } finally {
    saving.value = false
  }
}

const hasChanges = computed(() => selectedRoleId.value && currentAppMenus.value.length > 0)

function setIndeterminate(el: HTMLInputElement, indeterminate: boolean) {
  if (el) el.indeterminate = indeterminate
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">菜单权限</h2>
      <button
        v-if="hasChanges"
        data-testid="btn-save"
        :disabled="saving"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
        @click="handleSave"
      >
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </div>

    <div v-if="roleStore.error" role="alert" class="text-red-600 text-sm bg-red-50 p-2 rounded">
      {{ roleStore.error }}
    </div>

    <!-- 选择器 -->
    <div class="flex items-center gap-4 bg-white p-4 rounded shadow">
      <div>
        <label class="block text-sm font-medium mb-1">选择应用</label>
        <select
          v-model="selectedAppId"
          data-testid="select-app"
          class="border rounded px-3 py-1.5 text-sm min-w-[200px]"
        >
          <option value="">请选择应用</option>
          <option v-for="app in appStore.apps" :key="app.id" :value="app.id">{{ app.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">选择角色</label>
        <select
          v-model="selectedRoleId"
          data-testid="select-role"
          class="border rounded px-3 py-1.5 text-sm min-w-[150px]"
        >
          <option value="">请选择角色</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="!selectedAppId && !selectedRoleId" class="text-gray-400 text-center py-12">
      请先选择应用和角色
    </div>

    <div
      v-if="selectedAppId && selectedRoleId && currentAppMenus.length === 0"
      class="text-gray-400 text-center py-12"
    >
      该应用暂无菜单
    </div>

    <div
      v-if="selectedAppId && selectedRoleId && currentAppMenus.length > 0"
      class="bg-white rounded shadow overflow-auto"
    >
      <table class="text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-2 text-left w-48">菜单</th>
            <th class="px-4 py-2 text-center w-16">全选</th>
            <th colspan="4" class="px-2 py-2 text-center border-l border-gray-200">
              {{ roles.find((r) => r.id === selectedRoleId)?.name }}
            </th>
          </tr>
          <tr class="text-xs text-gray-500 bg-gray-100">
            <th class="px-4 py-1 text-left" />
            <th class="px-4 py-1 text-center border-l border-gray-200">☑</th>
            <th
              v-for="a in ALL_ACTIONS"
              :key="a"
              class="px-2 py-1 text-center w-10"
              :data-testid="`header-${a}`"
            >
              {{ ACTION_LABELS[a] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="menu in topMenus" :key="menu.id">
            <tr :data-testid="`menu-row-${menu.id}`" class="border-t bg-white hover:bg-gray-50">
              <td class="px-4 py-2 font-medium">
                <div class="flex items-center gap-1">
                  <span v-if="getChildren(menu.id).length > 0" class="text-gray-400 mr-1">▶</span>
                  {{ menu.name }}
                </div>
              </td>
              <td class="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  :data-testid="`perm-all-${menu.id}`"
                  :checked="isMenuAllChecked(selectedRoleId, menu.id)"
                  :ref="(el) => setIndeterminate(el as HTMLInputElement, isMenuIndeterminate(selectedRoleId, menu.id))"
                  class="rounded"
                  @change="toggleMenuAll(selectedRoleId, menu.id)"
                />
              </td>
              <td v-for="a in ALL_ACTIONS" :key="a" class="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  :data-testid="`perm-${a}-${menu.id}`"
                  :checked="isActionChecked(selectedRoleId, menu.id, a)"
                  class="rounded"
                  @change="toggleAction(selectedRoleId, menu.id, a)"
                />
              </td>
            </tr>
            <tr
              v-for="child in getChildren(menu.id)"
              :key="child.id"
              :data-testid="`menu-row-${child.id}`"
              class="border-t bg-gray-50 hover:bg-gray-100"
            >
              <td class="px-4 py-2 pl-10 text-gray-600 text-sm">
                <span class="flex items-center gap-1">
                  <span class="text-gray-400">└</span>
                  {{ child.name }}
                </span>
              </td>
              <td class="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  :data-testid="`perm-all-${child.id}`"
                  :checked="isMenuAllChecked(selectedRoleId, child.id)"
                  :ref="(el) => setIndeterminate(el as HTMLInputElement, isMenuIndeterminate(selectedRoleId, child.id))"
                  class="rounded"
                  @change="toggleMenuAll(selectedRoleId, child.id)"
                />
              </td>
              <td v-for="a in ALL_ACTIONS" :key="a" class="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  :data-testid="`perm-${a}-${child.id}`"
                  :checked="isActionChecked(selectedRoleId, child.id, a)"
                  class="rounded"
                  @change="toggleAction(selectedRoleId, child.id, a)"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
