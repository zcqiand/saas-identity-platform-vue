<script setup lang="ts">
// 角色管理列表（对齐 React rbac/RoleList.tsx）。
// onMounted 拉列表；新建/编辑走 RoleFormModal；删除走 ConfirmModal 二次确认。
import { ref, onMounted } from 'vue'
import { useRoleStore } from '@/stores/rbac'
import type { Role, RoleCreateInput, MenuPermission } from '@/types/rbac'
import RoleFormModal, { type RoleFormValues } from '@/components/RoleFormModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const store = useRoleStore()

const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editing = ref<Role | null>(null)
const submitting = ref(false)
const deleteTarget = ref<Role | null>(null)
const deleting = ref(false)

onMounted(() => {
  store.fetchRoles()
})

function openCreate() {
  formMode.value = 'create'
  editing.value = null
  formVisible.value = true
}

function openEdit(role: Role) {
  formMode.value = 'edit'
  editing.value = role
  formVisible.value = true
}

async function handleSubmit(values: RoleFormValues) {
  submitting.value = true
  try {
    const input: RoleCreateInput = {
      name: values.name,
      permissions: values.permissions,
      menuPermissions: values.menuPermissions as MenuPermission[],
    }
    if (formMode.value === 'create') {
      await store.createRole(input)
    } else if (editing.value) {
      await store.updateRole(editing.value.id, input)
    }
    formVisible.value = false
    await store.fetchRoles()
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteRole(deleteTarget.value.id)
    deleteTarget.value = null
    await store.fetchRoles()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">角色管理</h2>
      <button
        data-testid="btn-create-role"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        @click="openCreate"
      >
        新建角色
      </button>
    </div>

    <div v-if="store.error" role="alert" class="text-red-600 text-sm bg-red-50 p-2 rounded">
      {{ store.error }}
    </div>

    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-2 text-left">角色名称</th>
            <th class="px-4 py-2 text-center">资源权限</th>
            <th class="px-4 py-2 text-center">菜单权限</th>
            <th class="px-4 py-2 text-left">权限列表</th>
            <th class="px-4 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.loading && store.list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">加载中...</td>
          </tr>
          <tr v-if="!store.loading && store.list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">暂无数据</td>
          </tr>
          <tr
            v-for="r in store.list"
            :key="r.id"
            data-testid="role-row"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-2 font-medium">{{ r.name }}</td>
            <td class="px-4 py-2 text-center">{{ r.permissions.length }}</td>
            <td class="px-4 py-2 text-center">
              <span
                :class="[
                  'inline-block px-2 py-0.5 rounded text-xs',
                  (r.menuPermissions ?? []).length > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400',
                ]"
              >
                {{ (r.menuPermissions ?? []).length }}
              </span>
            </td>
            <td class="px-4 py-2">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="p in r.permissions.slice(0, 4)"
                  :key="p"
                  class="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-mono"
                >
                  {{ p }}
                </span>
                <span v-if="r.permissions.length > 4" class="text-xs text-gray-400">
                  +{{ r.permissions.length - 4 }}
                </span>
              </div>
            </td>
            <td class="px-4 py-2 text-right space-x-2">
              <button
                data-testid="btn-edit-role"
                class="px-2 py-1 text-blue-600 hover:underline"
                @click="openEdit(r)"
              >
                编辑
              </button>
              <button
                data-testid="btn-delete-role"
                class="px-2 py-1 text-red-600 hover:underline"
                @click="deleteTarget = r"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <RoleFormModal
      :visible="formVisible"
      :mode="formMode"
      :role="editing ?? undefined"
      :loading="submitting"
      @submit="handleSubmit"
      @cancel="formVisible = false"
    />

    <ConfirmModal
      :visible="deleteTarget !== null"
      title="删除确认"
      :message="`确定删除角色「${deleteTarget?.name ?? ''}」？此操作不可撤销。`"
      :loading="deleting"
      confirm-text="删除"
      @confirm="handleDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
