<script setup lang="ts">
// M02.F01 — tenant-scoped 角色列表（CRUD + 菜单授权入口）

import { computed, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import {
  useTenantRolesCreateSysRole,
  useTenantRolesDeleteSysRole,
  useTenantRolesListSysRoles,
  useTenantRolesUpdateSysRole,
} from "../api/endpoints/tenant-roles/tenant-roles";
import type {
  CreateSysRoleRequest,
  SysRole,
  UpdateSysRoleRequest,
} from "../api/endpoints/title.schemas";
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

const FIELDS: FieldDef[] = [
  { name: "roleCode", label: "Code", required: true, placeholder: "admin" },
  { name: "roleName", label: "名称", required: true, placeholder: "管理员" },
];

const EDIT_FIELDS: FieldDef[] = [
  { name: "roleName", label: "名称", required: true, placeholder: "管理员" },
];

const route = useRoute();
const tenantStore = useTenantStore();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
// 租户名走 GET /api/v1/admin/tenants/:id，加载中/失败显示「租户未知」。
// 集中到 tenant-store.tenantFor()，缓存交给 vue-query。
const tenant = tenantStore.tenantFor(tenantId);
const tenantLabel = computed(() => {
  return tenant.value ? `租户 ${tenant.value.name}（${tenant.value.tenantKey}）` : "租户未知";
});

const list = useTenantRolesListSysRoles(tenantId, {} as any);
const createMut = useTenantRolesCreateSysRole();
const deleteMut = useTenantRolesDeleteSysRole();
const updateMut = useTenantRolesUpdateSysRole();

const createOpen = ref(false);
const editTarget = ref<SysRole | null>(null);
const deleteTarget = ref<SysRole | null>(null);

const roles = computed<SysRole[]>(() => list.data.value?.data?.items ?? []);

async function onCreate(values: Record<string, unknown>) {
  try {
    await createMut.mutateAsync({
      tenantId: tenantId.value,
      data: values as unknown as CreateSysRoleRequest,
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
      data: { roleName: values.roleName as string } as UpdateSysRoleRequest,
    });
    editTarget.value = null;
    list.refetch();
    toast.success("角色已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
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
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in roles" :key="r.id" data-testid="role-row">
              <TableCell class="font-mono text-xs">{{ r.roleCode }}</TableCell>
              <TableCell class="font-medium">{{ r.roleName }}</TableCell>
              <TableCell class="text-right space-x-1">
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
      :initial-values="editTarget ? { roleName: editTarget.roleName } : undefined"
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除角色「${deleteTarget?.roleName ?? ''}」？`"
      description="角色删除将一并解除角色与用户的绑定关系。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
