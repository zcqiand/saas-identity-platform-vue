// vitest setup — DOM cleanup + Pinia reset + api-client mock（orval 生成的 endpoints.ts 模块）
//
// 关键点：
//   - orval 生成的 endpoints.ts 在模块加载时引 axios，vi.mock('axios') 会让本仓
//     endpoints 模块初始化失败（只剩 getTitle 一个 export）。直接 mock api-client 模块更稳。
//   - vue 仓的 page 直接调 `useXxx` hooks（不是裸函数），所以 mock 必须返 vue-query
//     reactive 对象（data / isLoading / isError / error / refetch）。
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

vi.mock("../src/api/endpoints/endpoints", () => {
  // === Auth ===
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
  // === Query hooks ===
  return {
    useAuthLogin: () => ({ ...makeMutationStub(), mutateAsync: authLogin }),
    useOAuthAuthorize: () => makeMutationStub(),

    useAdminTenantsListTenants: () =>
      makeQueryStub({ items: tenants, page: 1, pageSize: 10, total: tenants.length }),
    useAdminTenantsCreateTenant: () => makeMutationStub(),
    useAdminTenantsGetTenant: () => makeQueryStub(tenants[0]),
    useAdminTenantsUpdateTenant: () => makeMutationStub(),
    useAdminTenantsDeleteTenant: () => makeMutationStub(),

    useTenantUsersListUsers: () =>
      makeQueryStub({ items: users, page: 1, pageSize: 10, total: users.length }),
    useTenantUsersCreateUser: () => makeMutationStub(),
    useTenantUsersGetUser: () => makeQueryStub(users[0]),
    useTenantUsersUpdateUser: () => makeMutationStub(),
    useTenantUsersDeleteUser: () => makeMutationStub(),
    useTenantUsersInviteUser: () => makeMutationStub(),
    useTenantUsersAssignRoles: () => makeMutationStub(),
    useTenantUsersChangeUserStatus: () => makeMutationStub(),

    useTenantRolesListRoles: () =>
      makeQueryStub({ items: roles, page: 1, pageSize: 10, total: roles.length }),
    useTenantRolesCreateRole: () => makeMutationStub(),
    useTenantRolesGetRole: () => makeQueryStub(roles[0]),
    useTenantRolesUpdateRole: () => makeMutationStub(),
    useTenantRolesDeleteRole: () => makeMutationStub(),
    useTenantRolesSetPermissions: () => makeMutationStub(),

    useTenantApiKeysListApiKeys: () =>
      makeQueryStub({ items: apiKeys, page: 1, pageSize: 10, total: apiKeys.length }),
    useTenantApiKeysCreateApiKey: () => makeMutationStub(),
    useTenantApiKeysRevokeApiKey: () => makeMutationStub(),
    useTenantApiKeysRotateApiKey: () => makeMutationStub(),

    useAdminAppsListApps: () =>
      makeQueryStub({ items: apps, page: 1, pageSize: 10, total: apps.length }),
    useAdminAppsCreateApp: () => makeMutationStub(),
    useAdminAppsGetApp: () => makeQueryStub(apps[0]),
    useAdminAppsUpdateApp: () => makeMutationStub(),
    useAdminAppsDeleteApp: () => makeMutationStub(),
    useAdminAppsSetAppStatus: () => makeMutationStub(),

    useAdminAppMenusListMenus: () => makeQueryStub(menus),
    useAdminAppMenusCreateMenu: () => makeMutationStub(),
    useAdminAppMenusGetMenu: () => makeQueryStub(menus[0]),
    useAdminAppMenusUpdateMenu: () => makeMutationStub(),
    useAdminAppMenusDeleteMenu: () => makeMutationStub(),
    useAdminAppMenusMoveMenu: () => makeMutationStub(),
    useAdminAppMenusReorderMenus: () => makeMutationStub(),

    useTenantRoleMenusListRoleMenus: () =>
      makeQueryStub(roleMenuGrants[0] ?? { roleId: "r1", menuIds: [], updatedAt: "" }),
    useTenantRoleMenusSetRoleMenus: () => makeMutationStub(),
    useTenantRoleMenusClearRoleMenus: () => makeMutationStub(),

    useTenantAuditListAuditEvents: () =>
      makeQueryStub({ items: auditEvents, page: 1, pageSize: 10, total: auditEvents.length }),
    useTenantAuditListAuditEventsByUser: () =>
      makeQueryStub({ items: auditEvents, page: 1, pageSize: 10, total: auditEvents.length }),
    useTenantAuditExportAuditEvents: () => makeMutationStub(),
    useTenantAuditGetRetentionPolicy: () => makeQueryStub({ retentionDays: 90 }),
    useTenantAuditSetRetentionPolicy: () => makeMutationStub(),

    useMeWhoami: () => makeQueryStub(users[0]),
    useMeGetMyMenus: () => makeQueryStub({ menus: [] }),
    useMeListMyTenants: () => makeQueryStub([]),
    useMeSwitchTenant: () => makeMutationStub(),
  };
});

afterEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
});
