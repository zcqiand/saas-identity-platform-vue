<script setup lang="ts">
// M09 — 角色 ↔ 菜单授权（按 app 分组的勾选矩阵 + 保存）

import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { adminAppMenusListMenus } from "../api/endpoints/endpoints";
import { useAdminAppsListApps } from "../api/endpoints/endpoints";
import { useTenantRoleMenusListRoleMenus } from "../api/endpoints/endpoints";
import { useTenantRoleMenusSetRoleMenus } from "../api/endpoints/endpoints";
import type { SetRoleMenusRequest } from "../api/endpoints/endpoints.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue"
import CardHeader from "../components/ui/card-header.vue"
import CardTitle from "../components/ui/card-title.vue"
import PageHeader from "../components/app/page-header.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";
import { useTenantStore } from "../state/tenant-store";

const route = useRoute();
const tenantStore = useTenantStore();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
const roleId = computed(() => String(route.params.roleId ?? ""));
// 集中到 tenant-store.tenantFor()，缓存交给 vue-query。
const tenant = tenantStore.tenantFor(tenantId);
const tenantLabel = computed(() => {
  return tenant.value ? `${tenant.value.name}（${tenant.value.code}）` : "未知租户";
});

const appsQ = useAdminAppsListApps();
const apps = computed(() => appsQ.data.value?.data?.items ?? []);

// 一次性拉所有 app 的 menus（修 apps[0] bug：之前每张 Card 共享同一份 menus）
const groupsQ = useQuery({
  queryKey: computed(() => ["roleMenuGrantAllGroups", tenantId.value, roleId.value]),
  queryFn: async () => {
    const items = apps.value;
    return Promise.all(
      items.map(async (a) => ({
        appCode: a.code,
        appName: a.name,
        menus: (await adminAppMenusListMenus(a.id)).data,
      })),
    );
  },
  enabled: computed(() => !!tenantId.value && !!roleId.value && apps.value.length > 0),
});

const grantQ = useTenantRoleMenusListRoleMenus(tenantId, roleId);
const saveMut = useTenantRoleMenusSetRoleMenus();

const granted = ref<Set<string>>(new Set());

watch(
  () => grantQ.data.value?.data?.menuIds,
  (ids) => {
    granted.value = new Set(ids ?? []);
  },
  { immediate: true },
);

function toggle(id: string) {
  const next = new Set(granted.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  granted.value = next;
}

function clearAll() {
  granted.value = new Set();
}

async function save() {
  try {
    await saveMut.mutateAsync({
      tenantId: tenantId.value,
      roleId: roleId.value,
      data: { menuIds: Array.from(granted.value) } as SetRoleMenusRequest,
    });
    grantQ.refetch();
    toast.success("菜单授权已保存");
  } catch (err) {
    toast.error(`保存失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="角色菜单授权"
      :description="`租户 ${tenantLabel} / 角色 ${roleId.slice(0, 8) || '—'}`"
    >
      <template #actions>
        <div class="flex gap-2">
          <Button variant="outline" data-fn="M09.F02.I03" @click="clearAll">清空</Button>
          <Button data-fn="M09.F02.I02" :disabled="saveMut.isPending.value" @click="save">
            {{ saveMut.isPending.value ? "保存中…" : `保存 (${granted.size})` }}
          </Button>
        </div>
      </template>
    </PageHeader>

    <Card v-for="g in (groupsQ.data.value ?? [])" :key="g.appCode">
      <CardHeader>
        <CardTitle>
          {{ g.appName }}
          <span class="ml-2 text-xs font-mono text-slate-500">({{ g.appCode }})</span>
          <span class="ml-2 text-xs font-mono text-slate-500">{{ g.menus.length }} 项</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <label
          v-for="m in g.menus"
          :key="m.id"
          class="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50 cursor-pointer"
          data-testid="menu-grant-row"
        >
          <input
            type="checkbox"
            :checked="granted.has(m.id)"
            class="h-4 w-4"
            @change="() => toggle(m.id)"
          />
          <span class="font-medium text-sm">{{ m.name }}</span>
          <span class="font-mono text-xs text-slate-500">{{ m.code }}</span>
        </label>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-sm text-slate-600">当前授权摘要</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm">
          共勾选 <span class="font-bold">{{ granted.size }}</span> 项菜单
        </p>
      </CardContent>
    </Card>
  </div>
</template>
