<script setup lang="ts">
// TenantSwitcher — 顶部栏右侧 Dropdown，切换当前用户可访问的租户。
// M00.F02.I03 / M01.F03.I02（2026-09-11 接真 API，E2E REQ-2026-004）：
// @entry M01.F03.I01 — 列出我的租户成员关系（GET /me/tenants 渲染切换菜单）：
// 成员关系 GET /me/tenants（TenantMember[]，契约无租户名）；
// 显示名 join 平台租户列表（管理控制台自身页面数据源，复用同一 query key 缓存）；
// 切换 POST /me/tenants/:id/switch → 新 token 落 store → 进该租户工作区。

import { computed } from "vue";
import { useRouter } from "vue-router";
import { Building2, ChevronsUpDown } from "lucide-vue-next";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import Button from "./ui/button.vue";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "reka-ui";
import { useTenantStore } from "../state/tenant-store";
import { useMeListMyTenants, useMeSwitchTenant } from "../api/endpoints/me/me";
import { useAdminTenantsListTenants } from "../api/endpoints/admin-tenants/admin-tenants";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";

const tenantStore = useTenantStore();
const router = useRouter();
const qc = useQueryClient();

const membershipsQ = useMeListMyTenants({ clientId: "" });
const tenantsQ = useAdminTenantsListTenants();
const switchMut = useMeSwitchTenant();

const memberships = computed(() => membershipsQ.data.value?.data ?? []);
const nameById = computed(
  () =>
    new Map((tenantsQ.data.value?.data?.items ?? []).map((t) => [t.id, t.name])),
);
const tenantKeyById = computed(
  () =>
    new Map((tenantsQ.data.value?.data?.items ?? []).map((t) => [t.id, t.tenantKey])),
);

const current = computed(() =>
  memberships.value.find((m) => m.tenantId === tenantStore.currentTenantId),
);

async function onSwitch(tenantId: string) {
  try {
    const res = await switchMut.mutateAsync({ tenantId, params: { clientId: "" } });
    tenantStore.setTenant(tenantId, null, res.data.accessToken);
    void qc.invalidateQueries(); // 租户切换后列表数据全部失效
    router.push(`/tenants/${tenantId}/users`);
  } catch (err) {
    const apiErr = toApiError(err);
    toast.error(
      apiErr.status === 404 ? "该租户不存在或你不是其成员" : `切换失败：${apiErr.message}`,
    );
  }
}
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="gap-2"
        data-testid="tenant-switcher"
        data-fn="M00.F02.I03"
      >
        <Building2 class="h-4 w-4 text-slate-500" />
        <span class="font-medium">
          {{ current ? (nameById.get(current.tenantId) ?? "…") : "选择租户" }}
        </span>
        <ChevronsUpDown class="h-3.5 w-3.5 text-slate-400" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        class="z-50 min-w-[16rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <DropdownMenuLabel class="px-2 py-1.5 text-sm font-semibold">切换租户</DropdownMenuLabel>
        <DropdownMenuSeparator class="-mx-1 my-1 h-px bg-muted" />
        <DropdownMenuItem
          v-for="m in memberships.filter((x) => x.status !== 'disabled')"
          :key="m.id"
          class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground cursor-pointer"
          @select="onSwitch(m.tenantId)"
        >
          <Building2 class="h-4 w-4 mr-2 text-slate-500" />
          <div class="flex flex-col">
            <span class="font-medium">{{ nameById.get(m.tenantId) ?? m.tenantId.slice(0, 8) }}</span>
            <span class="text-xs text-slate-500 font-mono">{{ tenantKeyById.get(m.tenantId) ?? "" }}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
