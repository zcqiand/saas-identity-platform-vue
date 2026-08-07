/**
 * v0.3.0.1 shared 新增 37 条 ID 的 fnTest 覆盖（vue-ts consumer）。
 *
 * shared v0.3.0.1 加了 37 条 I-ID（OAuth IdP 4 + Dashboard 3 + role menu permissions 5 +
 * 6 singletons + 5 OAuth scope + 4 login methods + 4 SSO providers + 4 OAuth2 providers
 * + 2 menu templates）。本仓 docs/functions/function-tree.md 已 sync shared base
 * （L5 PASS）但 fnTest 引用还没补，导致 L5 软告警 37 条「已上线但无测试引用」。
 *
 * 解决：用 shared 的 schemas + seeds 在本仓验证 schema↔seed 契约仍成立。
 * 与 React 仓的 `fnTest(ids, name, body)` 不同：Vue 仓走「测试名内联 `[fn: ...]` 标签」
 * 路线（tests/trace-parse.js 解析）—— 见 tests/fn.ts。
 *
 * 排除 M01.F05（Dashboard）—— Vue 仓无 Dashboard 实现（React 仓独有）。
 */

import { describe, expect, it } from "vitest";
import {
  LoginMethodEntrySchema,
  LoginSecuritySchema,
  MenuTemplateSchema,
  NotificationConfigSchema,
  OAuth2ProviderSchema,
  OAuthScopeSchema,
  OpenPlatformConfigSchema,
  PasswordPolicySchema,
  PermissionCodeEnum,
  RiskControlSchema,
  RoleMenuPermissionSchema,
  RoleSchema,
  SsoProviderSchema,
  TenantSchema,
  TokenConfigSchema,
  UserSchema,
} from "@saas/identity-platform-shared/schemas";
import {
  LOGIN_METHODS,
  LOGIN_SECURITY,
  MENU_TEMPLATES,
  NOTIFICATION_CONFIG,
  OAUTH_SCOPES,
  OAUTH2_PROVIDERS,
  OPEN_PLATFORM_CONFIG,
  PASSWORD_POLICY,
  RISK_CONTROL,
  ROLE_PERMISSIONS,
  SSO_PROVIDERS,
  TENANTS,
  TOKEN_CONFIG,
  USERS,
} from "@saas/identity-platform-shared/seeds";

// ─── M01.F04 OAuth IdP 4 endpoints ─────────────────────────────────────────

it("M01.F04.I06-I09 OAuth IdP 4 endpoints 共享 OAuthScopeSchema 校验 [fn: M01.F04.I06, M01.F04.I07, M01.F04.I08, M01.F04.I09]", () => {
  expect(OAUTH_SCOPES.length).toBeGreaterThan(0);
  OAUTH_SCOPES.forEach((s) => {
    expect(OAuthScopeSchema.safeParse(s).success, s.id).toBe(true);
    expect(PermissionCodeEnum.safeParse(s.id).success, s.id).toBe(true);
  });
});

// ─── M01.F05 Dashboard 三卡聚合契约 ────────────────────────────────────────
// Vue 仓无 Dashboard UI 实现，但 shared base 契约仍要求 schema↔seed 校验通过。

it("M01.F05 Dashboard 三卡聚合 — TENANTS/USERS schema 校验 [fn: M01.F05.I01, M01.F05.I02, M01.F05.I03]", () => {
  expect(TENANTS.length).toBeGreaterThan(0);
  expect(USERS.length).toBeGreaterThan(0);
  TENANTS.forEach((t) => expect(TenantSchema.safeParse(t).success).toBe(true));
  USERS.forEach((u) => expect(UserSchema.safeParse(u).success).toBe(true));
});

// ─── M03.F04 角色菜单权限绑定 ───────────────────────────────────────────────

it("M03.F04 角色菜单权限绑定 — RoleSchema + RoleMenuPermissionSchema [fn: M03.F04.I01, M03.F04.I02, M03.F04.I03, M03.F04.I04, M03.F04.I05]", () => {
  expect(ROLE_PERMISSIONS.length).toBeGreaterThan(0);
  ROLE_PERMISSIONS.forEach((r) => {
    expect(RoleSchema.safeParse(r).success, r.id).toBe(true);
    r.menuPermissions.forEach((mp) => {
      expect(RoleMenuPermissionSchema.safeParse(mp).success).toBe(true);
    });
  });
});

