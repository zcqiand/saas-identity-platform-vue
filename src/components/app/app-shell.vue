<script setup lang="ts">
// AppShell — top bar with breadcrumbs + left sidebar + main content.
//
// Sidebar links with `:tenantId` placeholder are dynamically substituted with
// `currentTenantId` (from tenant-store). This way clicking "用户管理" while
// tenant = globex goes to `/tenants/globex/users`, not literal `/tenants/:tenantId/users`.

import { computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import {
  Building2,
  Users,
  Shield,
  KeyRound,
  ScrollText,
  LogOut,
  ChevronRight,
  Home,
  Boxes,
  FolderTree,
} from "lucide-vue-next";
import Button from "../ui/button.vue";
import Separator from "../ui/separator.vue";
import Toaster from "../ui/sonner.vue";
import SidebarNav from "./sidebar-nav.vue";
import TenantSwitcher from "../tenant-switcher.vue";
import BackendBadge from "./backend-badge.vue";
import { getTenant } from "@saas/identity-platform-msw";
import { useTenantStore } from "../../state/tenant-store";

interface Crumb {
  label: string;
  to: string;
  icon?: unknown;
  hint?: string;
}

const SUB_PATH_LABEL: Record<string, string> = {
  users: "用户",
  roles: "角色",
  "api-keys": "API Key",
  audit: "审计日志",
  menus: "菜单",
  apps: "应用",
};

interface NavItem {
  to: string;
  label: string;
  group: string;
  icon?: unknown;
  fnId?: string;
}

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const tenantForNav = computed(
  () => tenantStore.currentTenantId ?? "00000000-0000-0000-0000-000000000001",
);

const crumbs = computed<Crumb[]>(() => {
  const pathname = route.path;
  if (pathname === "/tenants" || pathname === "/") {
    return [{ label: "首页", to: "/tenants", icon: Home }];
  }
  const segments = pathname.split("/").filter(Boolean);
  const result: Crumb[] = [{ label: "首页", to: "/tenants", icon: Home }];
  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path += "/" + seg;
    const prev = i > 0 ? segments[i - 1] : null;
    if (seg === "tenants" && i + 1 < segments.length) continue;
    if (prev === "tenants") {
      const tenant = getTenant(seg) ?? getTenant(tenantForNav.value);
      if (tenant) {
        result.push({ label: tenant.name, to: path, hint: tenant.code });
      } else {
        result.push({ label: "未知租户", to: path, hint: seg.slice(0, 8) });
      }
      continue;
    }
    result.push({ label: SUB_PATH_LABEL[seg] ?? seg, to: path });
  }
  return result;
});

const navItems = computed<NavItem[]>(() => [
  { to: "/tenants", label: "租户管理", group: "首页", icon: Building2, fnId: "M00.F01.I01" },
  {
    to: `/tenants/${tenantForNav.value}/users`,
    label: "用户管理",
    group: "身份管理",
    icon: Users,
    fnId: "M01.F01.I01",
  },
  {
    to: `/tenants/${tenantForNav.value}/roles`,
    label: "角色管理",
    group: "身份管理",
    icon: Shield,
    fnId: "M02.F01.I01",
  },
  {
    to: `/tenants/${tenantForNav.value}/api-keys`,
    label: "API Key",
    group: "平台运营",
    icon: KeyRound,
    fnId: "M05.F01.I01",
  },
  {
    to: `/tenants/${tenantForNav.value}/audit`,
    label: "审计日志",
    group: "平台运营",
    icon: ScrollText,
    fnId: "M06.F01.I01",
  },
  { to: "/admin/apps", label: "应用管理", group: "应用与菜单", icon: Boxes, fnId: "M04.F01.I01" },
  {
    to: "/admin/apps/lab-management/menus",
    label: "菜单管理",
    group: "应用与菜单",
    icon: FolderTree,
    fnId: "M08.F01.I01",
  },
]);

async function onLogout() {
  tenantStore.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <Toaster />
    <SidebarNav :items="navItems">
      <template #footerAction>
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10"
          data-testid="logout-btn"
          data-fn="M03.F03.I05"
          @click="onLogout"
        >
          <LogOut class="h-4 w-4" />
          登出
        </Button>
      </template>
      <template #footerExtras>
        <BackendBadge />
      </template>
    </SidebarNav>
    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-14 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 shrink-0"
      >
        <nav class="flex items-center gap-1 text-sm" aria-label="breadcrumb">
          <template v-for="(c, i) in crumbs" :key="c.to">
            <ChevronRight v-if="i > 0" class="h-3.5 w-3.5 text-slate-400" />
            <span
              v-if="i === crumbs.length - 1"
              class="flex items-center gap-1.5 text-slate-900 font-medium"
            >
              <component :is="c.icon" v-if="c.icon" class="h-3.5 w-3.5" />
              {{ c.label }}
              <span v-if="c.hint" class="text-slate-400 font-mono text-xs">({{ c.hint }})</span>
            </span>
            <RouterLink
              v-else
              :to="c.to"
              class="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <component :is="c.icon" v-if="c.icon" class="h-3.5 w-3.5" />
              {{ c.label }}
              <span v-if="c.hint" class="text-slate-400 font-mono text-xs">({{ c.hint }})</span>
            </RouterLink>
          </template>
        </nav>
        <div class="flex items-center gap-3">
          <TenantSwitcher v-if="tenantStore.currentTenantId" />
        </div>
      </header>
      <Separator />
      <main class="flex-1 overflow-auto">
        <div class="max-w-6xl mx-auto p-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
