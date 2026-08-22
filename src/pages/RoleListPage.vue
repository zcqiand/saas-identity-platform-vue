<script setup lang="ts">
// M02.F01 — tenant-scoped 角色列表（CRUD + 菜单授权入口）

import { computed, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useTenantRolesCreateRole } from "../api/endpoints/endpoints";
import { useTenantRolesDeleteRole } from "../api/endpoints/endpoints";
import { useTenantRolesListRoles } from "../api/endpoints/endpoints";
import { useTenantRolesSetPermissions } from "../api/endpoints/endpoints";
import { useTenantRolesUpdateRole } from "../api/endpoints/endpoints";
import type {
  CreateRoleRequest,
  Role,
  UpdateRoleRequest,
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
import ConfirmDialog from "../components/app/confirm-dialog.vue";
import CrudDialog from "../components/app/crud-dialog.vue";
import type { FieldDef } from "../components/app/crud-dialog.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";
import { useTenantStore } from "../state/tenant-store";

const PERMISSION_OPTIONS = [
  { value: "users.read", label: "users.read" },
  { value: "users.write", label: "users.write" },
  { value: "roles.read", label: "roles.read" },
  { value: "roles.write", label: "roles.write" },
  { value: "api_keys.read", label: "api_keys.read" },
  { value: "api_keys.write", label: "api_keys.write" },
  { value: "audit.read", label: "audit.read" },
];

const FIELDS: FieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "admin" },
  { name: "name", label: "名称", required: true, placeholder: "管理员" },
];

const EDIT_FIELDS = FIELDS.filter((f) => f.name !== "code");

const route = useRoute();
const tenantStore = useTenantStore();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
// 租户名走 GET /api/v1/admin/tenants/:id，加载中/失败显示「租户未知」。
// 集中到 tenant-store.tenantFor()，缓存交给 vue-query。
const tenant = tenantStore.tenantFor(tenantId);
const tenantLabel = computed(() => {
  return tenant.value ? `租户 ${tenant.value.name}（${tenant.value.code}）` : "租户未知";
});

const list = useTenantRolesListRoles(tenantId);
const createMut = useTenantRolesCreateRole();
const updateMut = useTenantRolesUpdateRole();
const deleteMut = useTenantRolesDeleteRole();
const permMut = useTenantRolesSetPermissions();

const createOpen = ref(false);
const editTarget = ref<Role | null>(null);
const deleteTarget = ref<Role | null>(null);
const permTarget = ref<Role | null>(null);

const roles = computed<Role[]>(() => list.data.value?.data?.items ?? []);

async function onCreate(values: Record<string, unknown>) {
  try {
    await createMut.mutateAsync({
      tenantId: tenantId.value,
      data: values as unknown as CreateRoleRequest,
    });
    createOpen.value = false;
    list.refetch();
    toast.success("角色已创建");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      tenantId: tenantId.value,
      roleId: editTarget.value.id,
      data: { name: values.name as string } as UpdateRoleRequest,
    });
    editTarget.value = null;
    list.refetch();
    toast.success("角色已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function onSetPermissions(values: Record<string, unknown>) {
  if (!permTarget.value) return;
  const permissionIds = Array.isArray(values.permissionIds)
    ? (values.permissionIds as string[])
    : [];
  try {
    await permMut.mutateAsync({
      tenantId: tenantId.value,
      roleId: permTarget.value.id,
      data: { permissionIds },
    });
    permTarget.value = null;
    list.refetch();
    toast.success("权限已更新");
  } catch (err) {
    toast.error(`权限更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteMut.mutateAsync({ tenantId: tenantId.value, roleId: deleteTarget.value.id });
    deleteTarget.value = null;
    list.refetch();
    toast.success("角色已删除");
  } catch (err) {
    toast.error(`删除失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="角色权限" :description="`${tenantLabel} 的角色矩阵`">
      <template #actions>
        <Button data-fn="M02.F01.I02" @click="createOpen = true">新建角色</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>角色列表 ({{ roles.length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>权限</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in roles" :key="r.id" data-testid="role-row">
              <TableCell class="font-mono text-xs">{{ r.code }}</TableCell>
              <TableCell class="font-medium">{{ r.name }}</TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ (r.permissionIds ?? []).length }} 项
                </span>
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M02.F02.I01"
                  @click="() => (permTarget = r)"
                >
                  权限矩阵
                </Button>
                <Button variant="ghost" size="sm" data-fn="M09.F01.I01" as-child>
                  <RouterLink :to="`/tenants/${tenantId}/roles/${r.id}/menus`">菜单授权</RouterLink>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M02.F01.I04"
                  @click="() => (editTarget = r)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M02.F01.I05"
                  class="text-red-600 hover:text-red-700"
                  @click="() => (deleteTarget = r)"
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
      title="新建角色"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑角色"
      :fields="EDIT_FIELDS"
      :initial-values="editTarget ? { name: editTarget.name } : undefined"
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <CrudDialog
      :open="permTarget !== null"
      @update:open="(v) => !v && (permTarget = null)"
      :title="`权限矩阵：${permTarget?.name ?? ''}`"
      :fields="[
        {
          name: 'permissionIds',
          label: '权限（多选）',
          type: 'select',
          options: PERMISSION_OPTIONS,
        },
      ]"
      submit-text="保存权限"
      :loading="permMut.isPending.value"
      :render-field-names="['permissionIds']"
      @submit="onSetPermissions"
    >
      <template #field.permissionIds="{ value, onChange }">
        <div class="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
          <label
            v-for="p in PERMISSION_OPTIONS"
            :key="p.value"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              :checked="Array.isArray(value) && value.includes(p.value)"
              class="h-4 w-4"
              @change="
                (e) => {
                  const next = new Set(Array.isArray(value) ? value : []);
                  if ((e.target as HTMLInputElement).checked) next.add(p.value);
                  else next.delete(p.value);
                  onChange(Array.from(next));
                }
              "
            />
            <span class="font-mono text-xs">{{ p.value }}</span>
          </label>
        </div>
      </template>
    </CrudDialog>

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除角色「${deleteTarget?.name ?? ''}」？`"
      description="角色删除将一并解除角色与用户的绑定关系。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
