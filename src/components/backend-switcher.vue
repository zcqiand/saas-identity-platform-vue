<template>
  <div
    style="
      padding: 8px 12px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #555;
    "
  >
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
      <strong>后端:</strong>
      <span data-testid="backend-current">{{ LABELS[backend] }}</span>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px">
      <button
        v-for="mode in (Object.keys(LABELS) as BackendMode[])"
        :key="mode"
        :data-testid="`backend-option-${mode}`"
        :data-fn="'M03.F01.I01'"
        :style="{
          padding: '2px 8px',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: mode === backend ? '#1f2937' : '#fff',
          color: mode === backend ? '#fff' : '#333',
          cursor: 'pointer',
        }"
        @click="setBackend(mode)"
      >
        {{ SHORT[mode] }}
      </button>
    </div>
    <div v-if="editing" style="display: flex; gap: 4px; align-items: center">
      <span>{{ LABELS[editing] }}</span>
      <input
        v-model="draft"
        :placeholder="`baseUrl（默认 ${baseUrls[editing]}）`"
        style="flex: 1; padding: 2px 6px; border: 1px solid #ccc; border-radius: 4px"
        @keydown.enter="commitEdit"
        @keydown.escape="cancelEdit"
      />
      <button @click="commitEdit" style="padding: 2px 8px">保存</button>
      <button @click="cancelEdit" style="padding: 2px 8px">取消</button>
    </div>
    <button
      v-else
      @click="startEdit"
      style="
        padding: 2px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
      "
    >
      自定义 baseUrl
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useBackendStore } from "../state/backend-context";
import type { BackendMode } from "../api/backend-config";

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
const { backend, baseUrls } = storeToRefs(backendStore);
const editing = ref<BackendMode | null>(null);
const draft = ref("");

function setBackend(mode: BackendMode) {
  backendStore.setBackend(mode);
}

function startEdit() {
  editing.value = backend.value;
  draft.value = baseUrls.value[backend.value];
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