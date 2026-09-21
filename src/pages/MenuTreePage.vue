<script setup lang="ts">
// M08 — 应用下树形菜单 CRUD
// v0.4.x：真树表格（可展开/收起）。后端返回扁平 Menu[]，前端按 parentId 自构树。

import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ChevronDown, ChevronRight, FolderTree } from "lucide-vue-next";
import {
  useClientMenusCreateSysMenu,
  useClientMenusDeleteSysMenu,
  useClientMenusListSysMenus,
  useClientMenusMoveSysMenu,
  useClientMenusUpdateSysMenu,
} from "../api/endpoints/client-menus/client-menus";
import { useAdminClientsListClients } from "../api/endpoints/admin-clients/admin-clients";
import type {
  CreateSysMenuRequest,
  SysMenu as Menu,
  UpdateSysMenuRequest,
} from "../api/endpoints/title.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue";
import CardHeader from "../components/ui/card-header.vue";
import CardTitle from "../components/ui/card-title.vue";
import EmptyState from "../components/app/empty-state.vue";
import PageLoading from "../components/app/page-loading.vue";
import Table from "../components/ui/table.vue";
import TableBody from "../components/ui/table-body.vue";
import TableCell from "../components/ui/table-cell.vue";
import TableHead from "../components/ui/table-head.vue";
import TableHeader from "../components/ui/table-header.vue";
import TableRow from "../components/ui/table-row.vue";
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
    defaultValue: "menu",
    options: [
      { value: "directory", label: "分组（容器）" },
      { value: "menu", label: "页面（叶子）" },
      { value: "button", label: "操作（按钮）" },
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
    defaultValue: "1",
    options: [
      { value: "1", label: "启用" },
      { value: "0", label: "停用" },
    ],
  },
];

const EDIT_FIELDS = FIELDS.filter((f) => f.name !== "code");

const route = useRoute();
const appId = computed(() => String(route.params.clientId ?? ""));

const appsQ = useAdminClientsListClients();
const allApps = computed(() => appsQ.data.value?.data?.items ?? []);
// selectedAppId 值域 = OAuthClient.clientId（code 形）——上游 RouterLink 传参、
// 应用下拉 value、菜单 CRUD 写路径、真后端 client_id 列查询四处一致；行 UUID 只作 key。
const selectedAppId = ref(appId.value || allApps.value[0]?.clientId || "");
const currentApp = computed(
  () => allApps.value.find((a) => a.clientId === selectedAppId.value) ?? allApps.value[0],
);

