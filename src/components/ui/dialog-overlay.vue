<script setup lang="ts">
import { DialogOverlay } from "reka-ui";
import { cn } from "../../lib/utils";

interface Props {
  class?: string;
}
const props = defineProps<Props>();
</script>

<template>
  <DialogOverlay :class="cn('fixed inset-0 z-50 bg-black/80', props.class)" />
</template>
