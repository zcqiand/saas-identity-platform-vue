<script setup lang="ts">
// 页面级标题栏。每个功能页顶部统一走这里，不要各写各的 h2 + 按钮布局。
// title 左对齐，actions 右对齐（放「新建」等主操作）。

import { cn } from "../../lib/utils";

interface Props {
  title: string;
  description?: string;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('flex items-start justify-between gap-4', props.class)">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">{{ props.title }}</h1>
      <p v-if="props.description" class="text-muted-foreground text-sm">{{ props.description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