const menusQ = useClientMenusListSysMenus(selectedAppId);
// 父菜单下拉用：无视展开状态的扁平视图（深度缩进）
const flatForSelect = computed<Array<{ menu: Menu; depth: number }>>(() => {
  const out: Array<{ menu: Menu; depth: number }> = [];
  const walk = (nodes: MenuNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ menu: n.menu, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(buildTree(allMenus.value), 0);
  return out;
});

const createMut = useClientMenusCreateSysMenu();
const updateMut = useClientMenusUpdateSysMenu();
const deleteMut = useClientMenusDeleteSysMenu();
const moveMut = useClientMenusMoveSysMenu();

const createOpen = ref(false);
const editTarget = ref<Menu | null>(null);
const deleteTarget = ref<Menu | null>(null);
const moveTarget = ref<Menu | null>(null);

// 树表状态：所有有子级的父 ID 默认展开。用户点击 Chevron 切换。
interface MenuNode {
  menu: Menu;
  children: MenuNode[];
  hasChildren: boolean;
}

function buildTree(menus: Menu[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  for (const m of menus) byId.set(m.id, { menu: m, children: [], hasChildren: false });
  const roots: MenuNode[] = [];
  for (const m of menus) {
    const node = byId.get(m.id)!;
    if (m.parentId && byId.has(m.parentId)) {
      byId.get(m.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const n of byId.values()) n.hasChildren = n.children.length > 0;
  // 兄弟内按 sortOrder,再按 path 二级排序（path 可选,空字符串靠后）
  const sortByOrder = (a: MenuNode, b: MenuNode) =>
    a.menu.sortOrder - b.menu.sortOrder || (a.menu.path ?? "").localeCompare(b.menu.path ?? "");
  const recurse = (ns: MenuNode[]) => {
    ns.sort(sortByOrder);
    for (const n of ns) recurse(n.children);
  };
  recurse(roots);
  return roots;
}

function flattenTree(
  nodes: MenuNode[],
  expanded: Set<string>,
  depth: number,
  out: Array<Menu & { depth: number; hasChildren: boolean }>,
) {
  for (const n of nodes) {
    out.push({ ...n.menu, depth, hasChildren: n.hasChildren });
    if (n.hasChildren && expanded.has(n.menu.id)) {
      flattenTree(n.children, expanded, depth + 1, out);
    }
  }
}

const expandedIds = ref<Set<string>>(new Set());

const allMenus = computed<Menu[]>(() => (menusQ.data.value?.data ?? []) as Menu[]);

// 默认展开所有有子级的父级（首屏不折叠）。已选应用变化或菜单整体刷新就重置一次。
function defaultParentIds(menus: Menu[]): Set<string> {
  const s = new Set<string>();
  for (const m of menus) if (m.parentId) s.add(m.parentId);
  return s;
}

watch(
  [allMenus, selectedAppId],
  ([menus]) => {
    if (menus.length > 0) expandedIds.value = defaultParentIds(menus);
  },
  { immediate: true },
);

const rows = computed<Array<Menu & { depth: number; hasChildren: boolean }>>(() => {
  const tree = buildTree(allMenus.value);
  const out: Array<Menu & { depth: number; hasChildren: boolean }> = [];
  flattenTree(tree, expandedIds.value, 0, out);
  return out;
});

// 切换父级展开/折叠
function toggleExpand(id: string) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedIds.value = next;
}

async function onCreate(values: Record<string, unknown>) {
  const parentId = values.parentId && values.parentId !== "" ? String(values.parentId) : undefined;
  try {
    await createMut.mutateAsync({
      clientId: selectedAppId.value,
      data: {
        code: String(values.path ?? "").trim(),
        name: String(values.title ?? "").trim(),
        path: (values.path as string) || undefined,
        type: values.type as "group" | "page" | "action",
        parentId,
        sortOrder: Number(values.sortOrder ?? 0),
        status: values.status as "active" | "disabled",
      } as any,
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
      clientId: selectedAppId.value,
      menuId: editTarget.value.id,
      data: {
        title: values.title as string,
        path: (values.path as string) || undefined,
        type: values.type as "group" | "page" | "action",
        sortOrder: Number(values.sortOrder ?? 0),
        status: values.status as "active" | "disabled",
      } as any,
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
      clientId: selectedAppId.value,
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
    await deleteMut.mutateAsync({ clientId: selectedAppId.value, menuId: deleteTarget.value.id });
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
      :description="`当前应用 ${currentApp?.clientName ?? '—'} (${currentApp?.clientId ?? ''})`"
    >
      <template #actions>
        <div class="flex gap-2">
          <SelectField
            v-model="selectedAppId"
            :items="allApps.map((a) => ({ value: a.clientId, label: a.clientName }))"
            placeholder="选择应用"
            class="w-64"
          />
          <Button data-fn="M04.F04.I02" @click="createOpen = true">新建菜单</Button>
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
        <PageLoading v-if="menusQ.isLoading.value" />
        <EmptyState
          v-else-if="rows.length === 0"
          title="暂无菜单"
          description="点击右上“新建菜单”开始"
        >
          <template #action>
            <Button data-fn="M04.F04.I02" @click="createOpen = true">新建菜单</Button>
          </template>
        </EmptyState>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="r in rows"
              :key="r.id"
              data-testid="menu-row"
              :data-depth="r.depth"
              :data-menu-id="r.id"
            >
              <TableCell>
                <span
                  :style="{ paddingLeft: `${r.depth * 16}px` }"
                  class="inline-flex items-center gap-1 font-medium"
                >
                  <button
                    v-if="r.hasChildren"
                    type="button"
                    :aria-label="expandedIds.has(r.id) ? '折叠子菜单' : '展开子菜单'"
                    :data-testid="`menu-toggle-${r.id}`"
                    class="inline-flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    @click="toggleExpand(r.id)"
                  >
                    <ChevronDown v-if="expandedIds.has(r.id)" class="h-3 w-3" />
                    <ChevronRight v-else class="h-3 w-3" />
                  </button>
                  {{ r.title }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ r.type === "directory" ? "目录" : r.type === "button" ? "按钮" : "菜单" }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ r.status === 0 ? "停用" : "启用" }}
                </span>
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F04.I07"
                  @click="() => (moveTarget = r)"
                >
                  移动
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F04.I04"
                  @click="() => (editTarget = r)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M04.F04.I05"
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
              label: `${'  '.repeat(m.depth)}${m.path} · ${m.title}`,
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
      :fields="
        EDIT_FIELDS.map((f) =>
          f.name === 'parentId'
            ? {
                ...f,
                options: [
                  { value: '', label: '（无，顶级）' },
                  ...flatForSelect
                    .filter((m) => m.menu.id !== editTarget?.id)
                    .map((m) => ({
                      value: m.menu.id,
                      label: `${'  '.repeat(m.depth)}${m.menu.path ?? ''} · ${m.menu.title}`,
                    })),
                ],
              }
            : f,
        )
      "
      :initial-values="
        editTarget
          ? {
              name: editTarget.title,
              path: editTarget.path,
              type: editTarget.type,
              parentId: editTarget.parentId ?? '',
              sortOrder: editTarget.sortOrder,
              status: String(editTarget.status ?? 1),
            }
          : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <CrudDialog
      :open="moveTarget !== null"
      @update:open="(v) => !v && (moveTarget = null)"
      :title="`移动菜单：${moveTarget?.path ?? ''}`"
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
              .map((m) => ({
                value: m.id,
                label: `${'  '.repeat(m.depth)}${m.path} · ${m.title}`,
              })),
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
      :title="`删除菜单「${deleteTarget?.title ?? ''}」？`"
      description="删除菜单会同时移除其下所有子菜单。不可撤销。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
