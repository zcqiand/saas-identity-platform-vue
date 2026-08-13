<script setup lang="ts">
// M00.F01 — 平台级租户管理（CRUD）

import { ref } from "vue";
import { Check } from "lucide-vue-next";
import { useAdminTenantsCreateTenant } from "../api/endpoints/endpoints";
import { useAdminTenantsDeleteTenant } from "../api/endpoints/endpoints";
import { useAdminTenantsListTenants } from "../api/endpoints/endpoints";
import { useAdminTenantsUpdateTenant } from "../api/endpoints/endpoints";
import type {
  CreateTenantRequest,
  Tenant,
  UpdateTenantRequest,
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
import EmptyState from "../components/app/empty-state.vue";
import ConfirmDialog from "../components/app/confirm-dialog.vue";
import CrudDialog from "../components/app/crud-dialog.vue";
import type { FieldDef } from "../components/app/crud-dialog.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";

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

const createOpen = ref(false);
const editTarget = ref<Tenant | null>(null);
const deleteTarget = ref<Tenant | null>(null);

const tenants = (): Tenant[] => list.data.value?.data?.items ?? [];

async function onCreate(values: Record<string, unknown>) {
  try {
    await createMut.mutateAsync({ data: values as unknown as CreateTenantRequest });
    createOpen.value = false;
    list.refetch();
    toast.success("租户已创建");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      id: editTarget.value.id,
      data: {
        name: values.name as string,
        status: values.status as "active" | "suspended" | "archived",
      } as UpdateTenantRequest,
    });
    editTarget.value = null;
    list.refetch();
    toast.success("租户已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteMut.mutateAsync({ id: deleteTarget.value.id });
    deleteTarget.value = null;
    list.refetch();
    toast.success("租户已删除");
  } catch (err) {
    toast.error(`删除失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="租户管理" description="管理 SaaS 平台上的所有租户账号">
      <template #actions>
        <Button data-fn="M00.F01.I02" @click="createOpen = true">新建租户</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>租户列表 ({{ tenants().length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <EmptyState
          v-if="tenants().length === 0"
          title="还没有租户"
          description="创建第一个租户开始使用"
        />
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12"></TableHead>
              <TableHead>Code</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="t in tenants()"
              :key="t.id"
              data-testid="tenant-row"
              class="cursor-pointer"
            >
              <TableCell>
                <Check class="h-4 w-4 invisible" />
              </TableCell>
              <TableCell class="font-mono text-xs">{{ t.code }}</TableCell>
              <TableCell class="font-medium">{{ t.name }}</TableCell>
              <TableCell>
                <StatusBadge :status="t.status as 'active' | 'suspended' | 'archived'" />
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F01.I04"
                  @click="
                    () => {
                      editTarget = t;
                    }
                  "
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F01.I05"
                  class="text-red-600 hover:text-red-700"
                  @click="
                    () => {
                      deleteTarget = t;
                    }
                  "
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
      title="新建租户"
      description="创建一个新的租户账号。Code 与名称不可重复。"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑租户"
      :fields="FIELDS"
      :initial-values="
        editTarget
          ? { code: editTarget.code, name: editTarget.name, status: editTarget.status }
          : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除租户「${deleteTarget?.name ?? ''}」？`"
      description="删除后该租户下的用户、角色、API Key 数据将无法访问。操作不可撤销。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
