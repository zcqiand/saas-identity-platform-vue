<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../../lib/utils";

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  disabled: false,
});

const classes = computed(() =>
  cn(
    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  ),
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <textarea
    :id="props.id"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :rows="props.rows"
    :value="props.modelValue"
    :class="classes"
    @input="(e) => $emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
  />
</template>
