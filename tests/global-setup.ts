// tests/global-setup.ts — 单测真链路基座（saas-react tests/global-setup.ts 同构移植）。
//
// 顺序：灌种子 → 起真 nextjs :5101（已健康则复用）→ 铸真 JWT → 真服务探针
// → 库身份探针（防「复用了指向别家库的 :5101」）。任何一步失败 fail-fast，
// 不许降级 mock。
//
// 与 react 版的实测差异：
//   1. JWT 铸造不用 jose（vue 仓无该依赖，禁为新测试引运行时包）——HS256
//      三段式直接用 node:crypto HMAC 拼，claim 形状与 jose SignJWT 产物一致
//      ：{ sub, tenant_id, iss, aud, iat, exp }（对齐 saas-nextjs src/lib/jwt.ts）。
//   2. 其余五步（seed-db / health / /me 双探针 / 库身份探针）与 react 版逐字同构。
//
// 进程治理：拉起的 nextjs 留活不杀——dev 迭代复用；PID 记到
// $TMPDIR/saas-vue-test-nextjs.pid 供人工清理；绝不反查端口杀树。
//
// DATABASE_URL 例外：只认 process.env，绝不回落 .env.local——本 setup 第 1 步
// 对目标库 TRUNCATE+全量重灌，顺着 .env.local 跑会把重灌打到真库。缺失立即
// fail-fast（gate 通道注入；本地裸跑显式 export）。
import { execSync, spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VUE_ROOT = resolve(HERE, "..");
const SHARED = resolve(VUE_ROOT, "../saas-identity-platform-shared");
const NEXTJS = resolve(VUE_ROOT, "../saas-identity-platform-nextjs");
const BASE = "http://localhost:5101";
const NEXTJS_ENV_FILE = resolve(NEXTJS, ".env.local");

const readDbUrl = (): string => {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl)
    throw new Error(
      "fail-fast: DATABASE_URL 只认 process.env，缺失（禁 .env.local 回落——该键驱动 " +
        "seed-db TRUNCATE 全量重灌，回落会误伤真库）。gate/.env.test 通道会注入；" +
        "本地裸跑必须显式 export。",
    );
  return dbUrl;
};

/** env 读取：process.env 优先（gate 注入），回落 sibling .env.local；两头皆无 fail-fast。 */
const readKey = (key: string): string => {
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;
  const line = readFileSync(NEXTJS_ENV_FILE, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  if (!line)
    throw new Error(
      `fail-fast: ${key} 未在 process.env / ${NEXTJS_ENV_FILE} 声明（禁兜底，ADR-0019）`,
    );
  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");
};

/** /api/health 健康探针：200 且 body.status==="ok" 才算过。 */
async function healthOk(timeoutMs = 5_000): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    const body = (await res.json().catch(() => null)) as { status?: string } | null;
    return body?.status === "ok";
  } catch {
    return false;
  }
}

/** 轮询直至 deadline（毫秒），每秒一次。 */
async function waitFor(fn: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  return fn();
}

/**
 * HS256 JWT 三段式手拼（无 jose 依赖）：header.payload.signature，
 * base64url 无 padding，与 saas-nextjs src/lib/jwt.ts JwtClaims 形状一致。
 */
