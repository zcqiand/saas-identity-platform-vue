<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">用户管理（M01.F01）— tenant {{ props.tenantId?.slice(0, 8) }}</h1>
      <button data-fn="M01.F01.I02" @click="createOpen = true" style="padding: 6px 12px">新建用户</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <table v-else data-testid="user-table" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">用户名</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">邮箱</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">状态</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id" data-testid="user-row">
          <td style="padding: 8px">{{ u.username }}</td>
          <td style="padding: 8px">{{ u.email ?? "—" }}</td>
          <td style="padding: 8px">{{ USER_STATUS_LABELS[u.status] }}</td>
          <td style="padding: 8px; text-align: right">
            <button data-fn="M01.F01.I04" @click="openEdit(u)">编辑</button>
            <button data-fn="M01.F01.I05" @click="confirmDelete(u)" style="margin-left: 8px; color: #c00">删除</button>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="4" style="padding: 16px; text-align: center; color: #888" data-testid="empty">还没有用户</td>
        </tr>
      </tbody>
    </table>

    <CrudDialog
      v-model:open="createOpen"
      title="新建用户"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />
    <CrudDialog
      v-model:open="editOpen"
      title="编辑用户"
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
  useTenantUsersListUsers,
  useTenantUsersCreateUser,
  useTenantUsersUpdateUser,
  useTenantUsersDeleteUser,
} from "../api/endpoints/endpoints";
import type { CreateUserRequest, User, UpdateUserRequest } from "../api/endpoints/endpoints.schemas";
import CrudDialog, { type FieldDef } from "../components/crud-dialog.vue";
import { toApiError } from "../api/http-client";

const props = defineProps<{ tenantId?: string }>();

const USER_STATUS_LABELS: Record<string, string> = {
  active: "启用",
  invited: "已邀请",
  suspended: "暂停",
  disabled: "停用",
};

const FIELDS: FieldDef[] = [
  { name: "username", label: "用户名", required: true },
  { name: "email", label: "邮箱", placeholder: "user@example.com" },
  {
    name: "status",
    label: "状态",
    type: "select",
    required: true,
    defaultValue: "invited",
    options: [
      { value: "active", label: "启用" },
      { value: "invited", label: "已邀请" },
      { value: "suspended", label: "暂停" },
      { value: "disabled", label: "停用" },
    ],
  },
];

const list = useTenantUsersListUsers(computed(() => props.tenantId ?? ""));
const createMut = useTenantUsersCreateUser();
const updateMut = useTenantUsersUpdateUser();
const deleteMut = useTenantUsersDeleteUser();

const isLoading = computed(() => list.isLoading.value);
const users = computed<User[]>(() => list.data.value?.data?.items ?? []);

const createOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<User | null>(null);
const editInitial = computed(() =>
  editTarget.value
    ? {
        username: editTarget.value.username,
        email: editTarget.value.email ?? "",
        status: editTarget.value.status,
      }
    : undefined,
);

function openEdit(u: User) {
  editTarget.value = u;
  editOpen.value = true;
}

async function onCreate(values: Record<string, any>) {
  if (!props.tenantId) return;
  try {
    await createMut.mutateAsync({
      tenantId: props.tenantId,
      data: values as unknown as CreateUserRequest,
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
      userId: editTarget.value.id,
      data: { email: values.email, status: values.status } as UpdateUserRequest,
    });
    editOpen.value = false;
    editTarget.value = null;
    list.refetch();
  } catch (err) {
    alert(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete(u: User) {
  if (!props.tenantId) return;
  if (!confirm(`删除用户「${u.username}」？`)) return;
  try {
    await deleteMut.mutateAsync({ tenantId: props.tenantId, userId: u.id });
    list.refetch();
  } catch (err) {
    alert(`删除失败：${toApiError(err).message}`);
  }
}
</script>