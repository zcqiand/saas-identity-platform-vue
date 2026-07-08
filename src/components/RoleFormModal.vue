<script setup lang="ts">
// 角色新建/编辑弹窗（对齐 React rbac/RoleFormModal.tsx）。
// 表单：name + 资源权限（ALL_PERMISSIONS 多选）+ 菜单权限（选 app→勾菜单）。
// 沿用 Vue 既有弹窗范式（Teleport + watch 同步 + emit submit/cancel），参考 TenantFormModal.vue。
import { ref, watch, computed } from 'vue'
import type { RoleCreateInput, MenuPermission } from '../types/rbac'
import { ALL_PERMISSIONS } from '../types/rbac'
import { useAppStore } from '../stores/app'
import type { MenuItem } from '../types/app'

export interface RoleFormValues {
  name: string
  permissions: string[]
  menuPermissions: MenuPermission[]
}

interface RoleFormProps {
  visible: boolean
  mode: 'create' | 'edit'
  role?: Partial<RoleCreateInput & { id: string; menuPermissions: MenuPermission[] }>
  loading?: boolean
}

const props = withDefaults(defineProps<RoleFormProps>(), { loading: false })

const emit = defineEmits<{
  submit: [values: RoleFormValues]
  cancel: []
}>()

const appStore = useAppStore()

const name = ref('')
const permissions = ref<string[]>([])
const menuAppId = ref('')
const checkedMenus = ref<Set<string>>(new Set())
const errors = ref<Record<string, string>>({})

// 应用菜单（useAppStore.menus 即当前选中应用的菜单列表）
const currentAppMenus = computed<MenuItem[]>(() => appStore.menus)
const topMenus = computed(() => currentAppMenus.value.filter((m) => m.parentId === null))

function getChildren(parentId: string): MenuItem[] {
  return currentAppMenus.value.filter((m) => m.parentId === parentId)
}

function getAllDescendantIds(parentId: string): string[] {
  const children = getChildren(parentId)
  return children.flatMap((c) => [c.id, ...getAllDescendantIds(c.id)])
}

// 打开时重置表单 + 拉应用列表 + 同步预填
watch(
  () => [props.visible, props.role],
  () => {
    if (props.visible) {
      name.value = props.role?.name ?? ''
      permissions.value = [...(props.role?.permissions ?? [])]
      menuAppId.value = ''
      checkedMenus.value = new Set()
      errors.value = {}
      appStore.fetchApps()
      // edit 模式：若有 menuPermissions，预勾选对应菜单
      if (props.mode === 'edit' && props.role?.menuPermissions) {
        const checked = new Set<string>()
        for (const mp of props.role.menuPermissions) {
          if (mp.actions.length > 0) checked.add(mp.menuId)
        }
        checkedMenus.value = checked
      }
    }
  },
  { immediate: true },
)

// 切换应用时拉取该应用菜单
watch(menuAppId, (id) => {
  if (id) appStore.fetchMenus(id)
})

function validate(): boolean {
  const next: Record<string, string> = {}
  if (!name.value.trim()) next.name = '请输入角色名称'
  if (permissions.value.length === 0) next.permissions = '请至少选择一个权限'
  errors.value = next
  return Object.keys(next).length === 0
}

function handleSubmit() {
  if (!validate()) return
  const menuPermissions: MenuPermission[] = []
  for (const menuId of checkedMenus.value) {
    menuPermissions.push({ menuId, actions: ['view', 'create', 'update', 'delete'] })
  }
  emit('submit', { name: name.value.trim(), permissions: [...permissions.value], menuPermissions })
}

function togglePermission(p: string) {
  const idx = permissions.value.indexOf(p)
  if (idx >= 0) permissions.value.splice(idx, 1)
  else permissions.value.push(p)
}

function toggleMenu(menuId: string) {
  const next = new Set(checkedMenus.value)
  if (next.has(menuId)) next.delete(menuId)
  else next.add(menuId)
  checkedMenus.value = next
}

function toggleMenuAll(menuId: string) {
  const descendants = getAllDescendantIds(menuId)
  const allIds = [menuId, ...descendants]
  const allChecked = allIds.every((id) => checkedMenus.value.has(id))
  const next = new Set(checkedMenus.value)
  if (allChecked) {
    for (const id of allIds) next.delete(id)
  } else {
    for (const id of allIds) next.add(id)
  }
  checkedMenus.value = next
}

