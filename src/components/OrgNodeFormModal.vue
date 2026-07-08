<script setup lang="ts">
// 组织节点表单弹窗（对齐 React OrgNodeFormModal.tsx）：
// - mode='create'：新增节点（nodeId 为父节点 id）
// - mode='edit'：编辑节点（nodeId 为当前节点 id）
// - 校验非空名称后 emit submit(name, nodeId)
// 参考 TenantFormModal.vue 的 Teleport + watch 同步模式。
import { ref, watch } from 'vue'

interface OrgNodeFormModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  /** mode=create 时为父节点 id；mode=edit 时为当前节点 id */
  nodeId?: string
  initialName?: string
  loading?: boolean
}

const props = withDefaults(defineProps<OrgNodeFormModalProps>(), {
  nodeId: undefined,
  initialName: '',
  loading: false,
})

const emit = defineEmits<{
  submit: [name: string, nodeId?: string]
  cancel: []
}>()

const name = ref('')
const error = ref('')

// 弹窗打开时同步初始值（与 React useEffect([open, initialName]) 对齐）
watch(
  () => [props.visible, props.initialName],
  () => {
    if (props.visible) {
      name.value = props.initialName
      error.value = ''
    }
  },
  { immediate: true },
)

function handleSubmit(): void {
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = '请输入节点名称'
    return
  }
  emit('submit', trimmed, props.nodeId)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      data-testid="org-node-form-modal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('cancel')"
    >
      <form
        class="bg-white rounded-lg shadow-xl w-[400px] max-w-[90vw]"
        @submit.prevent="handleSubmit"
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">{{ mode === 'create' ? '新增组织节点' : '编辑组织节点' }}</h3>
        </div>
        <div class="px-6 py-4">
          <label class="block text-sm mb-1 font-medium">节点名称</label>
          <input
            v-model="name"
            data-testid="org-node-name"
            autofocus
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入节点名称"
          />
          <p v-if="error" data-testid="org-node-name-error" class="text-red-600 text-xs mt-1">{{ error }}</p>
        </div>
        <div class="px-6 py-3 flex justify-end gap-2 border-t border-gray-200">
          <button
            type="button"
            data-testid="org-node-form-cancel"
            :disabled="loading"
            class="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="emit('cancel')"
          >
            取消
          </button>
          <button
            type="submit"
            data-testid="org-node-form-submit"
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