function signHs256Jwt(
  secret: string,
  claims: { sub: string; tenant_id: string; iss: string; aud: string; iat: number; exp: number },
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

/**
 * 库身份探针：往 DATABASE_URL 指向的库插一行探针菜单（title 随机），
 * 再看 :5101 的 /api/v1/clients/lab-management/menus 能否读到它。
 * 读不到 = 服务连的不是目标库（如常驻 dev 进程还挂在 saas_dev 上）。
 */
async function serverServesTargetDb(
  pgModule: {
    Client: new (opts: { connectionString: string }) => {
      connect: () => Promise<void>;
      query: (sql: string, vals: unknown[]) => Promise<{ rowCount: number | null }>;
      end: () => Promise<void>;
    };
  },
  dbUrl: string,
  token: string,
): Promise<{ ok: boolean; detail: string }> {
  const markerTitle = `__vue_probe_${randomUUID().slice(0, 8)}__`;
  const client = new pgModule.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO sys_menu (id, client_id, parent_id, title, type, path, sort_order, status, created_at)
       VALUES ($1, 'lab-management', '00000000-0000-0000-0000-000000000000', $2, 2, null, 0, 1, now())`,
      [randomUUID(), markerTitle],
    );
    try {
      const res = await fetch(`${BASE}/api/v1/clients/lab-management/menus`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return { ok: false, detail: `menus 探针 HTTP ${res.status}` };
      const menus = (await res.json()) as Array<{ title?: string }>;
      const visible = menus.some((m) => m.title === markerTitle);
      return visible
        ? { ok: true, detail: "服务与目标库同源" }
        : { ok: false, detail: "探针菜单在目标库但服务读不到（:5101 连的是别的库）" };
    } finally {
      await client.query(`DELETE FROM sys_menu WHERE title = $1`, [markerTitle]);
    }
  } finally {
    await client.end();
  }
}

export default async function ({
  provide,
}: {
  provide: (key: string, value: unknown) => void;
}): Promise<void> {
  const dbUrl = readDbUrl();

  // 1. 种子（saas 语义：TRUNCATE 后全量重灌——配置型数据全量重灌才是正确幂等，
  //    见 shared/scripts/seed-db.mjs 头注；连 nextjs 同一库，seeds/*.json 是权威源）
  console.log("[global-setup] 1/5 灌种子（shared/scripts/seed-db.mjs → 目标库）…");
  execSync("node scripts/seed-db.mjs", {
    cwd: SHARED,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  // 2. nextjs :5101——已健康则复用（dev 调试现场），否则拉起 own 进程
  let selfSpawned = false;
  if (!(await healthOk())) {
    console.log("[global-setup] 2/5 :5101 不健康，拉起 own nextjs dev 进程…");
    selfSpawned = true;
    const child = spawn("npm", ["run", "dev"], {
      cwd: NEXTJS,
      stdio: "ignore",
      env: { ...process.env, DATABASE_URL: dbUrl },
      shell: true,
      detached: true,
    });
    if (child.pid) {
      writeFileSync(resolve(tmpdir(), "saas-vue-test-nextjs.pid"), String(child.pid));
    }
    if (!(await waitFor(healthOk, 120_000))) {
      throw new Error(`fail-fast: nextjs :5101 /api/health 探活超时（PID ${child.pid ?? "?"}）`);
    }
  } else {
    console.log("[global-setup] 2/5 :5101 已健康，复用现有进程（不重启不杀树）");
  }

  // 3. 铸真 JWT（HS256；sub/tenant_id 锚 shared 种子行——tenant-scoped 端点靠
  //    tenant_id 与路径 :tenantId 比对放行）
  const tenantsSeed = JSON.parse(
    readFileSync(resolve(SHARED, "seeds/tenant.json"), "utf8"),
  ) as Array<{ id: string }>;
  const usersSeed = JSON.parse(
    readFileSync(resolve(SHARED, "seeds/sys_user.json"), "utf8"),
  ) as Array<{ id: string; username: string }>;
  const acme = tenantsSeed[0];
  const alice = usersSeed.find((u) => u.username === "alice");
  if (!acme || !alice) throw new Error("fail-fast: seeds 缺 acme/alice 行——种子契约漂移");

  const secretText = readKey("JWT_SIGNING_KEY");
  const issuer = readKey("JWT_ISSUER");
  const audience = readKey("JWT_AUDIENCE");
  const now = Math.floor(Date.now() / 1000);
  const token = signHs256Jwt(secretText, {
    sub: alice.id,
    tenant_id: acme.id,
    iss: issuer,
    aud: audience,
    iat: now,
    exp: now + 2 * 3600,
  });
  console.log("[global-setup] 3/5 真 JWT 铸造完成（sub=alice, tenant_id=acme，node:crypto HS256）");

  // 4. 真服务验签闭环（打真服务双探针）：
  //    a) GET /api/v1/me 带 Bearer → 200：服务端真 verifyToken 吃下铸 token；
  //    b) 无 Bearer → 401：guard 语义活着（ADR-0019 负探针）。
  const me = await fetch(`${BASE}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!me.ok) {
    throw new Error(
      `fail-fast: GET /api/v1/me 被拒（${me.status}）——JWT_SIGNING_KEY/JWT_ISSUER/JWT_AUDIENCE 与 ：5101 服务不一致`,
    );
  }
  const anon = await fetch(`${BASE}/api/v1/me`, { signal: AbortSignal.timeout(30_000) });
  if (anon.status !== 401) {
    throw new Error(
      `fail-fast: GET /api/v1/me 无 Bearer 期望 401（ADR-0019），实得 ${anon.status}——guard 语义漂移`,
    );
  }
  console.log("[global-setup] 4/5 真服务验签探针通过（/me 200 + 无 Bearer 401）");

  // 5. 库身份探针：健康 ≠ 连的是目标库。自拉进程必然同源；复用进程必须实证。
  const requireFromShared = createRequire(resolve(SHARED, "package.json"));
  const pgModule = requireFromShared("pg");
  const identity = await serverServesTargetDb(pgModule, dbUrl, token);
  if (!identity.ok) {
    throw new Error(
      `fail-fast: :5101 与 DATABASE_URL 目标库不同源（${identity.detail}）。` +
        `自拉进程=${selfSpawned}。请让 :5101 指向目标库或停掉它后重跑——` +
        `绝不顺着一个连别家库的服务跑测试。`,
    );
  }
  console.log(`[global-setup] 5/5 库身份探针通过（${identity.detail}）`);

  // 双通道供测试消费：provide()（vitest inject）+ process.env（forks pool 子进程继承）
  provide("TEST_TOKEN", token);
  process.env.TEST_TOKEN = token;
}
