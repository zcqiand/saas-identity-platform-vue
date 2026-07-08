<script setup lang="ts">
// 平台租户详情配置（对齐 React src/pages/TenantDetail.tsx）：
// - 读 :tenantId，onMounted + watch 拉取租户写入 store.current
// - watch(current) 同步本地表单；卸载时 clearError
// - 三段：基本信息 / 主题配置（色+文本框配对+预览条）/ 功能与套餐（复选+数字框）
// - 保存调 tenantStore.updateTenant；返回 → /platform/tenants
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'

const FEATURE_OPTIONS = ['sso', 'audit', 'rbac']

const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()

const tenantId = route.params.tenantId as string

const name = ref('')
const logoText = ref('')
const primary = ref('#2563eb')
const sidebar = ref('#1e293b')
const features = ref<string[]>([])
const maxUsers = ref(100)
const submitting = ref(false)
const saved = ref(false)

function syncFromCurrent() {
  const c = tenantStore.current
  if (c && c.id === tenantId) {
    name.value = c.name
    logoText.value = c.theme.logoText
    primary.value = c.theme.primary
    sidebar.value = c.theme.sidebar
    features.value = c.features ?? c.config?.features ?? ([] as string[])
    maxUsers.value = c.config?.maxUsers ?? 100
  }
}

onMounted(() => {
  if (tenantId) tenantStore.fetchTenant(tenantId)
})

watch(
  () => tenantStore.current,
  () => syncFromCurrent(),
)

onUnmounted(() => {
  tenantStore.clearError()
})

function toggleFeature(f: string) {
  if (features.value.includes(f)) {
    features.value = features.value.filter((x) => x !== f)
  } else {
    features.value = [...features.value, f]
  }
}

async function handleSave() {
  if (!tenantId) return
  submitting.value = true
  saved.value = false
  try {
    await tenantStore.updateTenant(tenantId, {
      name: name.value,
      theme: { primary: primary.value, sidebar: sidebar.value, logoText: logoText.value },
      config: { features: features.value, maxUsers: maxUsers.value },
    })
    saved.value = true
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/platform/tenants')
}
</script>

<template>
  <!-- loading 且无数据 -->
  <div v-if="tenantStore.loading && !tenantStore.current" class="text-gray-400 p-4">加载中...</div>

  <!-- error 且无数据：红框 + 返回 -->
  <div v-else-if="tenantStore.error && !tenantStore.current" class="space-y-4">
    <div role="alert" class="text-red-600 bg-red-50 p-3 rounded">{{ tenantStore.error }}</div>
    <button class="text-blue-600 hover:underline text-sm" @click="goBack">← 返回租户列表</button>
  </div>

  <div v-else class="space-y-6 max-w-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="text-gray-500 hover:text-gray-700 text-sm" @click="goBack">← 返回</button>
        <h2 class="text-2xl font-bold">租户配置</h2>
        <span v-if="tenantStore.current" class="text-sm text-gray-400 font-mono">{{ tenantStore.current.id }}</span>
      </div>
      <span v-if="saved" class="text-green-600 text-sm">保存成功</span>
    </div>

    <div v-if="tenantStore.error" role="alert" class="text-red-600 bg-red-50 p-2 rounded text-sm">
      {{ tenantStore.error }}
    </div>

    <!-- 基本信息 -->
    <section class="bg-white rounded shadow p-6 space-y-4">
      <h3 class="text-base font-semibold text-gray-700 border-b pb-2">基本信息</h3>
      <div>
        <label for="td-name" class="block text-sm font-medium mb-1">租户名称</label>
        <input
          id="td-name"
          v-model="name"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="td-logo" class="block text-sm font-medium mb-1">Logo 文本</label>
        <input
          id="td-logo"
          v-model="logoText"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </section>

    <!-- 主题配置 -->
    <section class="bg-white rounded shadow p-6 space-y-4">
      <h3 class="text-base font-semibold text-gray-700 border-b pb-2">主题配置</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="td-primary" class="block text-sm font-medium mb-1">主色</label>
          <div class="flex gap-2">
            <input
              v-model="primary"
              type="color"
              class="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              id="td-primary"
              v-model="primary"
              class="flex-1 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label for="td-sidebar" class="block text-sm font-medium mb-1">侧边栏色</label>
          <div class="flex gap-2">
            <input
              v-model="sidebar"
              type="color"
              class="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              id="td-sidebar"
              v-model="sidebar"
              class="flex-1 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <!-- 主题预览 -->
      <div class="flex gap-2">
        <div class="w-8 h-8 rounded border" :style="{ background: primary }" title="主色预览" />
        <div class="w-8 h-8 rounded border" :style="{ background: sidebar }" title="侧边栏色预览" />
        <span class="text-xs text-gray-400 self-center">主题预览</span>
      </div>
    </section>

    <!-- 功能与套餐 -->
    <section class="bg-white rounded shadow p-6 space-y-4">
      <h3 class="text-base font-semibold text-gray-700 border-b pb-2">功能与套餐</h3>
      <div>
        <label class="block text-sm font-medium mb-2">启用功能模块</label>
        <div class="flex gap-6">
          <label v-for="f in FEATURE_OPTIONS" :key="f" class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              :checked="features.includes(f)"
              class="rounded"
              @change="toggleFeature(f)"
            />
            {{ f }}
          </label>
        </div>
      </div>
      <div>
        <label for="td-max-users" class="block text-sm font-medium mb-1">最大用户数</label>
        <input
          id="td-max-users"
          v-model.number="maxUsers"
          type="number"
          min="1"
          class="w-48 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </section>

    <!-- 保存按钮 -->
    <div class="flex justify-end">
      <button
        class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        :disabled="submitting"
        @click="handleSave"
      >
        {{ submitting ? '保存中...' : '保存配置' }}
      </button>
    </div>
  </div>
</template>
