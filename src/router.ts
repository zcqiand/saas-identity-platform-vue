import { createRouter, createWebHistory } from "vue-router";
import { useTenantStore } from "./state/tenant-store";
import LoginPage from "./pages/LoginPage.vue";
import TenantListPage from "./pages/TenantListPage.vue";
import UserListPage from "./pages/UserListPage.vue";
import RoleListPage from "./pages/RoleListPage.vue";
import OAuthAppListPage from "./pages/OAuthAppListPage.vue";
import ApiKeyListPage from "./pages/ApiKeyListPage.vue";
import AuditListPage from "./pages/AuditListPage.vue";
import TenantSwitcher from "./components/tenant-switcher.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginPage },
    {
      path: "/tenants",
      components: { default: TenantListPage, header: TenantSwitcher },
    },
    {
      path: "/tenants/:tenantId/users",
      components: { default: UserListPage, header: TenantSwitcher },
      props: { default: true },
    },
    {
      path: "/tenants/:tenantId/roles",
      components: { default: RoleListPage, header: TenantSwitcher },
      props: { default: true },
    },
    {
      path: "/oauth-apps",
      components: { default: OAuthAppListPage, header: TenantSwitcher },
    },
    {
      path: "/tenants/:tenantId/api-keys",
      components: { default: ApiKeyListPage, header: TenantSwitcher },
      props: { default: true },
    },
    {
      path: "/tenants/:tenantId/audit",
      components: { default: AuditListPage, header: TenantSwitcher },
      props: { default: true },
    },
    { path: "/:pathMatch(.*)*", redirect: "/tenants" },
  ],
});

router.beforeEach((to) => {
  const tenantStore = useTenantStore();
  if (!tenantStore.accessToken && to.path !== "/login") {
    return { path: "/login" };
  }
});