<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">租户管理（M00.F01）</h1>
      <button data-fn="M00.F01.I02" @click="openCreate" style="padding: 6px 12px">新建租户</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <p v-else-if="isError" data-testid="error" style="color: #c00">{{ errorMessage }}</p>
    <table v-else data-testid="tenant-table" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">Code</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">名称</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">状态</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tenants" :key="t.id" data-testid="tenant-row">
          <td style="padding: 8px">{{ t.code }}</td>
          <td style="padding: 8px">{{ t.name }}</td>
          <td style="padding: 8px">{{ STATUS_LABELS[t.status] }}</td>
          <td style="padding: 8px; text-align: right">
            <button data-fn="M00.F01.I04" @click="openEdit(t)">编辑</button>
            <button data-fn="M00.F01.I05" @click="confirmDelete(t)" style="margin-left: 8px; color: #c00">删除</button>
          </td>
        </tr>
        <tr v-if="tenants.length === 0">
          <td colspan="4" style="padding: 16px; text-align: center; color: #888" data-testid="empty">还没有租户</td>
        </tr>
      </tbody>
    </table>

    <CrudDialog
      v-model:open="createOpen"
      title="新建租户"
      description="创建一个新的租户账号。Code 与名称不可重复。"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />
    <CrudDialog
      v-model:open="editOpen"
      title="编辑租户"
      :fields="FIELDS"
      :initial-values="editInitial"
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useAdminTenantsListTenants,
  useAdminTenantsCreateTenant,
  useAdminTenantsUpdateTenant,
  useAdminTenantsDeleteTenant,
} from "../api/endpoints/endpoints";
import type { CreateTenantRequest, Tenant, UpdateTenantRequest } from "../api/endpoints/endpoints.schemas";
import CrudDialog, { type FieldDef } from "../components/crud-dialog.vue";
import { toApiError } from "../api/http-client";

const STATUS_LABELS: Record<string, string> = {
  active: "启用",
  suspended: "暂停",
  archived: "归档",
};

const FIELDS: FieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "acme" },
  { name: "name", label: "名称", required: true, placeholder: "ACME Corp" },
  {
    name: "status",
    label: "状态",
    type: "select",
    required: true,
    defaultValue: "active",
    options: [
      { value: "active", label: "启用" },
      { value: "suspended", label: "暂停" },
      { value: "archived", label: "归档" },
    ],
  },
];

const list = useAdminTenantsListTenants();
const createMut = useAdminTenantsCreateTenant();
const updateMut = useAdminTenantsUpdateTenant();
const deleteMut = useAdminTenantsDeleteTenant();

const isLoading = computed(() => list.isLoading.value);
const isError = computed(() => list.isError.value);
const errorMessage = computed(() => (list.error.value ? toApiError(list.error.value).message : ""));
const tenants = computed<Tenant[]>(() => list.data.value?.data?.items ?? []);

const createOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<Tenant | null>(null);
const editInitial = computed(() =>
  editTarget.value
    ? { code: editTarget.value.code, name: editTarget.value.name, status: editTarget.value.status }
    : undefined,
);

function openCreate() {
  createOpen.value = true;
}

function openEdit(t: Tenant) {
  editTarget.value = t;
  editOpen.value = true;
}

async function onCreate(values: Record<string, any>) {
  try {
    await createMut.mutateAsync({ data: values as unknown as CreateTenantRequest });
    createOpen.value = false;
    list.refetch();
  } catch (err) {
    alert(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, any>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      id: editTarget.value.id,
      data: {
        name: values.name as string,
        status: values.status as "active" | "suspended" | "archived",
      } as UpdateTenantRequest,
    });
    editOpen.value = false;
    editTarget.value = null;
    list.refetch();
  } catch (err) {
    alert(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete(t: Tenant) {
  if (!confirm(`删除租户「${t.name}」？操作不可撤销。`)) return;
  try {
    await deleteMut.mutateAsync({ id: t.id });
    list.refetch();
  } catch (err) {
    alert(`删除失败：${toApiError(err).message}`);
  }
}
</script>