<script setup lang="ts">
// TenantSwitcher — 顶部栏右侧 Dropdown，切换当前用户可访问的租户。
// 用于跨租户操作场景（admin 视角）。

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Building2, ChevronsUpDown } from "lucide-vue-next";
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

interface Membership {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: "active" | "invited" | "removed";
}

const tenantStore = useTenantStore();
const router = useRouter();
const memberships = ref<Membership[]>([]);

onMounted(() => {
  // M00.F02.I02 — list current user memberships (mocked)
  memberships.value = [
    {
      id: "m1",
      tenantId: "00000000-0000-0000-0000-000000000001",
      code: "acme",
      name: "ACME Corp",
      status: "active",
    },
    {
      id: "m2",
      tenantId: "00000000-0000-0000-0000-000000000002",
      code: "globex",
      name: "Globex Industries",
      status: "active",
    },
    {
      id: "m3",
      tenantId: "00000000-0000-0000-0000-000000000003",
      code: "initech",
      name: "Initech",
      status: "active",
    },
  ];
});

const current = computed(() =>
  memberships.value.find((m) => m.tenantId === tenantStore.currentTenantId),
);

function onSwitch(tenantId: string) {
  // M00.F02.I03 — switch tenant via POST /api/me/tenants/{tenantId}/switch
  tenantStore.setTenant(tenantId, null, "mock-token-" + tenantId);
  router.push(`/tenants/${tenantId}/users`);
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
        <span class="font-medium">{{ current?.name ?? "选择租户" }}</span>
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
          v-for="m in memberships"
          :key="m.id"
          class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground cursor-pointer"
          @select="onSwitch(m.tenantId)"
        >
          <Building2 class="h-4 w-4 mr-2 text-slate-500" />
          <div class="flex flex-col">
            <span class="font-medium">{{ m.name }}</span>
            <span class="text-xs text-slate-500 font-mono">{{ m.code }}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
