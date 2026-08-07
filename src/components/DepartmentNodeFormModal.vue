// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
<script setup lang="ts">
// 部门节点表单弹窗（对齐 React DepartmentNodeFormModal.tsx — 原 OrgNodeFormModal，v0.3.0 改名）：
// - mode='create'：新增节点（nodeId 为父节点 id）
// - mode='edit'：编辑节点（nodeId 为当前节点 id）
// - 校验非空名称后 emit submit(name, nodeId)
// 参考 TenantFormModal.vue 的 Teleport + watch 同步模式。
import { ref, watch } from 'vue'

interface DepartmentNodeFormModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  /** mode=create 时为父节点 id；mode=edit 时为当前节点 id */
  nodeId?: string
  initialName?: string
  loading?: boolean
}

const props = withDefaults(defineProps<DepartmentNodeFormModalProps>(), {
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
  <Teleport data-fn="M02.F01.I03" to="body">
    <div
      v-if="visible"
      data-testid="department-node-form-modal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('cancel')"
    >
      <form
        class="bg-white rounded-lg shadow-xl w-[400px] max-w-[90vw]"
        @submit.prevent="handleSubmit"
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">{{ mode === 'create' ? '新增部门节点' : '编辑部门节点' }}</h3>
        </div>
        <div class="px-6 py-4">
          <label class="block text-sm mb-1 font-medium">节点名称</label>
          <input
            v-model="name"
            data-testid="department-node-name"
            autofocus
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入节点名称"
          />
          <p v-if="error" data-testid="department-node-name-error" class="text-red-600 text-xs mt-1">{{ error }}</p>
        </div>
        <div class="px-6 py-3 flex justify-end gap-2 border-t border-gray-200">
          <button
            type="button"
            data-testid="department-node-form-cancel"
            :disabled="loading"
            class="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="emit('cancel')"
          >
            取消
          </button>
          <button
            type="submit"
            data-testid="department-node-form-submit"
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
