<script setup lang="ts">
// 后端模式标签（无交互）— 替代 BackendSwitcher（已废弃 — ADR-0014）。
//
// 显示当前 apiMode（来自 VITE_API_MODE，部署期 env），仅用于诊断。

import { getApiBaseUrl, getApiMode } from "../../api/backend-config";

const mode = getApiMode();
const baseUrl = getApiBaseUrl() || "(同源)";
</script>

<template>
  <div class="flex flex-col gap-1 px-2 py-1 text-xs">
    <div class="flex items-center gap-2">
      <span class="font-mono text-white/40">backend:</span>
      <strong data-testid="backend-badge">{{ mode }}</strong>
    </div>
    <div class="font-mono text-white/40 truncate" :title="baseUrl">{{ baseUrl }}</div>
  </div>
</template>