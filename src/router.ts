import { createRouter, createWebHistory } from "vue-router";
import { useTenantStore } from "./state/tenant-store";
import LoginPage from "./pages/LoginPage.vue";
import AppShell from "./components/app/app-shell.vue";
import TenantListPage from "./pages/TenantListPage.vue";
import UserListPage from "./pages/UserListPage.vue";
import RoleListPage from "./pages/RoleListPage.vue";
import AppListPage from "./pages/AppListPage.vue";
import MenuTreePage from "./pages/MenuTreePage.vue";
import RoleMenuGrantPage from "./pages/RoleMenuGrantPage.vue";
import ApiKeyListPage from "./pages/ApiKeyListPage.vue";
import AuditListPage from "./pages/AuditListPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 登录：独立路由，绕过 AppShell
    { path: "/login", component: LoginPage },

    // 其他路由统一包在 AppShell（左侧 sidebar + 顶部 header + 内容）
    {
      path: "/",
      component: AppShell,
      children: [
        { path: "", redirect: "/tenants" },
        { path: "tenants", component: TenantListPage },
        { path: "tenants/:tenantId/users", component: UserListPage, props: true },
        { path: "tenants/:tenantId/roles", component: RoleListPage, props: true },
        {
          path: "tenants/:tenantId/roles/:roleId/menus",
          component: RoleMenuGrantPage,
          props: true,
        },
        { path: "admin/apps", component: AppListPage },
        { path: "admin/apps/:appId/menus", component: MenuTreePage, props: true },
        { path: "tenants/:tenantId/api-keys", component: ApiKeyListPage, props: true },
        { path: "tenants/:tenantId/audit", component: AuditListPage, props: true },
      ],
    },

    { path: "/:pathMatch(.*)*", redirect: "/tenants" },
  ],
});

router.beforeEach((to) => {
  // tenant store 已由 Pinia 安装；useTenantStore() 第一次调用时同步 hydrate localStorage
  const tenantStore = useTenantStore();
  if (!tenantStore.isAuthenticated && to.path !== "/login") {
    return { path: "/login" };
  }
  if (tenantStore.isAuthenticated && to.path === "/login") {
    // 2026-08-29 修 prod 401: OAuth 2.0 跳板 URL (?redirect_uri=&state=&client_id=)
    // 来自 lab RP,不能跳 /tenants — 必须让 LoginPage 调 saas /api/v1/oauth/authorize
    // 签 code 跳回 RP。已登录用户也要走完 OAuth 流程(RFC 6749 §4.1.1)。
    // vue-router 4 RouteLocationNormalized 上无 search 字段,用 to.query 反查。
    const q = to.query as Record<string, unknown>;
    const hasRedirectUri =
      typeof q.redirect_uri === "string" && q.redirect_uri.length > 0;
    if (!hasRedirectUri) {
      return { path: "/tenants" };
    }
  }
});