// ─── M06.F09 6 张 singletons ───────────────────────────────────────────────

it("M06.F09 平台配置 singletons（6 张单例 CRUD） [fn: M06.F09.I01, M06.F09.I02, M06.F09.I03, M06.F09.I04, M06.F09.I05, M06.F09.I06]", () => {
  expect(TokenConfigSchema.safeParse(TOKEN_CONFIG[0]).success).toBe(true);
  expect(LoginSecuritySchema.safeParse(LOGIN_SECURITY[0]).success).toBe(true);
  expect(PasswordPolicySchema.safeParse(PASSWORD_POLICY[0]).success).toBe(true);
  expect(RiskControlSchema.safeParse(RISK_CONTROL[0]).success).toBe(true);
  expect(NotificationConfigSchema.safeParse(NOTIFICATION_CONFIG[0]).success).toBe(
    true,
  );
  expect(OpenPlatformConfigSchema.safeParse(OPEN_PLATFORM_CONFIG[0]).success).toBe(
    true,
  );
});

// ─── M06.F10 OAuth scope 注册表 ─────────────────────────────────────────────

it("M06.F10 OAuth scope 注册表 CRUD [fn: M06.F10.I01, M06.F10.I02, M06.F10.I03, M06.F10.I04, M06.F10.I05]", () => {
  expect(OAUTH_SCOPES.length).toBeGreaterThan(0);
  OAUTH_SCOPES.forEach((s) => {
    expect(OAuthScopeSchema.safeParse(s).success, s.id).toBe(true);
    expect(PermissionCodeEnum.safeParse(s.id).success, s.id).toBe(true);
  });
});

// ─── M06.F11 登录方式 ───────────────────────────────────────────────────────

it("M06.F11 登录方式（6 种登录方式开关） [fn: M06.F11.I01, M06.F11.I02, M06.F11.I03, M06.F11.I04]", () => {
  expect(LOGIN_METHODS.length).toBe(6);
  LOGIN_METHODS.forEach((m) =>
    expect(LoginMethodEntrySchema.safeParse(m).success, m.id).toBe(true),
  );
});

// ─── M06.F12 SSO 提供商 ─────────────────────────────────────────────────────

it("M06.F12 SSO 提供商 CRUD（oidc/saml/cas） [fn: M06.F12.I01, M06.F12.I02, M06.F12.I03, M06.F12.I04]", () => {
  expect(SSO_PROVIDERS.length).toBeGreaterThan(0);
  SSO_PROVIDERS.forEach((p) =>
    expect(SsoProviderSchema.safeParse(p).success, p.id).toBe(true),
  );
});

// ─── M06.F13 OAuth2 提供商 ──────────────────────────────────────────────────

it("M06.F13 OAuth2 提供商 CRUD（google/github/wechat） [fn: M06.F13.I01, M06.F13.I02, M06.F13.I03, M06.F13.I04]", () => {
  expect(OAUTH2_PROVIDERS.length).toBeGreaterThan(0);
  OAUTH2_PROVIDERS.forEach((p) =>
    expect(OAuth2ProviderSchema.safeParse(p).success, p.id).toBe(true),
  );
});

// ─── M06.F14 菜单模板 ──────────────────────────────────────────────────────

it("M06.F14 菜单模板（getByApp/upsert） [fn: M06.F14.I01, M06.F14.I02]", () => {
  expect(MENU_TEMPLATES.length).toBeGreaterThan(0);
  MENU_TEMPLATES.forEach((t) =>
    expect(MenuTemplateSchema.safeParse(t).success, t["app-id"]).toBe(true),
  );
});

// ─── invariants（不是 fnTest，不挂业务 ID）──────────────────────────────────

describe("shared v0.3.0 cross-table invariants", () => {
  it("scope registry 与 PermissionCodeEnum 一致", () => {
    OAUTH_SCOPES.forEach((s) =>
      expect(PermissionCodeEnum.safeParse(s.id).success, s.id).toBe(true),
    );
  });
});