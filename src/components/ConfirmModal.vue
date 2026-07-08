<script setup lang="ts">
// 通用确认弹窗（对齐 React ConfirmModal.tsx）：Teleport 到 body，遮罩 + 标题/消息/确认/取消。
// ch41 组织管理删除确认首次引入；后续任何需要二次确认的场景均可复用。
interface ConfirmModalProps {
  visible: boolean
  title?: string
  message?: string
  /** 确认按钮文案，默认「确认」 */
  confirmText?: string
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string
  /** 提交中禁用按钮并显示「处理中...」 */
  loading?: boolean
}

withDefaults(defineProps<ConfirmModalProps>(), {
  title: '确认操作',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      data-testid="confirm-modal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('cancel')"
    >
      <div class="bg-white rounded-lg shadow-xl w-[420px] max-w-[90vw]">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">{{ title }}</h3>
        </div>
        <div class="px-6 py-4">
          <p v-if="message" class="text-sm text-gray-700 whitespace-pre-line">{{ message }}</p>
        </div>
        <div class="px-6 py-3 flex justify-end gap-2 border-t border-gray-200">
          <button
            type="button"
            data-testid="confirm-cancel"
            :disabled="loading"
            class="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            data-testid="confirm-ok"
            :disabled="loading"
            class="px-4 py-2 text-sm rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            @click="emit('confirm')"
          >
            {{ loading ? '处理中...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
