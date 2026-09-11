<script setup lang="ts">
// 危险操作二次确认。删除、批量作废等统一走这里，禁止用 window.confirm。
// 受控组件：由调用方持有 open 状态，onConfirm 里做异步、loading 里禁用按钮。

import {
  AlertDialogRoot,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "reka-ui";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../ui/button-cva";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: "确认",
  cancelText: "取消",
  destructive: false,
  loading: false,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
}>();

function onConfirm(e: Event) {
  e.preventDefault();
  emit("confirm");
}
</script>

<template>
  <AlertDialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <AlertDialogContent
      :class="
        cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        )
      "
    >
      <AlertDialogTitle class="text-lg font-semibold leading-none tracking-tight">
        {{ props.title }}
      </AlertDialogTitle>
      <AlertDialogDescription v-if="props.description" class="text-sm text-muted-foreground">
        {{ props.description }}
      </AlertDialogDescription>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <AlertDialogCancel
          :disabled="props.loading"
          class="mt-2 sm:mt-0 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {{ props.cancelText }}
        </AlertDialogCancel>
        <!-- 2026-09-11 E2E 抓到：reka 的 AlertDialogAction 点击会先自动关闭弹窗
             （update:open(false) 先于 @confirm 到达），调用方在 update:open 里清
             target 后 confirmDelete 读到 null 静默早退（radix 版靠 preventDefault
             挡住自动关闭，reka 不遵循）。改普通 button：关闭权完全交还调用方，
             与本组件注释的受控契约一致（onConfirm 做异步、成功后由调用方关闭）。 -->
        <button
          type="button"
          :disabled="props.loading"
          :class="
            cn(
              buttonVariants({ variant: props.destructive ? 'destructive' : 'default' }),
              'mt-2 sm:mt-0',
            )
          "
          @click="onConfirm"
        >
          {{ props.confirmText }}
        </button>
      </div>
    </AlertDialogContent>
  </AlertDialogRoot>
</template>
