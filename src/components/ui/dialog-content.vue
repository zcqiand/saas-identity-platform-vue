<script setup lang="ts">
import { DialogContent } from "reka-ui";
import { cn } from "../../lib/utils";

interface Props {
  class?: string;
}
const props = defineProps<Props>();
</script>

<template>
  <DialogContent
    :class="
      cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        props.class,
      )
    "
  >
    <slot />
  </DialogContent>
</template>
