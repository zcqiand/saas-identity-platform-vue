// vitest setup — DOM cleanup + Pinia reset + api-client mock（orval 生成的 endpoints.ts 模块）
//
// 关键点：
//   - orval 生成的 endpoints.ts 在模块加载时引 axios，vi.mock('axios') 会让本仓
//     endpoints 模块初始化失败（只剩 getTitle 一个 export）。直接 mock api-client 模块更稳。
//   - vue 仓的 page 直接调 `useXxx` hooks（不是裸函数），所以 mock 必须返 vue-query
//     reactive 对象（data / isLoading / isError / error / refetch）。
//
// 2026-09-09 L4 收尾：
//   - LoginPage 用 useSessionsLogin + useOAuthAuthorize（不是旧名 useAuthLogin）。
//   - MenuTreePage 用 useClientMenusListSysMenus + useAdminClientsListClients
//     （不是旧名 useAdminAppMenusListMenus / useAdminAppsListApps，9/7 重命名后的端点）。
//   - 给 import.meta.env.VITE_LOGIN_CLIENT_ID 兜底 'test-client-id'（ADR-0019
//     业务身份字段禁止 demo 字面量兜底 → 在测试 setup 注入合法值，不动生产路径）。
import { afterEach, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import {
  tenants,
  users,
  roles,
  apiKeys,
  apps,
  menus,
  roleMenuGrants,
  auditEvents,
} from "@saas/identity-platform-msw/fixtures";

// 给登录页兜底合法 clientId（业务身份字段，测试用固定值；生产走 OAuth URL 注入）
// vite/vitest 把 VITE_LOGIN_CLIENT_ID 注入到 import.meta.env 上
if (!import.meta.env.VITE_LOGIN_CLIENT_ID) {
  (import.meta.env as Record<string, string>).VITE_LOGIN_CLIENT_ID = "test-client-id";
}

function page<T>(items: T[]) {
  return { items, page: 1, pageSize: items.length, total: items.length };
}

function makeQueryStub<T>(data: T) {
  return {
    data: ref<T>(data),
    isLoading: ref(false),
    isFetching: ref(false),
    isError: ref(false),
    error: ref<unknown>(null),
    refetch: () => Promise.resolve(),
  };
}

function makeMutationStub() {
  return {
    mutate: () => {},
    mutateAsync: async (vars: { data: any }) => ({
      data: { id: "new-id", ...(vars?.data ?? {}) },
    }),
    isPending: ref(false),
    reset: () => {},
  };
}

// 2026-09-09 L4 收尾: orval 生成的 endpoints 分散在 src/api/endpoints/*/ 子目录里,
// 没有统一的 barrel。vi.mock 路径必须指向真实模块 → 按子目录 mock。
//
// 旧 setup.ts 的 `vi.mock("../src/api/endpoints/endpoints", ...)` 指向不存在的
// 模块，mock 从未生效，但其它只渲染 UI 元素的测试碰巧过了；menu-tree 这种依赖
// vue-query data 的 page 立刻暴露——axios 在 jsdom 里真发 XHR 报 AggregateError。
//
// 策略：每个真实存在的 endpoints 子模块各起一个 vi.mock。
function buildHooksMock() {
  function authLogin(_vars: { data: { username: string } }) {
    return Promise.resolve({
      data: {
        accessToken: `mock-jwt-${_vars.data.username}`,
        refreshToken: "mock-refresh",
        tokenType: "Bearer",
        expiresIn: 3600,
        userId: "u1",
        currentTenantId: "00000000-0000-0000-0000-000000000001",
      },
    });
  }
  return {
    // === Auth ===
    useSessionsLogin: () => ({ ...makeMutationStub(), mutateAsync: authLogin }),
    useSessionsLogout: () => makeMutationStub(),

    // === OAuth ===
    useOAuthAuthorize: () => makeMutationStub(),
    useOAuthToken: () => makeMutationStub(),

    // === AdminTenants ===
    useAdminTenantsListTenants: () =>
      makeQueryStub({ items: tenants, page: 1, pageSize: 10, total: tenants.length }),
    useAdminTenantsCreateTenant: () => makeMutationStub(),
    useAdminTenantsGetTenant: () => makeQueryStub(tenants[0]),
    useAdminTenantsUpdateTenant: () => makeMutationStub(),
    useAdminTenantsDeleteTenant: () => makeMutationStub(),

    // === TenantMembers (users) ===
    useTenantMembersListTenantUsers: () =>
      makeQueryStub({ items: users, page: 1, pageSize: 10, total: users.length }),
    useTenantMembersGetTenantUser: () => makeQueryStub(users[0]),
    useTenantMembersCreateTenantUser: () => makeMutationStub(),
    useTenantMembersUpdateTenantUser: () => makeMutationStub(),
    useTenantMembersDeleteTenantUser: () => makeMutationStub(),
    useTenantMembersInviteTenantUser: () => makeMutationStub(),
    useTenantMembersAssignTenantMemberRoles: () => makeMutationStub(),
    useTenantMembersChangeTenantUserStatus: () => makeMutationStub(),

    // === TenantRoles ===
    useTenantRolesListSysRoles: () =>
      makeQueryStub({ items: roles, page: 1, pageSize: 10, total: roles.length }),
    useTenantRolesGetSysRole: () => makeQueryStub(roles[0]),
    useTenantRolesCreateSysRole: () => makeMutationStub(),
    useTenantRolesUpdateSysRole: () => makeMutationStub(),
    useTenantRolesDeleteSysRole: () => makeMutationStub(),
    useTenantRolesSetPermissions: () => makeMutationStub(),

    // === TenantApplications (api keys) ===
    useTenantApplicationsListTenantApiKeys: () =>
      makeQueryStub({ items: apiKeys, page: 1, pageSize: 10, total: apiKeys.length }),
    useTenantApplicationsCreateTenantApiKey: () => makeMutationStub(),
    useTenantApplicationsRevokeTenantApiKey: () => makeMutationStub(),
    useTenantApplicationsRotateTenantApiKey: () => makeMutationStub(),
    useTenantApplicationsSubscribeTenantApplication: () => makeMutationStub(),
    useTenantApplicationsUpdateTenantApplication: () => makeMutationStub(),
    useTenantApplicationsRemoveTenantApplication: () => makeMutationStub(),

    // === AdminApps (旧名,部分 page 可能还在用) ===
    useAdminAppsListApps: () =>
      makeQueryStub({ data: { items: apps, page: 1, pageSize: apps.length, total: apps.length } }),
    useAdminAppsCreateApp: () => makeMutationStub(),
    useAdminAppsGetApp: () => makeQueryStub(apps[0]),
    useAdminAppsUpdateApp: () => makeMutationStub(),
    useAdminAppsDeleteApp: () => makeMutationStub(),
    useAdminAppsSetAppStatus: () => makeMutationStub(),

    // === AdminClients (9/7 重命名后的 app endpoint) ===
    useAdminClientsListClients: () =>
      makeQueryStub({ data: { items: apps, page: 1, pageSize: apps.length, total: apps.length } }),
    useAdminClientsGetClient: () => makeQueryStub(apps[0]),
    useAdminClientsCreateClient: () => makeMutationStub(),
    useAdminClientsUpdateClient: () => makeMutationStub(),
    useAdminClientsDeleteClient: () => makeMutationStub(),
    useAdminClientsSetClientStatus: () => makeMutationStub(),
    useAdminClientsRotateClientSecret: () => makeMutationStub(),
    useAdminClientsListScopes: () => makeQueryStub([]),
    useAdminClientsListGrantTypes: () => makeQueryStub([]),

    // === ClientMenus (9/7 重命名后的 menu endpoint) ===
    useClientMenusListSysMenus: () => makeQueryStub({ data: menus }),
    useClientMenusCreateSysMenu: () => makeMutationStub(),
    useClientMenusGetSysMenu: () => makeQueryStub(menus[0]),
    useClientMenusUpdateSysMenu: () => makeMutationStub(),
    useClientMenusDeleteSysMenu: () => makeMutationStub(),
    useClientMenusMoveSysMenu: () => makeMutationStub(),
    useClientMenusReorderSysMenus: () => makeMutationStub(),

    // === TenantRoleMenus ===
    useTenantRoleMenusListRoleMenus: () =>
      makeQueryStub(roleMenuGrants[0] ?? { roleId: "r1", menuIds: [], updatedAt: "" }),
    useTenantRoleMenusSetRoleMenus: () => makeMutationStub(),
    useTenantRoleMenusClearRoleMenus: () => makeMutationStub(),

    // === TenantAudit ===
    useTenantAuditListAuditEvents: () =>
      makeQueryStub({ items: auditEvents, page: 1, pageSize: 10, total: auditEvents.length }),
    useTenantAuditListAuditEventsByUser: () =>
      makeQueryStub({ items: auditEvents, page: 1, pageSize: 10, total: auditEvents.length }),
    useTenantAuditExportAuditEvents: () => makeMutationStub(),
    useTenantAuditGetRetentionPolicy: () => makeQueryStub({ retentionDays: 90 }),
    useTenantAuditSetRetentionPolicy: () => makeMutationStub(),

    // === Me ===
    useMeWhoami: () => makeQueryStub(users[0]),
    useMeGetMyMenus: () => makeQueryStub({ menus: [] }),
    useMeListMyTenants: () => makeQueryStub([]),
    useMeSwitchTenant: () => makeMutationStub(),
  };
}

const hookMocks = buildHooksMock();

// mock 每个真实存在的 endpoints 子模块。orval 给每个端点 group 生成一个文件,
// 这里覆盖所有 page 实际 import 的路径。
vi.mock("../src/api/endpoints/auth/auth", () => ({
  useSessionsLogin: hookMocks.useSessionsLogin,
  useSessionsLogout: hookMocks.useSessionsLogout,
}));
vi.mock("../src/api/endpoints/oauth/oauth", () => ({
  useOAuthAuthorize: hookMocks.useOAuthAuthorize,
  useOAuthToken: hookMocks.useOAuthToken,
}));
vi.mock("../src/api/endpoints/admin-tenants/admin-tenants", () => ({
  useAdminTenantsListTenants: hookMocks.useAdminTenantsListTenants,
  useAdminTenantsCreateTenant: hookMocks.useAdminTenantsCreateTenant,
  useAdminTenantsGetTenant: hookMocks.useAdminTenantsGetTenant,
  useAdminTenantsUpdateTenant: hookMocks.useAdminTenantsUpdateTenant,
  useAdminTenantsDeleteTenant: hookMocks.useAdminTenantsDeleteTenant,
}));
vi.mock("../src/api/endpoints/tenant-members/tenant-members", () => ({
  useTenantMembersListTenantUsers: hookMocks.useTenantMembersListTenantUsers,
  useTenantMembersGetTenantUser: hookMocks.useTenantMembersGetTenantUser,
  useTenantMembersCreateTenantUser: hookMocks.useTenantMembersCreateTenantUser,
  useTenantMembersUpdateTenantUser: hookMocks.useTenantMembersUpdateTenantUser,
  useTenantMembersDeleteTenantUser: hookMocks.useTenantMembersDeleteTenantUser,
  useTenantMembersInviteTenantUser: hookMocks.useTenantMembersInviteTenantUser,
  useTenantMembersAssignTenantMemberRoles: hookMocks.useTenantMembersAssignTenantMemberRoles,
  useTenantMembersChangeTenantUserStatus: hookMocks.useTenantMembersChangeTenantUserStatus,
}));
vi.mock("../src/api/endpoints/tenant-roles/tenant-roles", () => ({
  useTenantRolesListSysRoles: hookMocks.useTenantRolesListSysRoles,
  useTenantRolesGetSysRole: hookMocks.useTenantRolesGetSysRole,
  useTenantRolesCreateSysRole: hookMocks.useTenantRolesCreateSysRole,
  useTenantRolesUpdateSysRole: hookMocks.useTenantRolesUpdateSysRole,
  useTenantRolesDeleteSysRole: hookMocks.useTenantRolesDeleteSysRole,
  useTenantRolesSetPermissions: hookMocks.useTenantRolesSetPermissions,
}));
vi.mock("../src/api/endpoints/tenant-applications/tenant-applications", () => ({
  useTenantApplicationsListTenantApiKeys: hookMocks.useTenantApplicationsListTenantApiKeys,
  useTenantApplicationsCreateTenantApiKey: hookMocks.useTenantApplicationsCreateTenantApiKey,
  useTenantApplicationsRevokeTenantApiKey: hookMocks.useTenantApplicationsRevokeTenantApiKey,
  useTenantApplicationsRotateTenantApiKey: hookMocks.useTenantApplicationsRotateTenantApiKey,
  useTenantApplicationsSubscribeTenantApplication: hookMocks.useTenantApplicationsSubscribeTenantApplication,
  useTenantApplicationsUpdateTenantApplication: hookMocks.useTenantApplicationsUpdateTenantApplication,
  useTenantApplicationsRemoveTenantApplication: hookMocks.useTenantApplicationsRemoveTenantApplication,
}));
vi.mock("../src/api/endpoints/admin-clients/admin-clients", () => ({
  useAdminClientsListClients: hookMocks.useAdminClientsListClients,
  useAdminClientsGetClient: hookMocks.useAdminClientsGetClient,
  useAdminClientsCreateClient: hookMocks.useAdminClientsCreateClient,
  useAdminClientsUpdateClient: hookMocks.useAdminClientsUpdateClient,
  useAdminClientsDeleteClient: hookMocks.useAdminClientsDeleteClient,
  useAdminClientsSetClientStatus: hookMocks.useAdminClientsSetClientStatus,
  useAdminClientsRotateClientSecret: hookMocks.useAdminClientsRotateClientSecret,
  useAdminClientsListScopes: hookMocks.useAdminClientsListScopes,
  useAdminClientsListGrantTypes: hookMocks.useAdminClientsListGrantTypes,
}));
vi.mock("../src/api/endpoints/client-menus/client-menus", () => ({
  useClientMenusListSysMenus: hookMocks.useClientMenusListSysMenus,
  useClientMenusCreateSysMenu: hookMocks.useClientMenusCreateSysMenu,
  useClientMenusGetSysMenu: hookMocks.useClientMenusGetSysMenu,
  useClientMenusUpdateSysMenu: hookMocks.useClientMenusUpdateSysMenu,
  useClientMenusDeleteSysMenu: hookMocks.useClientMenusDeleteSysMenu,
  useClientMenusMoveSysMenu: hookMocks.useClientMenusMoveSysMenu,
  useClientMenusReorderSysMenus: hookMocks.useClientMenusReorderSysMenus,
}));
vi.mock("../src/api/endpoints/tenant-role-menus/tenant-role-menus", () => ({
  useTenantRoleMenusListRoleMenus: hookMocks.useTenantRoleMenusListRoleMenus,
  useTenantRoleMenusSetRoleMenus: hookMocks.useTenantRoleMenusSetRoleMenus,
  useTenantRoleMenusClearRoleMenus: hookMocks.useTenantRoleMenusClearRoleMenus,
}));

afterEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
});
