// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
// @entry M02.F01.I01
// @entry M02.F01.I02
// @entry M02.F01.I03
// @entry M02.F01.I04
// @entry M02.F01.I05
// @entry M02.F01.I06
// @entry M02.F01.I07
// @entry M02.F01.I08
// @entry M02.F01.I09
// @entry M02.F01.I01
// @entry M02.F01.I08
<script setup lang="ts">
// ch41 组织树节点：递归自引用组件（组件名 OrgTreeNode 在自身 template 内被引用）
import { computed } from 'vue'
import type { OrgNode } from '../types/user'

// 显式声明组件名，确保递归自引用在所有构建/打包场景下可解析
defineOptions({ name: 'OrgTreeNode' })

const props = defineProps<{
  /** 当前节点 */
  node: OrgNode
  /** 当前深度（根=0），用于缩进 */
  depth?: number
}>()

const emit = defineEmits<{
  (e: 'select', node: OrgNode): void
  (e: 'toggle', node: OrgNode): void
}>()

const depth = computed(() => props.depth ?? 0)
const hasChildren = computed(() => !!props.node.children?.length)
const indentStyle = computed(() => ({ paddingLeft: `${depth.value * 20 + 8}px` }))

function onClick(): void {
  emit('select', props.node)
  if (hasChildren.value) emit('toggle', props.node)
}
</script>

<template>
  <li data-fn="M02.F01.I01" :data-org-node="node.id" class="select-none">
    <div class="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer" :style="indentStyle">
      <span
        v-if="hasChildren"
        data-testid="expand-icon"
        class="text-gray-400 text-xs w-3"
      >▶</span>
      <span v-else class="w-3" />
      <span data-testid="node-label" class="flex-1 text-sm" @click="onClick">
        {{ node.name }}
      </span>
    </div>
    <ul v-if="hasChildren">
      <OrgTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </ul>
  </li>
</template>
