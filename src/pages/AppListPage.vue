<script setup lang="ts">
// M04 — 平台级应用管理（CRUD + 启用/停用；同时承担 OAuth client 职责）

import { ref, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";
import {
  useAdminClientsCreateClient,
  useAdminClientsDeleteClient,
  useAdminClientsListClients,
  useAdminClientsSetClientStatus,
  useAdminClientsUpdateClient,
} from "../api/endpoints/admin-clients/admin-clients";
import type {
  OAuthClient,
  CreateOAuthClientRequest,
  UpdateOAuthClientRequest,
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
import StatusBadge from "../components/app/status-badge.vue";
import EmptyState from "../components/app/empty-state.vue";
import ConfirmDialog from "../components/app/confirm-dialog.vue";
import CrudDialog from "../components/app/crud-dialog.vue";
import type { FieldDef } from "../components/app/crud-dialog.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";

const FIELDS: FieldDef[] = [
  { name: "clientId", label: "Client ID", required: true, placeholder: "lab-management" },
  { name: "clientSecret", label: "Client Secret", required: true, placeholder: "••••••" },
  {
    name: "clientName",
    label: "名称",
    required: true,
    placeholder: "建筑工程实验室管理系统",
  },
  {
    name: "grantTypes",
    label: "Grant Types（逗号分隔）",
    placeholder: "authorization_code,client_credentials",
  },
  {
    name: "redirectUris",
    label: "Redirect URIs（逗号分隔）",
    placeholder: "https://app.example.com/callback",
  },
  { name: "scopesText", label: "Scopes（逗号分隔）", placeholder: "lab.read, lab.write" },
  {
    name: "accessTokenValidity",
    label: "Access Token Validity（秒）",
    type: "number",
    defaultValue: 3600,
  },
  {
    name: "refreshTokenValidity",
    label: "Refresh Token Validity（秒）",
    type: "number",
    defaultValue: 2592000,
  },
  {
    name: "autoApprove",
    label: "Auto Approve",
    type: "checkbox",
    defaultValue: false,
  },
];

const EDIT_FIELDS: FieldDef[] = [
  {
    name: "clientName",
    label: "名称",
    required: true,
  },
  {
    name: "status",
    label: "状态",
    type: "select",
    required: true,
    defaultValue: "1",
    options: [
      { value: "1", label: "启用" },
      { value: "0", label: "停用" },
    ],
  },
  { name: "scopesText", label: "Scopes（逗号分隔）", placeholder: "lab.read, lab.write" },
];

function toAppInput(values: Record<string, unknown>): CreateOAuthClientRequest {
  return {
    clientId: String(values.clientId ?? "").trim(),
    clientSecret: String(values.clientSecret ?? "").trim(),
    clientName: String(values.clientName ?? "").trim(),
    grantTypes: String(values.grantTypes ?? "authorization_code,client_credentials").trim(),
    redirectUris: String(values.redirectUris ?? "").trim(),
    scopes: values.scopesText
      ? String(values.scopesText)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(",")
      : undefined,
    accessTokenValidity: Number(values.accessTokenValidity ?? 3600),
    refreshTokenValidity: Number(values.refreshTokenValidity ?? 2592000),
    autoApprove: Boolean(values.autoApprove),
  };
}

const router = useRouter();
const list = useAdminClientsListClients();
const createMut = useAdminClientsCreateClient();
const updateMut = useAdminClientsUpdateClient();
const deleteMut = useAdminClientsDeleteClient();
const statusMut = useAdminClientsSetClientStatus();

const createOpen = ref(false);
const editTarget = ref<OAuthClient | null>(null);
const deleteTarget = ref<OAuthClient | null>(null);

const apps = computed<OAuthClient[]>(() => list.data.value?.data?.items ?? []);

function goMenus(appId: string) {
  router.push(`/admin/clients/${appId}/menus`);
}

async function onCreate(values: Record<string, unknown>) {
  try {
    await createMut.mutateAsync({ data: toAppInput(values) });
    createOpen.value = false;
    list.refetch();
    toast.success("应用已创建");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      clientId: editTarget.value.clientId,
      data: {
        clientName: values.clientName as string,
        status: Number(values.status ?? 1),
      },
    });
    editTarget.value = null;
    list.refetch();
    toast.success("应用已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function toggleStatus(a: OAuthClient) {
  try {
    await statusMut.mutateAsync({
      clientId: a.clientId,
      data: { status: a.status === 1 ? 0 : 1 },
    });
    list.refetch();
    toast.success("状态已切换");
  } catch (err) {
    toast.error(`状态切换失败：${toApiError(err).message}`);
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteMut.mutateAsync({ clientId: deleteTarget.value.clientId });
    deleteTarget.value = null;
    list.refetch();
    toast.success("应用已删除");
  } catch (err) {
    toast.error(`删除失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="应用管理"
      description="平台级业务应用（同时承载 OAuth client）。每个应用有菜单树，租户通过订阅获得应用，再在租户内部分发菜单给角色。"
    >
      <template #actions>
        <Button data-fn="M04.F04.I02" @click="createOpen = true">新建应用</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>应用列表 ({{ apps.length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <EmptyState
          v-if="apps.length === 0"
          title="还没有应用"
          description="创建第一个应用以承载菜单"
        />
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Code / ClientID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="a in apps" :key="a.id" data-testid="app-row">
              <TableCell>
                <div class="font-mono text-xs">{{ a.clientId }}</div>
                <div class="font-mono text-[10px] text-slate-500">name: {{ a.clientName }}</div>
              </TableCell>
              <TableCell class="font-medium">{{ a.clientName }}</TableCell>
              <TableCell>
                <StatusBadge :status="a.status === 1 ? 'active' : 'suspended'" />
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F02.I01"
                  @click="() => toggleStatus(a)"
                >
                  {{ a.status === 1 ? "停用" : "启用" }}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F04.I04"
                  @click="() => (editTarget = a)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F04.I05"
                  class="text-red-600 hover:text-red-700"
                  @click="() => (deleteTarget = a)"
                >
                  删除
                </Button>
                <Button variant="ghost" size="sm" as-child>
                  <RouterLink :to="`/admin/clients/${a.clientId}/menus`">菜单</RouterLink>
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
      title="新建应用"
      description="应用同时也是 OAuth client；创建后会自动绑定到菜单树。"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑应用"
      :fields="EDIT_FIELDS"
      :initial-values="
        editTarget
          ? {
              clientName: editTarget.clientName,
              status: editTarget.status === 1 ? '1' : '0',
              scopesText: editTarget.scopes ?? '',
            }
          : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除应用「${deleteTarget?.clientName ?? ''}」？`"
      description="应用删除将一并删除其下所有菜单。不可撤销。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