function isMenuChecked(menuId: string): boolean {
  return checkedMenus.value.has(menuId)
}

function isMenuAllChecked(menuId: string): boolean {
  const descendants = getAllDescendantIds(menuId)
  return [menuId, ...descendants].every((id) => checkedMenus.value.has(id))
}

function isMenuIndeterminate(menuId: string): boolean {
  const descendants = getAllDescendantIds(menuId)
  const allIds = [menuId, ...descendants]
  const count = allIds.filter((id) => checkedMenus.value.has(id)).length
  return count > 0 && count < allIds.length
}

function setIndeterminate(el: HTMLInputElement, indeterminate: boolean) {
  if (el) el.indeterminate = indeterminate
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        data-testid="role-form"
        class="bg-white rounded-lg shadow-xl w-[640px] max-w-[95vw] max-h-[90vh] flex flex-col"
        @submit.prevent="handleSubmit"
      >
        <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-semibold">{{ mode === 'create' ? '新建角色' : '编辑角色' }}</h3>
        </div>

        <div class="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <!-- 角色名称 -->
          <div>
            <label class="block text-sm mb-1 font-medium">角色名称</label>
            <input
              v-model="name"
              data-testid="role-name-input"
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入角色名称"
            />
            <p v-if="errors.name" class="text-red-600 text-xs mt-1">{{ errors.name }}</p>
          </div>

          <!-- 资源权限 -->
          <div>
            <label class="block text-sm mb-2 font-medium">资源权限</label>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="p in ALL_PERMISSIONS" :key="p" class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  :data-testid="`perm-${p}`"
                  :checked="permissions.includes(p)"
                  class="rounded"
                  @change="togglePermission(p)"
                />
                <span class="font-mono text-xs text-gray-700">{{ p }}</span>
              </label>
            </div>
            <p v-if="errors.permissions" class="text-red-600 text-xs mt-1">{{ errors.permissions }}</p>
          </div>

          <!-- 菜单权限 -->
          <div>
            <label class="block text-sm mb-2 font-medium">菜单权限</label>
            <template v-if="appStore.apps.length === 0">
              <p class="text-xs text-gray-400">暂无可用应用，请先在平台创建应用</p>
            </template>
            <template v-else>
              <select
                v-model="menuAppId"
                data-testid="role-menu-app"
                class="border rounded px-3 py-1.5 text-sm w-full mb-2"
              >
                <option value="">选择应用以配置菜单权限</option>
                <option v-for="app in appStore.apps" :key="app.id" :value="app.id">{{ app.name }}</option>
              </select>

              <p v-if="menuAppId && currentAppMenus.length === 0" class="text-xs text-gray-400 py-2">
                该应用暂无菜单
              </p>

              <div
                v-if="menuAppId && currentAppMenus.length > 0"
                class="border rounded p-2 max-h-48 overflow-y-auto bg-gray-50"
              >
                <table class="w-full text-sm">
                  <tbody>
                    <template v-for="menu in topMenus" :key="menu.id">
                      <tr>
                        <td class="py-1">
                          <div class="flex items-center gap-2">
                            <input
                              type="checkbox"
                              :checked="isMenuAllChecked(menu.id)"
                              :ref="(el) => setIndeterminate(el as HTMLInputElement, isMenuIndeterminate(menu.id))"
                              class="rounded"
                              @change="toggleMenuAll(menu.id)"
                            />
                            <span :class="getChildren(menu.id).length > 0 ? 'font-medium' : 'text-gray-700'">
                              {{ menu.name }}
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr v-for="child in getChildren(menu.id)" :key="child.id">
                        <td class="py-1 pl-8">
                          <div class="flex items-center gap-2">
                            <input
                              type="checkbox"
                              :checked="isMenuChecked(child.id)"
                              class="rounded"
                              @change="toggleMenu(child.id)"
                            />
                            <span class="text-sm text-gray-600">{{ child.name }}</span>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>

              <p v-if="menuAppId && checkedMenus.size > 0" class="text-xs text-green-600 mt-1">
                已选 {{ checkedMenus.size }} 个菜单（包含子菜单）
              </p>
            </template>
          </div>
        </div>

        <div class="px-6 py-3 flex justify-end gap-2 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            data-testid="role-cancel"
            :disabled="loading"
            class="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="emit('cancel')"
          >
            取消
          </button>
          <button
            type="submit"
            data-testid="role-submit"
            :disabled="loading"
            class="px-4 py-2 text-sm rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
