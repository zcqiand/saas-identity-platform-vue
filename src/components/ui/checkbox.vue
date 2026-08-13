<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from "reka-ui";
import { Check } from "lucide-vue-next";
import { cn } from "../../lib/utils";

interface Props {
  modelValue?: boolean | "indeterminate";
  disabled?: boolean;
  class?: string;
}
const props = defineProps<Props>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <CheckboxRoot
    :model-value="props.modelValue"
    :disabled="props.disabled"
    @update:model-value="(v) => $emit('update:modelValue', v as boolean)"
    :class="
      cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
      <Check class="h-3.5 w-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
