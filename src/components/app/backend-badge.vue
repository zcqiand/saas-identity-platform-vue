<script setup lang="ts">
// 后端切换器（2026-09-11 用户裁定恢复运行时切换，覆盖 ADR-0014 dev 单 URL）。
// 选择持久化 localStorage（saas.api.backend），http-client 每次请求动态读取，
// 切完下一个请求即生效，无需刷新。env 未选择时显示 env 默认目标。
import { ref } from "vue";
import {
  BACKENDS,
  getApiBaseUrl,
  getSelectedBackend,
  setSelectedBackend,
} from "../../api/backend-config";

const selected = ref(getSelectedBackend());
const baseUrl = getApiBaseUrl() || "(同源)";

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value;
  setSelectedBackend(v);
  selected.value = v;
}
</script>

<template>
  <div class="flex flex-col gap-1 px-2 py-1 text-xs">
    <div class="flex items-center gap-2">
      <span class="font-mono text-white/40">backend:</span>
      <select
        data-testid="backend-badge"
        :value="selected"
        class="rounded border border-white/20 bg-slate-900 px-1 py-0.5 font-mono text-xs text-white"
        @change="onChange"
      >
        <option value="">(env 默认)</option>
        <option v-for="b in BACKENDS" :key="b.key" :value="b.key">{{ b.key }} · {{ b.baseUrl }}</option>
      </select>
    </div>
    <div class="font-mono text-white/40 truncate" :title="baseUrl">{{ baseUrl }}</div>
  </div>
</template>
