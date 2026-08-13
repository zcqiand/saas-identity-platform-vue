<script setup lang="ts">
// 分页条。列表页底部统一走这里。受控：page 由调用方持有。

import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import Button from "../ui/button.vue";

interface Props {
  page: number;
  totalPages: number;
  total?: number;
}

const props = defineProps<Props>();

defineEmits<{
  "update:page": [page: number];
}>();
</script>

<template>
  <div class="flex items-center justify-between">
    <p class="text-muted-foreground text-sm">
      <span v-if="props.total != null">共 {{ props.total }} 条 · </span>
      第 {{ props.page }} / {{ props.totalPages }} 页
    </p>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="props.page <= 1"
        @click="$emit('update:page', props.page - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
        上一页
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="props.page >= props.totalPages"
        @click="$emit('update:page', props.page + 1)"
      >
        下一页
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
