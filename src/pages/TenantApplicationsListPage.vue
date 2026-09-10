<script setup lang="ts">
// M00.F05 — 租户应用订阅列表（subscribe / update / remove）

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  useTenantApplicationsListTenantApplications,
  useTenantApplicationsRemoveTenantApplication,
  useTenantApplicationsSubscribeTenantApplication,
  useTenantApplicationsUpdateTenantApplication,
} from "../api/endpoints/tenant-applications/tenant-applications";
import type {
  SubscribeTenantApplicationRequest,
  TenantApplication,
  UpdateTenantApplicationRequest,
} from "../api/endpoints/title.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue";
import CardHeader from "../components/ui/card-header.vue";
import CardTitle from "../components/ui/card-title.vue";
import Table from "../components/ui/table.vue";
import TableBody from "../components/ui/table-body.vue";
import TableCell from "../components/ui/table-cell.vue";
import TableHead from "../components/ui/table-head.vue";
import TableHeader from "../components/ui/table-header.vue";
import TableRow from "../components/ui/table-row.vue";
import PageHeader from "../components/app/page-header.vue";
import EmptyState from "../components/app/empty-state.vue";
import ConfirmDialog from "../components/app/confirm-dialog.vue";
import CrudDialog from "../components/app/crud-dialog.vue";
import type { FieldDef } from "../components/app/crud-dialog.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";
import { useTenantStore } from "../state/tenant-store";

/** M00.F05 状态码（家族约定 2026-09-10）：0=待激活 / 1=启用 / 2=停用 */
const STATUS_OPTIONS = [
  { value: "0", label: "待激活" },
  { value: "1", label: "启用" },
  { value: "2", label: "停用" },
];

const SUBSCRIBE_FIELDS: FieldDef[] = [
  { name: "clientId", label: "Client ID", required: true, placeholder: "lab-management" },
  { name: "expireTime", label: "到期时间", placeholder: "2027-01-01T00:00:00Z（留空=永久）" },
];

const UPDATE_FIELDS: FieldDef[] = [
  {
    name: "status",
    label: "状态",
    type: "select",
    required: true,
    defaultValue: "1",
    options: STATUS_OPTIONS,
  },
  { name: "expireTime", label: "到期时间", placeholder: "留空=永久" },
];

const route = useRoute();
const tenantStore = useTenantStore();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
const tenant = tenantStore.tenantFor(tenantId);
const tenantLabel = computed(() => {
  return tenant.value ? `租户 ${tenant.value.name}（${tenant.value.tenantKey}）` : "租户未知";
});

const list = useTenantApplicationsListTenantApplications(tenantId, {} as any);
const subscribeMut = useTenantApplicationsSubscribeTenantApplication();
const updateMut = useTenantApplicationsUpdateTenantApplication();
const removeMut = useTenantApplicationsRemoveTenantApplication();

const subscribeOpen = ref(false);
const editTarget = ref<TenantApplication | null>(null);
const removeTarget = ref<TenantApplication | null>(null);

const apps = computed<TenantApplication[]>(() => list.data.value?.data?.items ?? []);

function statusLabel(s: number): string {
  return STATUS_OPTIONS.find((o) => o.value === String(s))?.label ?? `状态 ${s}`;
}

function formatExpire(expireTime?: string): string {
  if (!expireTime) return "永久";
  return expireTime.slice(0, 10);
}

async function onSubscribe(values: Record<string, unknown>) {
  try {
    await subscribeMut.mutateAsync({
      tenantId: tenantId.value,
      data: {
        clientId: String(values.clientId ?? "").trim(),
        expireTime: values.expireTime ? String(values.expireTime) : undefined,
      } as SubscribeTenantApplicationRequest,
    });
    subscribeOpen.value = false;
    list.refetch();
    toast.success("应用已订阅");
  } catch (err) {
    toast.error(`订阅失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      tenantId: tenantId.value,
      clientId: editTarget.value.clientId,
      data: {
        status: Number(values.status),
        expireTime: values.expireTime ? String(values.expireTime) : undefined,
      } as UpdateTenantApplicationRequest,
    });
    editTarget.value = null;
    list.refetch();
    toast.success("订阅已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmRemove() {
  if (!removeTarget.value) return;
  try {
    await removeMut.mutateAsync({
      tenantId: tenantId.value,
      clientId: removeTarget.value.clientId,
    });
    removeTarget.value = null;
    list.refetch();
    toast.success("订阅已取消");
  } catch (err) {
    toast.error(`取消失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="租户应用" :description="`${tenantLabel} 的应用订阅`">
      <template #actions>
        <Button data-fn="M00.F05.I02" @click="subscribeOpen = true">订阅应用</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>应用订阅列表 ({{ apps.length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <Table v-if="apps.length > 0">
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>到期时间</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="a in apps" :key="a.id" data-testid="tenant-app-row">
              <TableCell class="font-mono text-xs">{{ a.clientId }}</TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-xs"
                  :class="
                    a.status === 1
                      ? 'bg-blue-50 text-blue-700'
                      : a.status === 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  "
                >
                  {{ statusLabel(a.status) }}
                </span>
              </TableCell>
              <TableCell class="text-xs text-slate-600">
                {{ formatExpire(a.expireTime) }}
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F05.I03"
                  @click="() => (editTarget = a)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F05.I04"
                  class="text-red-600 hover:text-red-700"
                  @click="() => (removeTarget = a)"
                >
                  取消订阅
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <EmptyState
          v-else
          title="还没有订阅应用"
          description="点击「订阅应用」为租户启用第一个业务应用"
        />
      </CardContent>
    </Card>

    <CrudDialog
      :open="subscribeOpen"
      @update:open="(v) => (subscribeOpen = v)"
      title="订阅应用"
      description="输入应用 Client ID 与（可选）到期时间。订阅后租户内的角色可分配菜单权限。"
      :fields="SUBSCRIBE_FIELDS"
      submit-text="创建"
      :loading="subscribeMut.isPending.value"
      @submit="onSubscribe"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑订阅"
      :fields="UPDATE_FIELDS"
      :initial-values="
        editTarget
          ? { status: String(editTarget.status), expireTime: editTarget.expireTime ?? '' }
          : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <ConfirmDialog
      :open="removeTarget !== null"
      @update:open="(v) => !v && (removeTarget = null)"
      :title="`取消订阅「${removeTarget?.clientId ?? ''}」？`"
      description="租户下该应用的所有角色菜单授权将一并清除。不可撤销。"
      confirm-text="取消订阅"
      destructive
      :loading="removeMut.isPending.value"
      @confirm="confirmRemove"
    />
  </div>
</template>
