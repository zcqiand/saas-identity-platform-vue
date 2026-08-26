<script setup lang="ts">
// M04 — 平台级应用管理（CRUD + 启用/停用；同时承担 OAuth client 职责）

import { ref, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useAdminAppsCreateApp } from "../api/endpoints/endpoints";
import { useAdminAppsDeleteApp } from "../api/endpoints/endpoints";
import { useAdminAppsListApps } from "../api/endpoints/endpoints";
import { useAdminAppsSetAppStatus } from "../api/endpoints/endpoints";
import { useAdminAppsUpdateApp } from "../api/endpoints/endpoints";
import type { App, CreateAppRequest, UpdateAppRequest } from "../api/endpoints/endpoints.schemas";
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
  { name: "code", label: "Code", required: true, placeholder: "lab-management" },
  {
    name: "name",
    label: "名称",
    required: true,
    placeholder: "建筑工程实验室管理系统",
  },
  { name: "clientId", label: "Client ID", required: true, placeholder: "lab-mgmt" },
  { name: "icon", label: "图标（lucide 名称）", placeholder: "FlaskConical" },
  { name: "sortOrder", label: "排序", type: "number", defaultValue: 0 },
  {
    name: "isFirstParty",
    label: "一方应用",
    type: "checkbox",
    defaultValue: true,
    hint: "一方应用对租户可见",
  },
  {
    name: "status",
    label: "状态",
    type: "select",
    required: true,
    defaultValue: "active",
    options: [
      { value: "active", label: "启用" },
      { value: "disabled", label: "停用" },
    ],
  },
  { name: "scopesText", label: "Scopes（逗号分隔）", placeholder: "lab.read, lab.write" },
];

const EDIT_FIELDS = FIELDS.filter((f) => f.name !== "code" && f.name !== "clientId");

function toAppInput(values: Record<string, unknown>): CreateAppRequest {
  return {
    code: String(values.code ?? "").trim(),
    name: String(values.name ?? "").trim(),
    clientId: String(values.clientId ?? "").trim(),
    icon: values.icon ? String(values.icon) : undefined,
    sortOrder: Number(values.sortOrder ?? 0),
    status: (values.status as "active" | "disabled") ?? "active",
    isFirstParty: Boolean(values.isFirstParty),
    scopes: values.scopesText
      ? String(values.scopesText)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    grantTypes: ["authorization_code", "client_credentials"],
    redirectUris: [],
  };
}

const router = useRouter();
const list = useAdminAppsListApps();
const createMut = useAdminAppsCreateApp();
const updateMut = useAdminAppsUpdateApp();
const deleteMut = useAdminAppsDeleteApp();
const statusMut = useAdminAppsSetAppStatus();

const createOpen = ref(false);
const editTarget = ref<App | null>(null);
const deleteTarget = ref<App | null>(null);

const apps = computed<App[]>(() => list.data.value?.data?.items ?? []);

function goMenus(appId: string) {
  router.push(`/admin/apps/${appId}/menus`);
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
      appId: editTarget.value.id,
      data: {
        name: values.name as string,
        icon: (values.icon as string) || undefined,
        sortOrder: Number(values.sortOrder ?? 0),
        status: values.status as "active" | "disabled",
        isFirstParty: Boolean(values.isFirstParty),
        scopes: values.scopesText
          ? String(values.scopesText)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      },
    });
    editTarget.value = null;
    list.refetch();
    toast.success("应用已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function toggleStatus(a: App) {
  try {
    await statusMut.mutateAsync({
      appId: a.id,
      data: { status: a.status === "active" ? "disabled" : "active" },
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
    await deleteMut.mutateAsync({ appId: deleteTarget.value.id });
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
        <Button data-fn="M08.F01.I02" @click="createOpen = true">新建应用</Button>
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
              <TableHead>Scopes</TableHead>
              <TableHead>一方</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="a in apps" :key="a.id" data-testid="app-row">
              <TableCell>
                <div class="font-mono text-xs">{{ a.code }}</div>
                <div class="font-mono text-[10px] text-slate-500">clientId: {{ a.clientId }}</div>
              </TableCell>
              <TableCell class="font-medium">{{ a.name }}</TableCell>
              <TableCell class="text-xs text-slate-600">
                {{ a.scopes.length > 0 ? a.scopes.join(", ") : "—" }}
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-xs"
                  :class="
                    a.isFirstParty ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                  "
                >
                  {{ a.isFirstParty ? "一方" : "三方" }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ a.sortOrder }}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge :status="a.status === 'active' ? 'active' : 'suspended'" />
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F02.I06"
                  @click="() => toggleStatus(a)"
                >
                  {{ a.status === "active" ? "停用" : "启用" }}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M08.F01.I04"
                  @click="() => (editTarget = a)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M08.F01.I05"
                  class="text-red-600 hover:text-red-700"
                  @click="() => (deleteTarget = a)"
                >
                  删除
                </Button>
                <Button variant="ghost" size="sm" as-child>
                  <RouterLink :to="`/admin/apps/${a.id}/menus`">菜单</RouterLink>
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
              name: editTarget.name,
              icon: editTarget.icon,
              sortOrder: editTarget.sortOrder,
              isFirstParty: editTarget.isFirstParty,
              status: editTarget.status,
              scopesText: editTarget.scopes.join(', '),
            }
          : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除应用「${deleteTarget?.name ?? ''}」？`"
      description="应用删除将一并删除其下所有菜单。不可撤销。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
