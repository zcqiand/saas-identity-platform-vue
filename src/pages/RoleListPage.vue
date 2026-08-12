<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">角色权限（M02.F01）— tenant {{ props.tenantId?.slice(0, 8) }}</h1>
      <button data-fn="M02.F01.I02" @click="createOpen = true" style="padding: 6px 12px">新建角色</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <table v-else data-testid="role-table" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">Code</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">名称</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">权限数</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in roles" :key="r.id" data-testid="role-row">
          <td style="padding: 8px; font-family: monospace">{{ r.code }}</td>
          <td style="padding: 8px">{{ r.name }}</td>
          <td style="padding: 8px">{{ r.permissionIds.length }}</td>
          <td style="padding: 8px; text-align: right">
            <button data-fn="M02.F01.I04" @click="openEdit(r)">编辑</button>
            <button data-fn="M02.F01.I05" @click="confirmDelete(r)" style="margin-left: 8px; color: #c00">删除</button>
          </td>
        </tr>
        <tr v-if="roles.length === 0">
          <td colspan="4" style="padding: 16px; text-align: center; color: #888" data-testid="empty">还没有角色</td>
        </tr>
      </tbody>
    </table>

    <CrudDialog
      v-model:open="createOpen"
      title="新建角色"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />
    <CrudDialog
      v-model:open="editOpen"
      title="编辑角色"
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
  useTenantRolesListRoles,
  useTenantRolesCreateRole,
  useTenantRolesUpdateRole,
  useTenantRolesDeleteRole,
} from "../api/endpoints/endpoints";
import type { CreateRoleRequest, Role, UpdateRoleRequest } from "../api/endpoints/endpoints.schemas";
import CrudDialog, { type FieldDef } from "../components/crud-dialog.vue";
import { toApiError } from "../api/http-client";

const props = defineProps<{ tenantId?: string }>();

const FIELDS: FieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "admin" },
  { name: "name", label: "名称", required: true, placeholder: "管理员" },
];

const list = useTenantRolesListRoles(computed(() => props.tenantId ?? ""));
const createMut = useTenantRolesCreateRole();
const updateMut = useTenantRolesUpdateRole();
const deleteMut = useTenantRolesDeleteRole();

const isLoading = computed(() => list.isLoading.value);
const roles = computed<Role[]>(() => list.data.value?.data?.items ?? []);

const createOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<Role | null>(null);
const editInitial = computed(() =>
  editTarget.value
    ? { code: editTarget.value.code, name: editTarget.value.name }
    : undefined,
);

function openEdit(r: Role) {
  editTarget.value = r;
  editOpen.value = true;
}

async function onCreate(values: Record<string, any>) {
  if (!props.tenantId) return;
  try {
    await createMut.mutateAsync({
      tenantId: props.tenantId,
      data: values as unknown as CreateRoleRequest,
    });
    createOpen.value = false;
    list.refetch();
  } catch (err) {
    alert(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, any>) {
  if (!editTarget.value || !props.tenantId) return;
  try {
    await updateMut.mutateAsync({
      tenantId: props.tenantId,
      roleId: editTarget.value.id,
      data: { name: values.name as string } as UpdateRoleRequest,
    });
    editOpen.value = false;
    editTarget.value = null;
    list.refetch();
  } catch (err) {
    alert(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete(r: Role) {
  if (!props.tenantId) return;
  if (!confirm(`删除角色「${r.name}」？`)) return;
  try {
    await deleteMut.mutateAsync({ tenantId: props.tenantId, roleId: r.id });
    list.refetch();
  } catch (err) {
    alert(`删除失败：${toApiError(err).message}`);
  }
}
</script>