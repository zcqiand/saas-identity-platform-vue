// tests/helpers/real-chain.ts — vue 仓真链路锚（saas-react tests/helpers/real-chain.ts
// 同构移植；vue 版无 RTL，只保留 token 通道 + SEED 锚两件事）。
//
// axios 拦截器由真链路测试文件自装（installHttpClient(() => testToken())，
// 每文件进程一次性——main.ts bootstrap 在测试里不跑，需自行接桥）。
// jsdom url 与真后端 :5101 同源（vitest.config environmentOptions），XHR 直连。
//
// SEED 锚：saas-shared seeds/*.json（DB 快照权威源，globalSetup 每次跑前
// TRUNCATE+全量重灌）。断言一律锚定种子行的固定 id/字段，不许断言易变业务值。
import { inject } from "vitest";

// globalSetup 双通道之一：provide("TEST_TOKEN", token) 的消费类型声明
declare module "vitest" {
  interface ProvidedContext {
    TEST_TOKEN: string;
  }
}

import tenantMemberSeedJson from "../../../saas-identity-platform-shared/seeds/tenant_member.json";
import tenantsSeedJson from "../../../saas-identity-platform-shared/seeds/tenant.json";
import usersSeedJson from "../../../saas-identity-platform-shared/seeds/sys_user.json";
import rolesSeedJson from "../../../saas-identity-platform-shared/seeds/sys_role.json";

/** token 双通道：process.env（forks pool 继承）优先，回落 vitest inject。 */
export function testToken(): string {
  const fromEnv = process.env["TEST_TOKEN"];
  if (fromEnv) return fromEnv;
  try {
    const injected: unknown = inject("TEST_TOKEN");
    return typeof injected === "string" ? injected : "";
  } catch {
    return "";
  }
}

/** fail-fast 版：真链路用例入口处校验，缺 token 立即爆（不许静默 401）。 */
export function installRealChain(): void {
  if (!testToken()) throw new Error("fail-fast: TEST_TOKEN 缺失——globalSetup 未运行？");
}

// ————————————————————————————————————————————————
// SEED 锚（saas-shared seeds/*.json，DB 快照权威源）
// ————————————————————————————————————————————————

export interface SeedTenantRow {
  id: string;
  tenantKey: string;
  name: string;
  status: string;
}

export interface SeedUserRow {
  id: string;
  username: string;
  status: string;
}

export interface SeedRoleRow {
  id: string;
  roleCode: string;
  tenantId: string;
}

export interface SeedMemberRow {
  id: string;
  userId: string;
  tenantId: string;
  roleIds: string[];
  status: string;
}

export const SEED = {
  tenants: tenantsSeedJson as SeedTenantRow[],
  users: usersSeedJson as SeedUserRow[],
  roles: rolesSeedJson as SeedRoleRow[],
  members: tenantMemberSeedJson as SeedMemberRow[],
};
