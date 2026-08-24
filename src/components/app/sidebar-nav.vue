<script setup lang="ts">
// Sidebar nav with grouped menu items + lucide icons (matches M00-M08).

import { computed } from "vue";
import { cn } from "../../lib/utils";
import Separator from "../ui/separator.vue";

export interface NavItem {
  to: string;
  label: string;
  group: string;
  icon?: unknown;
  /** data-fn M-ID for L5 alignment */
  fnId?: string;
}

interface Props {
  items: NavItem[];
  title?: string;
  subtitle?: string;
  /** Version text rendered below the footer action */
  version?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "SaaS 多租户多应用身份平台",
  subtitle: "Identity Platform",
  version: "v0.2.0 · SaaS 多租户多应用身份平台",
});

const groups = computed(() => {
  const acc: Record<string, NavItem[]> = {};
  for (const item of props.items) {
    (acc[item.group] ??= []).push(item);
  }
  return acc;
});

const orderedGroups = computed(() => Object.keys(groups.value));
</script>

<template>
  <aside class="w-60 shrink-0 bg-slate-900 text-white flex flex-col" data-testid="sidebar-nav">
    <!-- Title -->
    <div class="px-5 py-5 border-b border-white/10">
      <div class="flex items-center gap-2">
        <div
          class="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold"
        >
          S
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold leading-tight truncate">{{ props.title }}</h1>
          <p class="text-xs text-white/50 truncate">{{ props.subtitle }}</p>
        </div>
      </div>
    </div>

    <!-- Nav items grouped -->
    <nav class="flex-1 px-2 py-3 overflow-y-auto">
      <div v-for="groupName in orderedGroups" :key="groupName" class="mb-4">
        <div class="px-3 mb-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          {{ groupName }}
        </div>
        <div class="space-y-0.5">
          <RouterLink
            v-for="item in groups[groupName]"
            :key="item.to"
            :to="item.to"
            :data-fn="item.fnId"
            :data-testid="`sidebar-nav-item-${item.fnId ?? item.to}`"
            active-class="bg-slate-700 text-white"
            exact-active-class="bg-slate-700 text-white"
            :class="
              cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors text-white/70 hover:bg-white/10 hover:text-white',
              )
            "
          >
            <span class="h-4 w-4 shrink-0">
              <component :is="item.icon" v-if="item.icon" class="h-4 w-4" />
            </span>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <Separator class="bg-white/10" />
    <div class="p-3 space-y-2">
      <!-- 主操作（如登出按钮），渲染在底部 footer 顶部 -->
      <slot name="footerAction" />
      <!-- 次要操作（如后端模式切换器），渲染在主操作之下、版本号之上 -->
      <slot name="footerExtras" />
      <div v-if="props.version" class="text-xs text-white/40 px-2">{{ props.version }}</div>
    </div>
  </aside>
</template>
