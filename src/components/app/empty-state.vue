<script setup lang="ts">
// 空态。列表无数据、搜索无结果时统一走这里，禁止直接甩一句"暂无数据"的裸文本。

import { cn } from "../../lib/utils";

interface Props {
  title: string;
  description?: string;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        props.class,
      )
    "
  >
    <div class="space-y-1">
      <p class="text-sm font-medium">{{ props.title }}</p>
      <p v-if="props.description" class="text-muted-foreground text-sm">{{ props.description }}</p>
    </div>
    <slot name="action" />
  </div>
</template>
