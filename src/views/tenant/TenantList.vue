<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantStore } from '../../stores/tenant'
import TenantFormModal from '../../components/TenantFormModal.vue'
import type { TenantConfig } from '../../types/tenant'
import type { TenantFormValues } from '../../components/TenantFormModal.vue'

const tenantStore = useTenantStore()
const router = useRouter()

const keyword = ref('')
const formOpen = ref(false)
const submitting = ref(false)
const deleteTarget = ref<TenantConfig | null>(null)
const deleting = ref(false)

onMounted(() => {
  tenantStore.fetchTenants()
})

function handleSearch() {
  tenantStore.fetchTenants(keyword.value.trim() || undefined)
}

async function handleSubmit(values: TenantFormValues) {
  submitting.value = true
  try {
    await tenantStore.createTenant({
      name: values.name,
      theme: values.theme,
      config: values.config,
    })
    formOpen.value = false
    tenantStore.fetchTenants(keyword.value.trim() || undefined)
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await tenantStore.deleteTenant(deleteTarget.value.id)
    deleteTarget.value = null
    tenantStore.fetchTenants(keyword.value.trim() || undefined)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">平台租户管理</h2>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        @click="formOpen = true"
      >
        新建租户
      </button>
    </div>

    <div class="flex items-center gap-2 bg-white p-3 rounded shadow-sm">
      <input
        v-model="keyword"
        placeholder="搜索租户名称"
        class="border rounded px-3 py-1.5 text-sm flex-1"
        @keydown.enter="handleSearch"
      />
      <button
        class="px-4 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
        @click="handleSearch"
      >
        搜索
      </button>
    </div>

    <div v-if="tenantStore.error" role="alert" class="text-red-600 text-sm bg-red-50 p-2 rounded">
      {{ tenantStore.error }}
    </div>

    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-2 text-left">租户名称</th>
            <th class="px-4 py-2 text-left">Logo</th>
            <th class="px-4 py-2 text-left">主题色</th>
            <th class="px-4 py-2 text-left">功能模块</th>
            <th class="px-4 py-2 text-left">最大用户数</th>
            <th class="px-4 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tenantStore.loading && (tenantStore.list?.length ?? 0) === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">加载中...</td>
          </tr>
          <tr v-else-if="(tenantStore.list?.length ?? 0) === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无数据</td>
          </tr>
          <tr
            v-for="t in tenantStore.list"
            :key="t.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-2 font-medium">{{ t.name }}</td>
            <td class="px-4 py-2">{{ t.theme.logoText }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center gap-2">
                <span
                  class="w-4 h-4 rounded border"
                  :style="{ background: t.theme.primary }"
                />
                <span class="text-xs font-mono text-gray-500">{{ t.theme.primary }}</span>
              </div>
            </td>
            <td class="px-4 py-2 text-xs text-gray-600">
              {{ (t.features ?? []).join(', ') || '-' }}
            </td>
            <td class="px-4 py-2">{{ t.config?.maxUsers ?? '-' }}</td>
            <td class="px-4 py-2 text-right space-x-2">
              <button
                class="px-2 py-1 text-blue-600 hover:underline"
                data-testid="btn-tenant-detail"
                @click="router.push(`/platform/tenants/${t.id}`)"
              >
                详情配置
              </button>
              <button
                class="px-2 py-1 text-red-600 hover:underline"
                @click="deleteTarget = t"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <TenantFormModal
      :visible="formOpen"
      mode="create"
      @submit="handleSubmit"
      @cancel="formOpen = false"
    />

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-lg shadow-xl w-[400px] p-6">
          <h3 class="text-lg font-semibold mb-2">删除确认</h3>
          <p class="text-gray-600 mb-4">
            确定删除租户「{{ deleteTarget.name }}」？此操作不可撤销。
          </p>
          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              @click="deleteTarget = null"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm rounded text-white bg-red-600 hover:bg-red-700"
              :disabled="deleting"
              @click="handleDelete"
            >
              {{ deleting ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
