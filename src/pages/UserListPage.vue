<script setup lang="ts">
// M01.F01 — tenant-scoped 用户列表（CRUD）

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useTenantRolesListRoles } from "../api/endpoints/endpoints";
import { useTenantUsersAssignRoles } from "../api/endpoints/endpoints";
import { useTenantUsersCreateUser } from "../api/endpoints/endpoints";
import { useTenantUsersDeleteUser } from "../api/endpoints/endpoints";
import { useTenantUsersListUsers } from "../api/endpoints/endpoints";
import { useTenantUsersUpdateUser } from "../api/endpoints/endpoints";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../api/endpoints/endpoints.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue"
import CardHeader from "../components/ui/card-header.vue"
import CardTitle from "../components/ui/card-title.vue"
import Table from "../components/ui/table.vue";
import TableBody from "../components/ui/table-body.vue"
import TableCell from "../components/ui/table-cell.vue"
import TableHead from "../components/ui/table-head.vue"
import TableHeader from "../components/ui/table-header.vue"
import TableRow from "../components/ui/table-row.vue"
import PageHeader from "../components/app/page-header.vue";
import StatusBadge from "../components/app/status-badge.vue";
import ConfirmDialog from "../components/app/confirm-dialog.vue";
import CrudDialog from "../components/app/crud-dialog.vue";
import type { FieldDef } from "../components/app/crud-dialog.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";
import { getTenant } from "@saas/identity-platform-msw";

const FIELDS: FieldDef[] = [
  { name: "username", label: "用户名", required: true, placeholder: "alice" },
  { name: "email", label: "邮箱", required: true, placeholder: "alice@acme.io" },
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

const EDIT_FIELDS = FIELDS.filter((f) => f.name !== "username");

const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
const tenantLabel = computed(() => {
  const id = tenantId.value;
  const tenant = id ? getTenant(id) ?? null : null;
  return tenant ? `租户 ${tenant.name}（${tenant.code}）` : "租户未知";
});

const usersQ = useTenantUsersListUsers(tenantId);
const rolesQ = useTenantRolesListRoles(tenantId);
const createMut = useTenantUsersCreateUser();
const updateMut = useTenantUsersUpdateUser();
const deleteMut = useTenantUsersDeleteUser();
const roleAssignMut = useTenantUsersAssignRoles();

const createOpen = ref(false);
const editTarget = ref<User | null>(null);
const deleteTarget = ref<User | null>(null);
const roleTarget = ref<User | null>(null);

const users = computed<User[]>(() => usersQ.data.value?.data?.items ?? []);
const roles = computed(() => rolesQ.data.value?.data?.items ?? []);

async function onCreate(values: Record<string, unknown>) {
  try {
    await createMut.mutateAsync({
      tenantId: tenantId.value,
      data: values as unknown as CreateUserRequest,
    });
    createOpen.value = false;
    usersQ.refetch();
    toast.success("用户已创建");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      tenantId: tenantId.value,
      userId: editTarget.value.id,
      data: {
        email: values.email as string,
        status: values.status as User["status"],
      } as UpdateUserRequest,
    });
    editTarget.value = null;
    usersQ.refetch();
    toast.success("用户已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function onAssignRoles(values: Record<string, unknown>) {
  if (!roleTarget.value) return;
  const roleIds = Array.isArray(values.roleIds) ? (values.roleIds as string[]) : [];
  try {
    await roleAssignMut.mutateAsync({
      tenantId: tenantId.value,
      userId: roleTarget.value.id,
      data: { roleIds },
    });
    roleTarget.value = null;
    usersQ.refetch();
    toast.success("角色已分配");
  } catch (err) {
    toast.error(`角色分配失败：${toApiError(err).message}`);
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteMut.mutateAsync({ tenantId: tenantId.value, userId: deleteTarget.value.id });
    deleteTarget.value = null;
    usersQ.refetch();
    toast.success("用户已删除");
  } catch (err) {
    toast.error(`删除失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="用户管理" :description="`${tenantLabel} 的所有用户`">
      <template #actions>
        <Button data-fn="M01.F01.I02" @click="createOpen = true">邀请用户</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>用户列表 ({{ users.length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>角色</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="u in users" :key="u.id" data-testid="user-row">
              <TableCell class="font-medium">{{ u.username }}</TableCell>
              <TableCell class="text-slate-500">{{ u.email }}</TableCell>
              <TableCell>
                <StatusBadge :status="u.status" />
              </TableCell>
              <TableCell>
                <span class="text-xs text-slate-500">{{ (u.roleIds ?? []).length }} 项</span>
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M01.F02.I01"
                  @click="() => (roleTarget = u)"
                >
                  分配角色
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M01.F01.I04"
                  @click="() => (editTarget = u)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M01.F01.I05"
                  class="text-red-600 hover:text-red-700"
                  @click="() => (deleteTarget = u)"
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <CrudDialog
      :open="createOpen"
      @update:open="(v) => (createOpen = v)"
      title="邀请用户"
      description="向租户添加一个新用户。"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑用户"
      :fields="EDIT_FIELDS"
      :initial-values="
        editTarget ? { email: editTarget.email, status: editTarget.status } : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <CrudDialog
      :open="roleTarget !== null"
      @update:open="(v) => !v && (roleTarget = null)"
      :title="`分配角色：${roleTarget?.username ?? ''}`"
      :fields="[
        {
          name: 'roleIds',
          label: '角色（多选）',
          type: 'select',
          options: roles.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })),
        },
      ]"
      submit-text="保存角色"
      :loading="roleAssignMut.isPending.value"
      :initial-values="roleTarget ? { roleIds: roleTarget.roleIds ?? [] } : undefined"
      :render-field-names="['roleIds']"
      @submit="onAssignRoles"
    >
      <template #field.roleIds="{ value, onChange }">
        <div class="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
          <label
            v-for="r in roles"
            :key="r.id"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              :checked="Array.isArray(value) && value.includes(r.id)"
              class="h-4 w-4"
              @change="
                (e) => {
                  const next = new Set(Array.isArray(value) ? value : []);
                  if ((e.target as HTMLInputElement).checked) next.add(r.id);
                  else next.delete(r.id);
                  onChange(Array.from(next));
                }
              "
            />
            <span class="font-mono text-xs">{{ r.code }}</span>
            <span>{{ r.name }}</span>
          </label>
        </div>
      </template>
    </CrudDialog>

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除用户「${deleteTarget?.username ?? ''}」？`"
      description="用户删除后不可恢复，已分配的关联角色也会一并解除。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
