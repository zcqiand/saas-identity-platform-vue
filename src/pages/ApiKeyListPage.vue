<script setup lang="ts">
// M05.F01 — tenant-scoped API Key 生命周期（创建 / 吊销 / 轮换）

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useTenantApiKeysCreateApiKey } from "../api/endpoints/endpoints";
import { useTenantApiKeysListApiKeys } from "../api/endpoints/endpoints";
import { useTenantApiKeysRevokeApiKey } from "../api/endpoints/endpoints";
import { useTenantApiKeysRotateApiKey } from "../api/endpoints/endpoints";
import type { ApiKey, CreateApiKeyRequest } from "../api/endpoints/endpoints.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue"
import CardHeader from "../components/ui/card-header.vue"
import CardTitle from "../components/ui/card-title.vue"
import Badge from "../components/ui/badge.vue";
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
import { useTenantStore } from "../state/tenant-store";

const FIELDS: FieldDef[] = [
  { name: "name", label: "名称", required: true, placeholder: "Production Key" },
  { name: "scopesText", label: "Scopes（逗号分隔）", placeholder: "users.read, users.write" },
];

const route = useRoute();
const tenantStore = useTenantStore();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
// 租户名走 GET /api/v1/admin/tenants/:id，加载中/失败显示「租户未知」。
// 集中到 tenant-store.tenantFor()，缓存交给 vue-query。
const tenant = tenantStore.tenantFor(tenantId);
const tenantLabel = computed(() => {
  return tenant.value ? `租户 ${tenant.value.name}（${tenant.value.code}）` : "租户未知";
});

const list = useTenantApiKeysListApiKeys(tenantId);
const createMut = useTenantApiKeysCreateApiKey();
const revokeMut = useTenantApiKeysRevokeApiKey();
const rotateMut = useTenantApiKeysRotateApiKey();

const createOpen = ref(false);
const revokeTarget = ref<ApiKey | null>(null);
const rotateTarget = ref<ApiKey | null>(null);

const keys = computed<ApiKey[]>(() => list.data.value?.data?.items ?? []);

async function onCreate(values: Record<string, unknown>) {
  try {
    await createMut.mutateAsync({
      tenantId: tenantId.value,
      data: {
        name: String(values.name ?? "").trim(),
        scopes: values.scopesText
          ? String(values.scopesText)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      } as CreateApiKeyRequest,
    });
    createOpen.value = false;
    list.refetch();
    toast.success("API Key 已创建（请妥善保管 secret，仅展示一次）");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function confirmRevoke() {
  if (!revokeTarget.value) return;
  try {
    await revokeMut.mutateAsync({ tenantId: tenantId.value, keyId: revokeTarget.value.id });
    revokeTarget.value = null;
    list.refetch();
    toast.success("API Key 已吊销");
  } catch (err) {
    toast.error(`吊销失败：${toApiError(err).message}`);
  }
}

async function confirmRotate() {
  if (!rotateTarget.value) return;
  try {
    await rotateMut.mutateAsync({ tenantId: tenantId.value, keyId: rotateTarget.value.id });
    rotateTarget.value = null;
    list.refetch();
    toast.success("API Key 已轮换");
  } catch (err) {
    toast.error(`轮换失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="API Key"
      :description="`${tenantLabel} 的 API 访问密钥`"
    >
      <template #actions>
        <Button data-fn="M05.F01.I02" @click="createOpen = true">创建 Key</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>Key 列表 ({{ keys.length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>前缀</TableHead>
              <TableHead>Scopes</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="k in keys" :key="k.id">
              <TableCell class="font-medium">{{ k.name }}</TableCell>
              <TableCell>
                <code class="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded"
                  >{{ k.prefix }}…</code
                >
              </TableCell>
              <TableCell>
                <Badge variant="outline">{{ k.scopes.length }} 项</Badge>
              </TableCell>
              <TableCell>
                <StatusBadge :status="k.status as 'active' | 'revoked' | 'expired'" />
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M05.F01.I04"
                  :disabled="k.status === 'revoked'"
                  @click="() => (rotateTarget = k)"
                >
                  轮换
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M05.F01.I03"
                  class="text-red-600 hover:text-red-700"
                  :disabled="k.status === 'revoked'"
                  @click="() => (revokeTarget = k)"
                >
                  吊销
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
      title="创建 API Key"
      description="Secret 仅在创建时返回一次，请妥善保存。"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />

    <ConfirmDialog
      :open="revokeTarget !== null"
      @update:open="(v) => !v && (revokeTarget = null)"
      :title="`吊销 API Key「${revokeTarget?.name ?? ''}」？`"
      description="吊销后该 Key 立即失效，所有用此 Key 调用的请求将被拒绝。"
      confirm-text="吊销"
      destructive
      :loading="revokeMut.isPending.value"
      @confirm="confirmRevoke"
    />

    <ConfirmDialog
      :open="rotateTarget !== null"
      @update:open="(v) => !v && (rotateTarget = null)"
      :title="`轮换 API Key「${rotateTarget?.name ?? ''}」？`"
      description="轮换将生成新 Key 并自动吊销旧 Key。Secret 仅在轮换时返回一次。"
      confirm-text="轮换"
      :loading="rotateMut.isPending.value"
      @confirm="confirmRotate"
    />
  </div>
</template>
