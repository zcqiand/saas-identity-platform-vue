<script setup lang="ts">
// M08 — 应用下树形菜单 CRUD

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { ChevronRight, FolderTree } from "lucide-vue-next";
import { useAdminAppMenusCreateMenu } from "../api/endpoints/endpoints";
import { useAdminAppMenusDeleteMenu } from "../api/endpoints/endpoints";
import { useAdminAppMenusListMenus } from "../api/endpoints/endpoints";
import { useAdminAppMenusMoveMenu } from "../api/endpoints/endpoints";
import { useAdminAppMenusUpdateMenu } from "../api/endpoints/endpoints";
import { useAdminAppsListApps } from "../api/endpoints/endpoints";
import type {
  CreateMenuRequest,
  Menu,
  UpdateMenuRequest,
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
import SelectField from "../components/ui/select.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";

const FIELDS: FieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "m-xxx" },
  { name: "name", label: "名称", required: true, placeholder: "接样管理" },
  { name: "path", label: "路径", placeholder: "receipts" },
  {
    name: "type",
    label: "类型",
    type: "select",
    required: true,
    defaultValue: "page",
    options: [
      { value: "group", label: "分组（容器）" },
      { value: "page", label: "页面（叶子）" },
      { value: "action", label: "操作（按钮）" },
    ],
  },
  {
    name: "parentId",
    label: "父菜单",
    type: "select",
    options: [],
    placeholder: "（无，顶级）",
  },
  { name: "sortOrder", label: "排序", type: "number", defaultValue: 0 },
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
];

const EDIT_FIELDS = FIELDS.filter((f) => f.name !== "code");

const route = useRoute();
const appId = computed(() => String(route.params.appId ?? ""));

const appsQ = useAdminAppsListApps();
const allApps = computed(() => appsQ.data.value?.data?.items ?? []);
const selectedAppId = ref(appId.value || allApps.value[0]?.id || "");
const currentApp = computed(() => allApps.value.find((a) => a.id === selectedAppId.value) ?? allApps.value[0]);

const menusQ = useAdminAppMenusListMenus(selectedAppId);
const createMut = useAdminAppMenusCreateMenu();
const updateMut = useAdminAppMenusUpdateMenu();
const deleteMut = useAdminAppMenusDeleteMenu();
const moveMut = useAdminAppMenusMoveMenu();

const createOpen = ref(false);
const editTarget = ref<Menu | null>(null);
const deleteTarget = ref<Menu | null>(null);
const moveTarget = ref<Menu | null>(null);

function flatten(items: Menu[], depth = 0): Array<Menu & { depth: number }> {
  const out: Array<Menu & { depth: number }> = [];
  for (const n of items) {
    out.push({ ...n, depth });
    const children = (n as unknown as { children?: Menu[] }).children;
    if (children && children.length) out.push(...flatten(children, depth + 1));
  }
  return out;
}

const rows = computed(() => flatten((menusQ.data.value?.data ?? []) as Menu[]));

