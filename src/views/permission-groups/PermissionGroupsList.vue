// @entry M03.F02.I01
// @entry M03.F02.I02
// @entry M03.F02.I03
// @entry M03.F02.I04
// @entry M03.F02.I05
// @entry M03.F02.I01
// @entry M03.F02.I02
// @entry M03.F02.I03
// @entry M03.F02.I04
// @entry M03.F02.I05
// @entry M03.F02.I01
// @entry M03.F02.I02
// @entry M03.F02.I03
// @entry M03.F02.I04
// @entry M03.F02.I05
// @entry M03.F02.I01
// @entry M03.F02.I02
// @entry M03.F02.I03
// @entry M03.F02.I04
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDepartmentStore } from '@/stores/department'

const dept = useDepartmentStore()
const showForm = ref(false)
const form = ref({ name: '', code: '', description: '', permissionsText: '', enabled: true })

onMounted(async () => { await dept.fetchPermissionGroups() })

async function submit() {
  const permissions = form.value.permissionsText
    .split(',').map((s) => s.trim()).filter(Boolean)
  await dept.createPermissionGroup({
    name: form.value.name, code: form.value.code, description: form.value.description,
    permissions, enabled: form.value.enabled,
  })
  showForm.value = false
  form.value = { name: '', code: '', description: '', permissionsText: '', enabled: true }
}
async function remove(id: string) {
  if (!confirm('确定删除？')) return
  await dept.removePermissionGroup(id)
}
</script>

<template>
  <section data-fn="M03.F02.I01" data-testid="permission-groups-list">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">权限组</h2>
      <button class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm" @click="showForm = true">新建权限组</button>
    </header>
    <table v-if="dept.permissionGroups.length" class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr><th class="px-3 py-2">名称</th><th class="px-3 py-2">编码</th><th class="px-3 py-2">权限数</th><th class="px-3 py-2">关联菜单</th><th class="px-3 py-2">排序</th><th class="px-3 py-2">启用</th><th class="px-3 py-2">操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="p in dept.permissionGroups" :key="p.id" data-testid="permission-group-row" class="border-t">
          <td class="px-3 py-2 font-medium">{{ p.name }}</td>
          <td class="px-3 py-2 text-gray-600">{{ p.code }}</td>
          <td class="px-3 py-2">{{ p.permissions.length }}</td>
          <td class="px-3 py-2 text-gray-600">{{ p.menuIds.length }}</td>
          <td class="px-3 py-2">{{ p.sort }}</td>
          <td class="px-3 py-2">{{ p.enabled ? '是' : '否' }}</td>
          <td class="px-3 py-2"><button class="text-red-600 hover:underline" @click="remove(p.id)">删除</button></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-gray-500 text-sm">暂无权限组</p>

    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-3" @submit.prevent="submit">
        <h3 class="text-base font-bold mb-2">新建权限组</h3>
        <label class="block text-sm"><span class="text-gray-700">名称</span><input v-model="form.name" required class="mt-1 w-full border rounded px-2 py-1"></label>
        <label class="block text-sm"><span class="text-gray-700">编码</span><input v-model="form.code" required class="mt-1 w-full border rounded px-2 py-1"></label>
        <label class="block text-sm"><span class="text-gray-700">描述</span><textarea v-model="form.description" rows="2" class="mt-1 w-full border rounded px-2 py-1" /></label>
        <label class="block text-sm"><span class="text-gray-700">权限（英文逗号分隔，如 user:read,org:read）</span><input v-model="form.permissionsText" class="mt-1 w-full border rounded px-2 py-1"></label>
        <label class="flex items-center text-sm gap-2"><input v-model="form.enabled" type="checkbox"><span>启用</span></label>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded" @click="showForm = false">取消</button>
          <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded">保存</button>
        </div>
      </form>
    </div>
  </section>
</template>
