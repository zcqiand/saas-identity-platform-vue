<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">应用管理（M08.F01）</h1>
      <button data-fn="M08.F01.I02" @click="createOpen = true" style="padding: 6px 12px">注册应用</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <table v-else data-testid="app-table" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">Code</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">名称</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">状态</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in apps" :key="a.id" data-testid="app-row">
          <td style="padding: 8px; font-family: monospace">{{ a.code }}</td>
          <td style="padding: 8px">{{ a.name }}</td>
          <td style="padding: 8px">{{ APP_STATUS_LABELS[a.status] }}</td>
          <td style="padding: 8px; text-align: right">
            <button data-fn="M08.F01.I01" @click="goMenus(a.id)">菜单</button>
            <button data-fn="M08.F01.I04" @click="openEdit(a)" style="margin-left: 8px">编辑</button>
            <button data-fn="M08.F01.I05" @click="confirmDelete(a)" style="margin-left: 8px; color: #c00">删除</button>
          </td>
        </tr>
        <tr v-if="apps.length === 0">
          <td colspan="4" style="padding: 16px; text-align: center; color: #888" data-testid="empty">还没有应用</td>
        </tr>
      </tbody>
    </table>

    <CrudDialog
      v-model:open="createOpen"
      title="注册应用"
      :fields="FIELDS"
      submit-text="注册"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />
    <CrudDialog
      v-model:open="editOpen"
      title="编辑应用"
      :fields="FIELDS"
      :initial-values="editInitial"
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  useAdminAppsListApps,
  useAdminAppsCreateApp,
  useAdminAppsUpdateApp,
  useAdminAppsDeleteApp,
} from "../api/endpoints/endpoints";
import type { App, CreateAppRequest, UpdateAppRequest } from "../api/endpoints/endpoints.schemas";
import CrudDialog, { type FieldDef } from "../components/crud-dialog.vue";
import { toApiError } from "../api/http-client";

const APP_STATUS_LABELS: Record<string, string> = {
  active: "启用",
  disabled: "停用",
};

const FIELDS: FieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "lab-portal" },
  { name: "name", label: "名称", required: true, placeholder: "实验室门户" },
];

const router = useRouter();
const list = useAdminAppsListApps();
const createMut = useAdminAppsCreateApp();
const updateMut = useAdminAppsUpdateApp();
const deleteMut = useAdminAppsDeleteApp();

const isLoading = computed(() => list.isLoading.value);
const apps = computed<App[]>(() => list.data.value?.data?.items ?? []);

const createOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<App | null>(null);
const editInitial = computed(() =>
  editTarget.value
    ? { code: editTarget.value.code, name: editTarget.value.name }
    : undefined,
);

function goMenus(appId: string) {
  router.push(`/admin/apps/${appId}/menus`);
}

function openEdit(a: App) {
  editTarget.value = a;
  editOpen.value = true;
}

async function onCreate(values: Record<string, any>) {
  try {
    await createMut.mutateAsync({ data: values as unknown as CreateAppRequest });
    createOpen.value = false;
    list.refetch();
  } catch (err) {
    alert(`注册失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, any>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      appId: editTarget.value.id,
      data: { name: values.name as string } as UpdateAppRequest,
    });
    editOpen.value = false;
    editTarget.value = null;
    list.refetch();
  } catch (err) {
    alert(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete(a: App) {
  if (!confirm(`删除应用「${a.name}」？`)) return;
  try {
    await deleteMut.mutateAsync({ appId: a.id });
    list.refetch();
  } catch (err) {
    alert(`删除失败：${toApiError(err).message}`);
  }
}
</script>