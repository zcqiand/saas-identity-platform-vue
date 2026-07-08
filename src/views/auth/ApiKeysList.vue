<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSecurityStore } from '@/stores/security'

const sec = useSecurityStore()
const showForm = ref(false)
const form = ref({ name: '', scopesText: '', expiresAt: '' })

onMounted(async () => { await sec.fetchApiKeys() })

async function submit() {
  const scopes = form.value.scopesText.split(',').map((s) => s.trim()).filter(Boolean)
  await sec.createApiKey({
    name: form.value.name,
    scopes,
    expiresAt: form.value.expiresAt || undefined,
  })
  showForm.value = false
  form.value = { name: '', scopesText: '', expiresAt: '' }
}
async function remove(id: string) {
  if (!confirm('确定删除此 API Key？')) return
  await sec.removeApiKey(id)
}
async function toggle(id: string, enabled: boolean) {
  await sec.updateApiKey(id, { enabled })
}
</script>

<template>
  <section data-testid="api-keys-list">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">API Key</h2>
      <button class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm" @click="showForm = true">新建 API Key</button>
    </header>
    <table v-if="sec.apiKeys.length" class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr><th class="px-3 py-2">名称</th><th class="px-3 py-2">Key 前缀</th><th class="px-3 py-2">Scopes</th><th class="px-3 py-2">到期</th><th class="px-3 py-2">启用</th><th class="px-3 py-2">操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="k in sec.apiKeys" :key="k.id" data-testid="api-key-row" class="border-t">
          <td class="px-3 py-2 font-medium">{{ k.name }}</td>
          <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ k.keyPrefix }}</td>
          <td class="px-3 py-2 text-xs text-gray-600">{{ k.scopes.join(', ') || '—' }}</td>
          <td class="px-3 py-2 text-gray-600">{{ k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : '永不过期' }}</td>
          <td class="px-3 py-2"><input type="checkbox" :checked="k.enabled" @change="toggle(k.id, ($event.target as HTMLInputElement).checked)"></td>
          <td class="px-3 py-2"><button class="text-red-600 hover:underline" @click="remove(k.id)">删除</button></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-gray-500 text-sm">暂无 API Key</p>

    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-3" @submit.prevent="submit">
        <h3 class="text-base font-bold mb-2">新建 API Key</h3>
        <label class="block text-sm"><span class="text-gray-700">名称</span><input v-model="form.name" required class="mt-1 w-full border rounded px-2 py-1"></label>
        <label class="block text-sm"><span class="text-gray-700">Scopes（英文逗号分隔）</span><input v-model="form.scopesText" class="mt-1 w-full border rounded px-2 py-1"></label>
        <label class="block text-sm"><span class="text-gray-700">到期时间（可选）</span><input v-model="form.expiresAt" type="date" class="mt-1 w-full border rounded px-2 py-1"></label>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded" @click="showForm = false">取消</button>
          <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded">保存</button>
        </div>
      </form>
    </div>
  </section>
</template>
