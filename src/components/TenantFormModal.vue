<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ThemeConfig } from '../types/tenant'

const FEATURE_OPTIONS = ['sso', 'audit', 'rbac']

export interface TenantFormValues {
  name: string
  theme: ThemeConfig
  config?: { features?: string[]; maxUsers?: number }
}

interface TenantFormProps {
  visible: boolean
  mode: 'create' | 'edit'
  tenant?: Partial<TenantFormValues & { id: string }>
}

const props = defineProps<TenantFormProps>()

const emit = defineEmits<{
  submit: [values: TenantFormValues]
  cancel: []
}>()

const name = ref('')
const primary = ref('#2563eb')
const sidebar = ref('#1e293b')
const logoText = ref('')
const features = ref<string[]>([])
const maxUsers = ref(100)
const errors = ref<Record<string, string>>({})

watch(() => [props.visible, props.tenant], () => {
  if (props.visible) {
    name.value = props.tenant?.name ?? ''
    primary.value = props.tenant?.theme?.primary ?? '#2563eb'
    sidebar.value = props.tenant?.theme?.sidebar ?? '#1e293b'
    logoText.value = props.tenant?.theme?.logoText ?? ''
    features.value = props.tenant?.config?.features ?? []
    maxUsers.value = props.tenant?.config?.maxUsers ?? 100
    errors.value = {}
  }
}, { immediate: true })

function validate(): boolean {
  const next: Record<string, string> = {}
  if (!name.value.trim()) next.name = '请输入租户名称'
  if (!logoText.value.trim()) next.logoText = '请输入 Logo 文本'
  errors.value = next
  return Object.keys(next).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    theme: { primary: primary.value.trim(), sidebar: sidebar.value.trim(), logoText: logoText.value.trim() },
    config: { features: features.value, maxUsers: maxUsers.value },
  })
}

function toggleFeature(f: string) {
  const idx = features.value.indexOf(f)
  if (idx >= 0) {
    features.value.splice(idx, 1)
  } else {
    features.value.push(f)
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        class="bg-white rounded-lg shadow-xl w-[520px] max-w-[90vw]"
        @submit.prevent="handleSubmit"
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">{{ mode === 'create' ? '新建租户' : '编辑租户' }}</h3>
        </div>
        <div class="px-6 py-4 space-y-3">
          <div>
            <label class="block text-sm mb-1 font-medium">租户名称</label>
            <input
              v-model="name"
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入租户名称"
            />
            <p v-if="errors.name" class="text-red-600 text-xs mt-1">{{ errors.name }}</p>
          </div>
          <div>
            <label class="block text-sm mb-1 font-medium">Logo 文本</label>
            <input
              v-model="logoText"
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入 Logo 文本"
            />
            <p v-if="errors.logoText" class="text-red-600 text-xs mt-1">{{ errors.logoText }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1 font-medium">主色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  :value="primary"
                  class="w-10 h-10 border rounded cursor-pointer"
                  @input="(e) => primary = (e.target as HTMLInputElement).value"
                />
                <input
                  v-model="primary"
                  class="flex-1 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm mb-1 font-medium">侧边栏色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  :value="sidebar"
                  class="w-10 h-10 border rounded cursor-pointer"
                  @input="(e) => sidebar = (e.target as HTMLInputElement).value"
                />
                <input
                  v-model="sidebar"
                  class="flex-1 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1 font-medium">功能模块</label>
            <div class="flex gap-4">
              <label v-for="f in FEATURE_OPTIONS" :key="f" class="flex items-center gap-1 text-sm">
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
            <label class="block text-sm mb-1 font-medium">最大用户数</label>
            <input
              v-model.number="maxUsers"
              type="number"
              min="1"
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div class="px-6 py-3 flex justify-end gap-2 border-t border-gray-200">
          <button
            type="button"
            class="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            @click="emit('cancel')"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm rounded text-white bg-blue-600 hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
