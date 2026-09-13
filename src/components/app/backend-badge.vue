<script setup lang="ts">
// 后端切换器（2026-09-11 用户裁定恢复运行时切换，覆盖 ADR-0014 dev 单 URL）。
// 视觉对齐 TenantSwitcher（DropdownMenu + 图标 + ChevronsUpDown）。
// 选择持久化 localStorage（saas.api.backend），http-client 每次请求动态读取，
// 切完下一个请求即生效，无需刷新。未选择 = env 默认目标。
// variant="sidebar"（默认）：深色侧边栏 footer 用白字样式；
// variant="plain"：浅色背景（登录页卡片）用默认 ghost 样式（2026-09-12，对齐 saas-nextjs/react）。
import { computed, ref } from "vue";
import { Check, ChevronsUpDown, Server } from "lucide-vue-next";
import Button from "../ui/button.vue";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "reka-ui";
import {
  SELECTABLE_BACKENDS,
  getSelectedBackend,
  resolveSelectedBackendUrl,
  setSelectedBackend,
} from "../../api/backend-config";

const props = withDefaults(defineProps<{ variant?: "sidebar" | "plain" }>(), {
  variant: "sidebar",
});

const selected = ref(getSelectedBackend());
const currentLabel = computed(
  () => SELECTABLE_BACKENDS.find((b) => b.key === selected.value)?.key ?? "(env 默认)",
);
const wrapperClass = computed(() =>
  props.variant === "sidebar" ? "w-full px-2 py-1 text-xs" : "w-full text-xs",
);
const triggerClass = computed(() =>
  props.variant === "sidebar"
    ? "w-full justify-between gap-2 border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
    : "w-full justify-between gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
);

function pick(key: string) {
  setSelectedBackend(key);
  selected.value = key;
}
</script>

<template>
  <div :class="wrapperClass" data-testid="backend-badge">
    <DropdownMenuRoot>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="sm" :class="triggerClass">
          <span class="flex min-w-0 items-center gap-2">
            <Server class="h-4 w-4 text-slate-500" />
            <span class="truncate font-medium">{{ currentLabel }}</span>
          </span>
          <ChevronsUpDown class="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="start" :side-offset="4" class="w-56">
          <DropdownMenuLabel>切换后端</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer" @select="pick('')">
            <Server class="mr-2 h-4 w-4 text-slate-400" />
            <span class="flex-1">env 默认（部署配置）</span>
            <Check v-if="!selected" class="h-4 w-4" />
          </DropdownMenuItem>
          <DropdownMenuItem
            v-for="b in SELECTABLE_BACKENDS"
            :key="b.key"
            class="cursor-pointer"
            @select="pick(b.key)"
          >
            <Server class="mr-2 h-4 w-4 text-slate-500" />
            <div class="flex flex-1 flex-col">
              <span class="font-medium">{{ b.key }}</span>
              <span class="font-mono text-xs text-slate-500">
                {{ resolveSelectedBackendUrl(b.key) }}
              </span>
            </div>
            <Check v-if="selected === b.key" class="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
