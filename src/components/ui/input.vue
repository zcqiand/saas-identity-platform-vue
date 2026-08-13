<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../../lib/utils";

interface Props {
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  disabled: false,
});

const classes = computed(() =>
  cn(
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  ),
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    :id="props.id"
    :type="props.type"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :value="props.modelValue"
    :class="classes"
    @input="(e) => $emit('update:modelValue', (e.target as HTMLInputElement).value)"
  />
</template>
