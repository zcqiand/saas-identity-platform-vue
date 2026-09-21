<script setup lang="ts">
// AppShell — top bar with breadcrumbs + left sidebar + main content.
//
// Sidebar links with `:tenantId` placeholder are dynamically substituted with
// `currentTenantId` (from tenant-store). This way clicking "租户成员" while
// tenant = globex goes to `/tenants/globex/members`, not literal `/tenants/:tenantId/members`.

import { computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { LogOut, ChevronRight, Home } from "lucide-vue-next";
import Button from "../ui/button.vue";
import Separator from "../ui/separator.vue";
import Toaster from "../ui/sonner.vue";
import SidebarNav from "./sidebar-nav.vue";
import { buildNavItems } from "./nav-items";
import TenantSwitcher from "../tenant-switcher.vue";
import BackendBadge from "./backend-badge.vue";
import { useTenantStore } from "../../state/tenant-store";
import { useMeWhoami } from "../../api/endpoints/me/me";

interface Crumb {
  label: string;
  to: string;
  icon?: unknown;
  hint?: string;
}

const SUB_PATH_LABEL: Record<string, string> = {
  members: "用户",
  roles: "角色",
  clients: "应用",
  applications: "应用",
  menus: "菜单",
  admin: "平台管理",
};

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const tenantForNav = computed(
  () => tenantStore.currentTenantId ?? "00000000-0000-0000-0000-000000000001",
);

// 面包屑租户名：通过 tenant-store.tenants() 拉租户列表建 id->tenant 字典；
// 加载中/未命中显示「未知租户」。集中到 store，缓存交给 vue-query。
const tenantsQ = tenantStore.tenants();
const tenantById = computed(() => {
  const items = tenantsQ.data.value?.data?.items ?? [];
  // 双键索引：URL 段既可能是 UUID 也可能是 tenantKey
  const m = new Map<string, (typeof items)[number]>();
  for (const t of items) {
    m.set(t.id, t);
    if (t.tenantKey) m.set(t.tenantKey, t);
  }
  return m;
});

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
      // 用户裁定 2026-09-11：面包屑显示租户名称，不再展示括号中的 ID
      const tenant = tenantById.value.get(seg) ?? tenantById.value.get(tenantForNav.value);
      result.push({ label: tenant ? tenant.name : "未知租户", to: path });
      continue;
    }
    result.push({ label: SUB_PATH_LABEL[seg] ?? seg, to: path });
  }
  return result;
});

const navItems = computed(() => buildNavItems(tenantForNav.value));

// 顶栏 whoami 徽标（M01 用户管理接线）：失败静默降级（retry:false + v-if，
// 不阻塞导航）；email 缺省降级 id，title 恒为 id。
const whoamiQ = useMeWhoami({ query: { retry: false } });
const whoami = computed(() => whoamiQ.data.value?.data);

async function onLogout() {
  // logout() 先调 API 再清 session（async）；不 await 的话 router.push 时
  // isAuthenticated 仍 true，路由守卫把 /login 拦回工作区（E2E REQ-2026-004 抓出）
  await tenantStore.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <Toaster />
    <SidebarNav :items="navItems">
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
          <span
            v-if="whoami"
            data-testid="whoami-badge"
            class="text-sm text-slate-600"
            :title="whoami.id"
          >{{ whoami.email ?? whoami.id }}</span>
          <TenantSwitcher v-if="tenantStore.currentTenantId" />
          <!-- 登出（用户裁定 2026-09-11：移到右上角，切换租户旁） -->
          <Button
            variant="ghost"
            size="sm"
            class="gap-2 text-slate-600 hover:text-slate-900"
            data-testid="logout-btn"
            data-fn="M01.F04.I06"
            @click="onLogout"
          >
            <LogOut class="h-4 w-4" />
            登出
          </Button>
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
