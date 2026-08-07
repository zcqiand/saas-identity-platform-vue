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
// 部门管理页（对齐 React DepartmentTree.tsx + Departments.tsx — 原 OrgInfo.vue，v0.3.0 改名）：
// - 挂载拉部门树 → 用 DepartmentTreeNode 递归渲染
// - 节点支持展开/折叠/选中（选中后工具栏可增/改/删）
// - 新增/编辑走 DepartmentNodeFormModal，删除走 ConfirmModal
// - 操作调 department store，成功后刷新树
// 复用既有 DepartmentTreeNode.vue（不改其签名），操作按钮集中在页面工具栏。
import { ref, computed, watch, onMounted } from 'vue'
import { useDepartmentStore } from '@/stores/department'
import { storeToRefs } from 'pinia'
import DepartmentTreeNode from '@/components/DepartmentTreeNode.vue'
import DepartmentNodeFormModal from '@/components/DepartmentNodeFormModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { DepartmentNode } from '@/types/user'

const store = useDepartmentStore()
const { tree, loading, error } = storeToRefs(store)

// 展开集合：默认根 + 一级展开（对齐 React DepartmentTree 初始化逻辑）
const expandedSet = ref<Set<string>>(new Set(['department-root']))
const selectedNode = ref<DepartmentNode | null>(null)

// 弹窗状态
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formNodeId = ref<string | undefined>(undefined)
const formInitialName = ref('')
const submitting = ref(false)

const deleteTarget = ref<DepartmentNode | null>(null)
const deleting = ref(false)

// 树加载完成后初始化展开集合（根 + 一级子节点）
watch(tree, (t) => {
  if (!t) return
  const initial = new Set<string>(['department-root'])
  t.children?.forEach((c) => initial.add(c.id))
  expandedSet.value = initial
}, { immediate: true })

const isSelected = computed(() => selectedNode.value !== null)
const canDelete = computed(() => selectedNode.value?.id !== 'department-root')

onMounted(() => {
  store.fetchDepartmentTree()
})

function handleToggle(node: DepartmentNode): void {
  const next = new Set(expandedSet.value)
  if (next.has(node.id)) next.delete(node.id)
  else next.add(node.id)
  expandedSet.value = next
}

function handleSelect(node: DepartmentNode): void {
  selectedNode.value = node
}

function openCreateChild(): void {
  const parent = selectedNode.value
  if (!parent) return
  formMode.value = 'create'
  formNodeId.value = parent.id
  formInitialName.value = ''
  formVisible.value = true
}

function openCreateRoot(): void {
  formMode.value = 'create'
  formNodeId.value = 'department-root'
  formInitialName.value = ''
  formVisible.value = true
}

function openEdit(): void {
  const node = selectedNode.value
  if (!node) return
  formMode.value = 'edit'
  formNodeId.value = node.id
  formInitialName.value = node.name
  formVisible.value = true
}

async function handleFormSubmit(name: string, nodeId?: string): Promise<void> {
  submitting.value = true
  try {
    if (formMode.value === 'create' && nodeId) {
      await store.createDepartmentNode(name, nodeId)
    } else if (formMode.value === 'edit' && nodeId) {
      await store.updateDepartmentNode(nodeId, name)
    }
    // 操作失败时 store.error 会被设置；成功才关弹窗
    if (!store.error) {
      formVisible.value = false
    }
  } finally {
    submitting.value = false
  }
}

function openDelete(): void {
  if (!selectedNode.value) return
  deleteTarget.value = selectedNode.value
}

async function handleDeleteConfirm(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteDepartmentNode(deleteTarget.value.id)
    if (!store.error) {
      // 删除成功后选中态清空（节点已不存在）
      selectedNode.value = null
      deleteTarget.value = null
    }
  } finally {
    deleting.value = false
  }
}

const deleteMessage = computed(() => {
  const t = deleteTarget.value
  if (!t) return ''
  const hasChildren = !!t.children?.length
  return `确定删除部门「${t.name}」？${hasChildren ? '该部门有子部门，将一并删除。' : ''}此操作不可撤销。`
})
</script>

<template>
  <div data-fn="M02.F01.I01" class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">部门管理</h2>
      <button
        data-testid="btn-create-root"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        @click="openCreateRoot"
      >
        新增根部门
      </button>
    </div>

    <div v-if="error" role="alert" data-testid="department-error" class="text-red-600 text-sm bg-red-50 p-2 rounded">
      {{ error }}
    </div>

    <!-- 选中节点工具栏 -->
    <div v-if="isSelected" data-testid="node-toolbar" class="bg-white rounded shadow p-3 flex items-center gap-3">
      <span class="text-sm text-gray-500">当前选中：</span>
      <span class="text-sm font-medium">{{ selectedNode?.name }}</span>
      <span class="flex-1" />
      <button
        data-testid="btn-add-child"
        class="px-3 py-1 text-sm text-green-700 bg-green-50 rounded hover:bg-green-100"
        @click="openCreateChild"
      >
        + 子部门
      </button>
      <button
        data-testid="btn-edit"
        class="px-3 py-1 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
        @click="openEdit"
      >
        编辑
      </button>
      <button
        v-if="canDelete"
        data-testid="btn-delete"
        class="px-3 py-1 text-sm text-red-700 bg-red-50 rounded hover:bg-red-100"
        @click="openDelete"
      >
        删除
      </button>
    </div>

    <div class="bg-white rounded shadow overflow-hidden">
      <div v-if="loading && !tree" data-testid="department-loading" class="p-8 text-center text-gray-400 text-sm">
        加载部门架构...
      </div>
      <div v-else-if="tree" class="p-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">部门架构</h3>
        <ul>
          <DepartmentTreeNode
            :node="tree"
            :depth="0"
            @select="handleSelect"
            @toggle="handleToggle"
          />
        </ul>
      </div>
      <div v-else class="p-8 text-center text-gray-400">暂无部门数据</div>
    </div>

    <DepartmentNodeFormModal
      :visible="formVisible"
      :mode="formMode"
      :node-id="formNodeId"
      :initial-name="formInitialName"
      :loading="submitting"
      @submit="handleFormSubmit"
      @cancel="formVisible = false"
    />

    <ConfirmModal
      :visible="deleteTarget !== null"
      title="删除确认"
      :message="deleteMessage"
      confirm-text="删除"
      :loading="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
