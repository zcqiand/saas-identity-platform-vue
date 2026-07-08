<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

// 平台级菜单管理列表（ch42）：按 appId 列菜单、增删
const route = useRoute()
const app = useAppStore()

const appId = computed(() => String(route.params.appId))
const showForm = ref(false)
const form = ref({
  name: '',
  path: '',
  icon: '',
  sort: 100,
  enabled: true,
})

onMounted(async () => {
  await app.fetchMenus(appId.value)
})

function openCreate() {
  form.value = { name: '', path: '', icon: '', sort: 100, enabled: true }
  showForm.value = true
}

async function submit() {
  await app.createMenu({
    name: form.value.name,
    path: form.value.path,
    appId: appId.value,
    icon: form.value.icon || undefined,
    sort: form.value.sort,
    enabled: form.value.enabled,
  })
  showForm.value = false
}

async function remove(id: string) {
  if (!confirm('确定删除此菜单？')) return
  await app.removeMenu(id)
}
</script>

<template>
  <section data-testid="menu-list">
    <header class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold">菜单管理</h2>
        <p class="text-xs text-gray-500">应用：{{ appId }}</p>
      </div>
      <button
        data-testid="btn-create-menu"
        class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        新建菜单
      </button>
    </header>

    <table v-if="app.menus.length" class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr>
          <th class="px-3 py-2">名称</th>
          <th class="px-3 py-2">路径</th>
          <th class="px-3 py-2">图标</th>
          <th class="px-3 py-2">排序</th>
          <th class="px-3 py-2">启用</th>
          <th class="px-3 py-2">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in app.menus"
          :key="row.id"
          data-testid="menu-row"
          class="border-t hover:bg-gray-50"
        >
          <td class="px-3 py-2 font-medium">{{ row.name }}</td>
          <td class="px-3 py-2 text-gray-600 font-mono text-xs">{{ row.path }}</td>
          <td class="px-3 py-2 text-gray-500">{{ row.icon ?? '—' }}</td>
          <td class="px-3 py-2">{{ row.sort }}</td>
          <td class="px-3 py-2">{{ row.enabled ? '是' : '否' }}</td>
          <td class="px-3 py-2">
            <button class="text-red-600 hover:underline" @click="remove(row.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-gray-500 text-sm" data-testid="empty">该应用暂无菜单</p>

    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <form
        class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-3"
        @submit.prevent="submit"
      >
        <h3 class="text-base font-bold mb-2">新建菜单</h3>
        <label class="block text-sm">
          <span class="text-gray-700">名称</span>
          <input v-model="form.name" required class="mt-1 w-full border rounded px-2 py-1">
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">路径</span>
          <input v-model="form.path" required class="mt-1 w-full border rounded px-2 py-1">
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">图标（可选）</span>
          <input v-model="form.icon" class="mt-1 w-full border rounded px-2 py-1">
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">排序</span>
          <input v-model.number="form.sort" type="number" class="mt-1 w-full border rounded px-2 py-1">
        </label>
        <label class="flex items-center text-sm gap-2">
          <input v-model="form.enabled" type="checkbox">
          <span>启用</span>
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded" @click="showForm = false">取消</button>
          <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">保存</button>
        </div>
      </form>
    </div>
  </section>
</template>
