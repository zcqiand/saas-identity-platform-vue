<template>
  <div style="padding: 24px">
    <h1 style="margin-top: 0">
      角色授权（M02.F02）— role {{ props.roleId?.slice(0, 8) }} · tenant {{ props.tenantId?.slice(0, 8) }}
    </h1>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <div v-else>
      <div
        v-for="app in appList"
        :key="app.id"
        style="margin-bottom: 16px; padding: 12px; border: 1px solid #eee; border-radius: 4px"
      >
        <div style="font-weight: 600; margin-bottom: 8px">{{ app.name }}</div>
        <label
          v-for="m in menusByApp[app.id] ?? []"
          :key="m.id"
          style="display: inline-flex; align-items: center; gap: 6px; margin-right: 16px"
        >
          <input
            type="checkbox"
            :checked="grantedMenuIds.has(m.id)"
            data-fn="M09.F02.I03"
            @change="toggle(m.id, ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ m.name }} <span style="color: #888; font-size: 12px">({{ m.code }})</span></span>
        </label>
        <p v-if="(menusByApp[app.id] ?? []).length === 0" style="color: #888; font-size: 12px">
          该应用还没有菜单
        </p>
      </div>
      <button
        data-fn="M09.F02.I02"
        @click="save"
        :disabled="saving"
        style="padding: 8px 16px; background: #1f2937; color: #fff; border: 0; border-radius: 4px"
      >
        {{ saving ? "保存中…" : "保存授权" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  useTenantRoleMenusListRoleMenus,
  useTenantRoleMenusSetRoleMenus,
  useAdminAppsListApps,
  useAdminAppMenusListMenus,
} from "../api/endpoints/endpoints";
import type { App, Menu } from "../api/endpoints/endpoints.schemas";
import { toApiError } from "../api/http-client";

const props = defineProps<{ tenantId?: string; roleId?: string }>();

const roleMenus = useTenantRoleMenusListRoleMenus(
  computed(() => props.tenantId ?? ""),
  computed(() => props.roleId ?? ""),
);
const setRoleMenus = useTenantRoleMenusSetRoleMenus();
const apps = useAdminAppsListApps();

const appList = computed<App[]>(() => apps.data.value?.data?.items ?? []);
const isLoading = computed(() => roleMenus.isLoading.value || apps.isLoading.value);
const grantedMenuIds = reactive(new Set<string>());

watch(
  () => roleMenus.data.value?.data?.menuIds,
  (ids) => {
    grantedMenuIds.clear();
    if (ids) for (const id of ids) grantedMenuIds.add(id);
  },
  { immediate: true },
);

const menusByApp = reactive<Record<string, Array<{ id: string; name: string; code: string }>>>({});

// 简化版：只拉第一个 app 的菜单展示。生产环境应按需拉取所有 app 的菜单
const firstAppId = computed(() => appList.value[0]?.id ?? "");
const menus = useAdminAppMenusListMenus(firstAppId);

watch(
  () => menus.data.value?.data,
  (items) => {
    if (firstAppId.value && items) {
      menusByApp[firstAppId.value] = items.map((m: Menu) => ({ id: m.id, name: m.name, code: m.code }));
    }
  },
);

function toggle(menuId: string, checked: boolean) {
  if (checked) grantedMenuIds.add(menuId);
  else grantedMenuIds.delete(menuId);
}

const saving = ref(false);

async function save() {
  if (!props.tenantId || !props.roleId) return;
  saving.value = true;
  try {
    await setRoleMenus.mutateAsync({
      tenantId: props.tenantId,
      roleId: props.roleId,
      data: { menuIds: Array.from(grantedMenuIds) },
    });
    alert("授权已保存");
    roleMenus.refetch();
  } catch (err) {
    alert(`保存失败：${toApiError(err).message}`);
  } finally {
    saving.value = false;
  }
}
</script>