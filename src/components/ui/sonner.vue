<script setup lang="ts">
// shadcn-vue 风格的 sonner Toaster 包装。
// 由 src/components/app/app-shell.vue 内 <Toaster /> 挂载一次全局。

import { Toaster as SonnerToaster } from "vue-sonner";
</script>

<template>
  <SonnerToaster
    position="top-right"
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
  />
</template>
