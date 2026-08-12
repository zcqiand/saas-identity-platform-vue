<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">API Key（M05.F01）— tenant {{ props.tenantId?.slice(0, 8) }}</h1>
      <button data-fn="M05.F01.I02" @click="createOpen = true" style="padding: 6px 12px">创建 Key</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <table v-else data-testid="api-key-table" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">名称</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">前缀</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">状态</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="k in keys" :key="k.id" data-testid="api-key-row">
          <td style="padding: 8px">{{ k.name }}</td>
          <td style="padding: 8px; font-family: monospace">{{ k.prefix }}</td>
          <td style="padding: 8px">{{ KEY_STATUS_LABELS[k.status] }}</td>
          <td style="padding: 8px; text-align: right">
            <button data-fn="M05.F01.I04" @click="rotate(k)">轮换</button>
            <button data-fn="M05.F01.I03" @click="revoke(k)" style="margin-left: 8px; color: #c00">吊销</button>
          </td>
        </tr>
        <tr v-if="keys.length === 0">
          <td colspan="4" style="padding: 16px; text-align: center; color: #888" data-testid="empty">还没有 API Key</td>
        </tr>
      </tbody>
    </table>

    <CrudDialog
      v-model:open="createOpen"
      title="创建 API Key"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useTenantApiKeysListApiKeys,
  useTenantApiKeysCreateApiKey,
  useTenantApiKeysRevokeApiKey,
  useTenantApiKeysRotateApiKey,
} from "../api/endpoints/endpoints";
import type { ApiKey, CreateApiKeyRequest } from "../api/endpoints/endpoints.schemas";
import CrudDialog, { type FieldDef } from "../components/crud-dialog.vue";
import { toApiError } from "../api/http-client";

const props = defineProps<{ tenantId?: string }>();

const KEY_STATUS_LABELS: Record<string, string> = {
  active: "启用",
  revoked: "已吊销",
};

const FIELDS: FieldDef[] = [
  { name: "name", label: "名称", required: true, placeholder: "Prod Key" },
];

const list = useTenantApiKeysListApiKeys(computed(() => props.tenantId ?? ""));
const createMut = useTenantApiKeysCreateApiKey();
const revokeMut = useTenantApiKeysRevokeApiKey();
const rotateMut = useTenantApiKeysRotateApiKey();

const isLoading = computed(() => list.isLoading.value);
const keys = computed<ApiKey[]>(() => list.data.value?.data?.items ?? []);

const createOpen = ref(false);

async function onCreate(values: Record<string, any>) {
  if (!props.tenantId) return;
  try {
    await createMut.mutateAsync({
      tenantId: props.tenantId,
      data: values as unknown as CreateApiKeyRequest,
    });
    createOpen.value = false;
    list.refetch();
  } catch (err) {
    alert(`创建失败：${toApiError(err).message}`);
  }
}

async function revoke(k: ApiKey) {
  if (!props.tenantId) return;
  if (!confirm(`吊销 API Key「${k.name}」？`)) return;
  try {
    await revokeMut.mutateAsync({ tenantId: props.tenantId, keyId: k.id });
    list.refetch();
  } catch (err) {
    alert(`吊销失败：${toApiError(err).message}`);
  }
}

async function rotate(k: ApiKey) {
  if (!props.tenantId) return;
  if (!confirm(`轮换 API Key「${k.name}」？旧 Key 将立即失效。`)) return;
  try {
    await rotateMut.mutateAsync({ tenantId: props.tenantId, keyId: k.id });
    list.refetch();
  } catch (err) {
    alert(`轮换失败：${toApiError(err).message}`);
  }
}
</script>