async function onCreate(values: Record<string, unknown>) {
  const parentId = values.parentId && values.parentId !== "" ? String(values.parentId) : undefined;
  try {
    await createMut.mutateAsync({
      appId: selectedAppId.value,
      data: {
        code: String(values.code ?? "").trim(),
        name: String(values.name ?? "").trim(),
        path: (values.path as string) || undefined,
        type: values.type as "group" | "page" | "action",
        parentId,
        sortOrder: Number(values.sortOrder ?? 0),
        status: values.status as "active" | "disabled",
      } as CreateMenuRequest,
    });
    createOpen.value = false;
    menusQ.refetch();
    toast.success("菜单已创建");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    await updateMut.mutateAsync({
      appId: selectedAppId.value,
      menuId: editTarget.value.id,
      data: {
        name: values.name as string,
        path: (values.path as string) || undefined,
        type: values.type as "group" | "page" | "action",
        sortOrder: Number(values.sortOrder ?? 0),
        status: values.status as "active" | "disabled",
      } as UpdateMenuRequest,
    });
    editTarget.value = null;
    menusQ.refetch();
    toast.success("菜单已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function onMove(values: Record<string, unknown>) {
  if (!moveTarget.value) return;
  const parentId = values.parentId && values.parentId !== "" ? String(values.parentId) : undefined;
  try {
    await moveMut.mutateAsync({
      appId: selectedAppId.value,
      menuId: moveTarget.value.id,
      data: { parentId },
    });
    moveTarget.value = null;
    menusQ.refetch();
    toast.success("父级已切换");
  } catch (err) {
    toast.error(`移动失败：${toApiError(err).message}`);
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteMut.mutateAsync({ appId: selectedAppId.value, menuId: deleteTarget.value.id });
    deleteTarget.value = null;
    menusQ.refetch();
    toast.success("菜单已删除");
  } catch (err) {
    toast.error(`删除失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="菜单管理"
      :description="`当前应用 ${currentApp?.name ?? '—'} (${currentApp?.code ?? ''})`"
    >
      <template #actions>
        <div class="flex gap-2">
          <SelectField
            v-model="selectedAppId"
            :items="allApps.map((a) => ({ value: a.id, label: a.name }))"
            placeholder="选择应用"
            class="w-64"
          />
          <Button data-fn="M08.F01.I02" @click="createOpen = true">新建菜单</Button>
        </div>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <FolderTree class="h-4 w-4 text-slate-500" />
          菜单树 ({{ rows.length }} 项)
        </CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code / 路径</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id" data-testid="menu-row" :data-depth="r.depth">
              <TableCell class="font-mono text-xs">
                <span
                  :style="{ paddingLeft: `${r.depth * 16}px` }"
                  class="inline-flex items-center"
                >
                  <ChevronRight v-if="r.depth > 0" class="h-3 w-3 text-slate-400 mr-1" />
                  <span>{{ r.code }}</span>
                </span>
              </TableCell>
              <TableCell class="font-medium">
                {{ r.name }}
                <span v-if="r.path" class="ml-2 text-xs text-slate-500 font-mono">{{
                  r.path
                }}</span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ r.type }}
                </span>
              </TableCell>
              <TableCell class="text-slate-600">{{ r.sortOrder }}</TableCell>
              <TableCell>
                <StatusBadge :status="r.status === 'active' ? 'active' : 'suspended'" />
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M08.F02.I07"
                  @click="() => (moveTarget = r)"
                >
                  移动
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M08.F01.I04"
                  @click="() => (editTarget = r)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M08.F01.I05"
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
      title="新建菜单"
      :fields="[
        ...FIELDS,
        {
          name: 'parentId',
          label: '父菜单',
          type: 'select',
          options: [
            { value: '', label: '（无，顶级）' },
            ...rows.map((m) => ({
              value: m.id,
              label: `${'  '.repeat(m.depth)}${m.code} · ${m.name}`,
            })),
          ],
          defaultValue: '',
        },
      ]"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑菜单"
      :fields="EDIT_FIELDS"
      :initial-values="
        editTarget
          ? {
              name: editTarget.name,
              path: editTarget.path,
              type: editTarget.type,
              sortOrder: editTarget.sortOrder,
              status: editTarget.status,
            }
          : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <CrudDialog
      :open="moveTarget !== null"
      @update:open="(v) => !v && (moveTarget = null)"
      :title="`移动菜单：${moveTarget?.code ?? ''}`"
      description="选择新的父级菜单。无父级 = 顶级。"
      :fields="[
        {
          name: 'parentId',
          label: '父菜单',
          type: 'select',
          options: [
            { value: '', label: '（无，顶级）' },
            ...rows
              .filter((m) => m.id !== moveTarget?.id)
              .map((m) => ({ value: m.id, label: `${'  '.repeat(m.depth)}${m.code} · ${m.name}` })),
          ],
        },
      ]"
      submit-text="移动"
      :loading="moveMut.isPending.value"
      :initial-values="moveTarget ? { parentId: moveTarget.parentId ?? '' } : undefined"
      @submit="onMove"
    />

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除菜单「${deleteTarget?.name ?? ''}」？`"
      description="删除菜单会同时移除其下所有子菜单。不可撤销。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
