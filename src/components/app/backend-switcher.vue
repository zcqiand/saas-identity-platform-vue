<script setup lang="ts">
// 运行时后端切换器：msw / aspnetcore / springboot
// 放在 sidebar 底部，紧贴版本号，低视觉权重。

import { ref } from "vue";
import { Server } from "lucide-vue-next";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "reka-ui";
import Button from "../ui/button.vue";
import Input from "../ui/input.vue";
import { useBackendStore } from "../../state/backend-context";
import type { BackendMode } from "../../api/backend-config";

const LABELS: Record<BackendMode, string> = {
  msw: "MSW（浏览器内 Mock）",
  aspnetcore: "ASP.NET Core",
  springboot: "Spring Boot",
};

const SHORT: Record<BackendMode, string> = {
  msw: "MSW Mock",
  aspnetcore: "ASP.NET Core",
  springboot: "Spring Boot",
};

const backendStore = useBackendStore();
const editing = ref<BackendMode | null>(null);
const draft = ref("");

const open = ref(false);

function onSelect(mode: BackendMode, e: Event) {
  e.preventDefault();
  backendStore.setBackend(mode);
}

function startEdit(mode: BackendMode) {
  editing.value = mode;
  draft.value = backendStore.baseUrls[mode];
}

function commitEdit() {
  if (editing.value) {
    const trimmed = draft.value.trim().replace(/\/+$/, "");
    if (trimmed) backendStore.setBaseUrl(editing.value, trimmed);
  }
  editing.value = null;
}

function cancelEdit() {
  editing.value = null;
}
</script>

<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        data-testid="backend-switcher-trigger"
        data-fn="M03.F01.I01"
        class="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10 text-xs h-7 px-2"
        :title="`当前后端：${LABELS[backendStore.backend]}`"
      >
        <Server class="h-3.5 w-3.5" />
        {{ SHORT[backendStore.backend] }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        class="z-50 min-w-[20rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <DropdownMenuLabel class="px-2 py-1.5 text-sm font-semibold">
          后端模式（运行时切换）
        </DropdownMenuLabel>
        <DropdownMenuSeparator class="-mx-1 my-1 h-px bg-muted" />
        <DropdownMenuItem
          v-for="mode in Object.keys(LABELS) as BackendMode[]"
          :key="mode"
          :class="[
            'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground',
            mode === backendStore.backend ? 'bg-accent' : '',
          ]"
          :data-testid="`backend-option-${mode}`"
          @select="(e) => onSelect(mode, e)"
        >
          <div class="flex-1">
            <div class="font-medium text-sm">{{ LABELS[mode] }}</div>
            <div class="font-mono text-xs text-muted-foreground truncate">
              {{ backendStore.baseUrls[mode] || "(同源 / worker 拦截)" }}
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator class="-mx-1 my-1 h-px bg-muted" />
        <DropdownMenuLabel class="px-2 py-1.5 text-xs font-normal text-muted-foreground">
          自定义 baseUrl
        </DropdownMenuLabel>
        <div class="px-2 pb-2 space-y-2">
          <div v-if="editing" class="space-y-2">
            <div class="text-xs font-medium">{{ LABELS[editing] }}</div>
            <Input
              v-model="draft"
              placeholder="http://localhost:5000"
              @keydown.enter="commitEdit"
              @keydown.escape="cancelEdit"
            />
            <div class="flex justify-end gap-2">
              <Button variant="ghost" size="sm" @click="cancelEdit">取消</Button>
              <Button size="sm" @click="commitEdit">保存</Button>
            </div>
          </div>
          <div v-else class="space-y-1">
            <button
              v-for="mode in Object.keys(LABELS) as BackendMode[]"
              :key="mode"
              class="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent"
              @click="startEdit(mode)"
            >
              <span class="font-medium">{{ LABELS[mode] }}</span>
              <span class="ml-2 font-mono text-muted-foreground">
                {{ backendStore.baseUrls[mode] || "(空)" }}
              </span>
            </button>
            <button
              class="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground"
              @click="backendStore.resetBaseUrls()"
            >
              恢复默认 baseUrl
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
