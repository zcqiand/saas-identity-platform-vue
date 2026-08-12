<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">菜单管理（M08.F01）— app {{ props.appId?.slice(0, 8) }}</h1>
      <button data-fn="M08.F01.I02" @click="createOpen = true" style="padding: 6px 12px">新建菜单</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <ul v-else data-testid="menu-tree" style="list-style: none; padding-left: 0">
      <li
        v-for="m in menuTree"
        :key="m.id"
        :data-testid="`menu-row-${m.id}`"
        :style="{ paddingLeft: `${m.depth * 16}px`, padding: '4px 0' }"
      >
        <span :data-fn="'M08.F02.I01'">
          {{ m.type === "group" ? "📁" : m.type === "action" ? "⚡" : "📄" }} {{ m.name }}
          <span style="color: #888; font-size: 12px">({{ MENU_TYPE_LABELS[m.type] }})</span>
        </span>
        <button data-fn="M08.F01.I04" @click="openEdit(m)" style="margin-left: 8px">编辑</button>
        <button data-fn="M08.F01.I05" @click="confirmDelete(m)" style="margin-left: 4px; color: #c00">删除</button>
      </li>
      <li v-if="menuTree.length === 0" data-testid="empty" style="color: #888; padding: 16px">
        还没有菜单
      </li>
    </ul>

    <CrudDialog
      v-model:open="createOpen"
      title="新建菜单"
      :fields="FIELDS"
      submit-text="创建"
      :loading="createMut.isPending.value"
      @submit="onCreate"
    />
    <CrudDialog
      v-model:open="editOpen"
      title="编辑菜单"
      :fields="FIELDS"
      :initial-values="editInitial"
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useAdminAppMenusListMenus,
  useAdminAppMenusCreateMenu,
  useAdminAppMenusUpdateMenu,
  useAdminAppMenusDeleteMenu,
} from "../api/endpoints/endpoints";
import type { Menu, CreateMenuRequest, UpdateMenuRequest } from "../api/endpoints/endpoints.schemas";
import CrudDialog, { type FieldDef } from "../components/crud-dialog.vue";
import { toApiError } from "../api/http-client";

const props = defineProps<{ appId?: string }>();

const MENU_TYPE_LABELS: Record<string, string> = {
  group: "分组",
  page: "页面",
  action: "操作",
};

const FIELDS: FieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "users" },
  { name: "name", label: "名称", required: true, placeholder: "用户管理" },
  {
    name: "type",
    label: "类型",
    type: "select",
    required: true,
    defaultValue: "page",
    options: [
      { value: "group", label: "分组" },
      { value: "page", label: "页面" },
      { value: "action", label: "操作" },
    ],
  },
];

const list = useAdminAppMenusListMenus(computed(() => props.appId ?? ""));
const createMut = useAdminAppMenusCreateMenu();
const updateMut = useAdminAppMenusUpdateMenu();
const deleteMut = useAdminAppMenusDeleteMenu();

const isLoading = computed(() => list.isLoading.value);

// 简易展开：所有菜单按 depth 排序展示（实际生产应做树构建）
const menuTree = computed<Array<Menu & { depth: number }>>(() => {
  const items = list.data.value?.data ?? [];
  return items.map((m) => ({ ...m, depth: 0 }));
});

const createOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<Menu | null>(null);
const editInitial = computed(() =>
  editTarget.value
    ? { code: editTarget.value.code, name: editTarget.value.name, type: editTarget.value.type }
    : undefined,
);

function openEdit(m: Menu) {
  editTarget.value = m;
  editOpen.value = true;
}

async function onCreate(values: Record<string, any>) {
  if (!props.appId) return;
  try {
    await createMut.mutateAsync({
      appId: props.appId,
      data: values as unknown as CreateMenuRequest,
    });
    createOpen.value = false;
    list.refetch();
  } catch (err) {
    alert(`创建失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, any>) {
  if (!editTarget.value || !props.appId) return;
  try {
    await updateMut.mutateAsync({
      appId: props.appId,
      menuId: editTarget.value.id,
      data: { name: values.name as string } as UpdateMenuRequest,
    });
    editOpen.value = false;
    editTarget.value = null;
    list.refetch();
  } catch (err) {
    alert(`更新失败：${toApiError(err).message}`);
  }
}

async function confirmDelete(m: Menu) {
  if (!props.appId) return;
  if (!confirm(`删除菜单「${m.name}」？`)) return;
  try {
    await deleteMut.mutateAsync({ appId: props.appId, menuId: m.id });
    list.refetch();
  } catch (err) {
    alert(`删除失败：${toApiError(err).message}`);
  }
}
</script>