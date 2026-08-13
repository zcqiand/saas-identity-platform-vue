<script setup lang="ts">
// 表单行：label + 控件 + 错误提示，纵向堆叠。
// 表单里每个字段都走这里，保证 label 间距、错误色、必填星号一致。

import { cn } from "../../lib/utils";

interface Props {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
});
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <label
      :for="props.htmlFor"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {{ props.label }}
      <span v-if="props.required" class="text-destructive">*</span>
    </label>
    <slot />
    <p v-if="props.error" class="text-destructive text-xs">{{ props.error }}</p>
    <p v-else-if="props.hint" class="text-muted-foreground text-xs">{{ props.hint }}</p>
  </div>
</template>
