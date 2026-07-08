<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import type { App } from '@/types/app'

// 平台级应用管理列表（ch42）：
// - 列出全部应用
// - 新建 / 编辑 / 删除
// - 每行有"菜单管理"入口（跳到 /platform/apps/:appId/menus）
const app = useAppStore()
const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  code: '',
  description: '',
  theme: '#2563eb',
  sort: 100,
  enabled: true,
})

onMounted(async () => {
  await app.fetchApps()
})

function openCreate() {
  editingId.value = null
  form.value = { name: '', code: '', description: '', theme: '#2563eb', sort: 100, enabled: true }
  showForm.value = true
}

function openEdit(row: App) {
  editingId.value = row.id
  form.value = {
    name: row.name,
    code: row.code,
    description: row.description ?? '',
    theme: row.theme,
    sort: row.sort,
    enabled: row.enabled,
  }
  showForm.value = true
}

async function submit() {
  if (editingId.value) {
    await app.updateApp(editingId.value, { ...form.value })
  } else {
    await app.createApp({ ...form.value })
  }
  showForm.value = false
}

async function remove(row: App) {
  if (!confirm(`确定删除应用「${row.name}」？旗下菜单将一并清空`)) return
  await app.removeApp(row.id)
}
</script>

<template>
  <section data-testid="app-list">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">应用管理</h2>
      <button
        data-testid="btn-create-app"
        class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        新建应用
      </button>
    </header>

    <table v-if="app.apps.length" class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr>
          <th class="px-3 py-2">名称</th>
          <th class="px-3 py-2">编码</th>
          <th class="px-3 py-2">主题</th>
          <th class="px-3 py-2">排序</th>
          <th class="px-3 py-2">启用</th>
          <th class="px-3 py-2">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in app.apps"
          :key="row.id"
          data-testid="app-row"
          class="border-t hover:bg-gray-50"
        >
          <td class="px-3 py-2 font-medium">{{ row.name }}</td>
          <td class="px-3 py-2 text-gray-600">{{ row.code }}</td>
          <td class="px-3 py-2">
            <span class="inline-block w-4 h-4 rounded" :style="{ background: row.theme }" />
          </td>
          <td class="px-3 py-2">{{ row.sort }}</td>
          <td class="px-3 py-2">{{ row.enabled ? '是' : '否' }}</td>
          <td class="px-3 py-2 space-x-2">
            <RouterLink
              :to="`/platform/apps/${row.id}/menus`"
              class="text-blue-600 hover:underline"
            >菜单</RouterLink>
            <button class="text-gray-700 hover:underline" @click="openEdit(row)">编辑</button>
            <button class="text-red-600 hover:underline" @click="remove(row)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-gray-500 text-sm" data-testid="empty">暂无应用</p>

    <!-- 表单弹窗 -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      data-testid="app-form"
    >
      <form
        class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-3"
        @submit.prevent="submit"
      >
        <h3 class="text-base font-bold mb-2">
          {{ editingId ? '编辑应用' : '新建应用' }}
        </h3>
        <label class="block text-sm">
          <span class="text-gray-700">名称</span>
          <input
            v-model="form.name"
            required
            placeholder="应用名称"
            class="mt-1 w-full border rounded px-2 py-1"
            data-testid="input-name"
          >
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">编码</span>
          <input
            v-model="form.code"
            required
            placeholder="应用编码（英文唯一）"
            class="mt-1 w-full border rounded px-2 py-1"
            data-testid="input-code"
          >
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">主题色</span>
          <input
            v-model="form.theme"
            type="color"
            class="mt-1 w-12 h-8 border rounded"
          >
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">排序</span>
          <input
            v-model.number="form.sort"
            type="number"
            class="mt-1 w-full border rounded px-2 py-1"
          >
        </label>
        <label class="block text-sm">
          <span class="text-gray-700">描述</span>
          <textarea
            v-model="form.description"
            rows="2"
            class="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label class="flex items-center text-sm gap-2">
          <input v-model="form.enabled" type="checkbox">
          <span>启用</span>
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            @click="showForm = false"
          >取消</button>
          <button
            type="submit"
            data-testid="btn-submit-app"
            class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >保存</button>
        </div>
      </form>
    </div>
  </section>
</template>
