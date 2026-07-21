//
// bind-fns.mjs -- 给所有 tests/**/*.test.ts 业务测试加 [fn: ...] 标记
//
// 策略：
//   1. FILE_FNS 是手工兜底映射（覆盖一些不便自动推断的）
//   2. --auto 时，扫 src/ 下的 data-fn / @entry 锚点，解析 function-tree.md
//      建立 srcFile → I-ID 反向表；
//      再对每个 test 文件解析 import 语句，定位它测的 src 文件，
//      把那个 src 文件所属 Mxx.Fyy 的所有 I-ID 都挂到该测试上。
//   3. 合并模式：已有 [fn: ...] 块的会累加去重，重复跑安全。
//
// 纪律：
//   - skip/xit/it.skip/it.todo 不加（trace-parse 强制空）
//   - 跨仓对账测试（cross-impl-shape）不挂 ID
//   - 工具/契约测试不挂 ID
//
// 用法：node scripts/bind-fns.mjs [--dry-run] [--auto]
//
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const TESTS = join(ROOT, "tests");
const SRC = join(ROOT, "src");
const TREE = join(ROOT, "docs/functions/function-tree.md");
const DRY = process.argv.includes("--dry-run");
const AUTO = process.argv.includes("--auto");

/** 手工兜底：不便自动推断的（e2e、跨仓对账、tools、mocks 间接层） */
const FILE_FNS = {
  "api/client.test.ts":              ["M01.F01.I10"],
  "app/errorHandler.test.ts":        ["M01.F01.I10"],
  "components/AppSidebar.test.ts":   ["M01.F01.I08"],
  "components/OrgTreeNode.test.ts":  ["M02.F01.I08"],
  "components/RoleFormModal.test.ts":["M03.F01.I06"],
  "composables/usePermission.test.ts":["M03.F01.I09"],
  "composables/useTheme.test.ts":    ["M01.F02.I01", "M01.F02.I02"],
  "composables/useVirtualList.test.ts":["M05.F01.I01"],
  "directives/permission.test.ts":   ["M03.F01.I09"],
  "router/dynamicRoutes.test.ts":    ["M01.F01.I08"],
  "router/guard.test.ts":            ["M01.F01.I08", "M03.F01.I09"],
  "router/nav.test.ts":              ["M01.F01.I08"],
  "router/platformRoutes.test.ts":   ["M01.F01.I08"],
  "router/rbacGuard.test.ts":        ["M03.F01.I09"],
  "stores/auth.test.ts":             ["M01.F03.I01"],
  "stores/org.test.ts":              ["M02.F01.I01", "M02.F01.I07"],
  "stores/tenant.test.ts":           ["M01.F01.I10", "M01.F01.I11"],
  "stores/user.test.ts":             ["M02.F02.I01", "M02.F02.I08"],
  "types/rbac.test.ts":              ["M03.F01.I08"],
  "views/MenuPermissions.test.ts":   ["M03.F01.I07"],
  "views/PlatformConfigForm.test.ts":["M06.F08.I01"],
  "views/TenantLayout.test.ts":      ["M01.F01.I08"],
};

/** 不挂 ID 的文件 */
const SKIP_FILES = new Set([
  "cross-impl-shape.test.ts",
  "smoke.test.ts",
  "e2e-smoke.spec.ts",
]);

/** 不挂 ID 的 it 名字模式 */
const SKIP_PATTERNS = [/^_alignment_/];

/** 解析 function-tree.md：Mxx.Fyy → [Mxx.Fyy.I01, ...] */
function parseTree() {
  if (!existsSync(TREE)) return new Map();
  const src = readFileSync(TREE, "utf8");
  const itemsByFn = new Map();
  for (const line of src.split("\n")) {
    const m = /^\|\s*(M\d{2}\.F\d{2}\.I\d{2})\s*\|/.exec(line);
    if (m) {
      const fn = m[1].replace(/\.I\d{2}$/, "");
      if (!itemsByFn.has(fn)) itemsByFn.set(fn, []);
      itemsByFn.get(fn).push(m[1]);
    }
  }
  for (const arr of itemsByFn.values()) arr.sort();
  return itemsByFn;
}

/** 扫描 src/ 下 .vue/.ts 的 data-fn / @entry 锚点 */
function scanSrc() {
  const ENTRY_RE = /(?:data-fn\s*=\s*["']([^"']+)["']|@entry\s+(M\d{2}\.F\d{2}\.I\d{2}))/g;
  const out = new Map(); // absPath → Set<fid>
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (/\.(vue|ts)$/.test(name) && !name.endsWith(".d.ts")) {
        const text = readFileSync(p, "utf8");
        const set = new Set();
        for (const m of text.matchAll(ENTRY_RE)) {
          if (m[1]) set.add(m[1].split(/\s+/)[0]);
          else if (m[2]) set.add(m[2]);
        }
        if (set.size > 0) out.set(p, set);
      }
    }
  }
  walk(SRC);
  return out;
}

const itemsByFn = parseTree();
const srcEntries = AUTO ? scanSrc() : new Map();

/** 推断 testFile → I-IDs：解析 import 找源文件，源文件 entry 所属 Mxx.Fyy 下所有 I-ID */
function inferFromTest(testFile) {
  const text = readFileSync(testFile, "utf8");
  // 同时匹配 src/ 相对路径 和 @/ 别名（Vite 默认 @ → src/）
  const importRe = /from\s+['"](?:[^'"]*(?:src\/|@\/)[^'"]+)['"]/g;
  const out = new Set();
  for (const m of text.matchAll(importRe)) {
    // 提取 src/ 或 @/ 之后的路径
    let rel = m[0]
      .replace(/from\s+['"]/, "")
      .replace(/['"]$/, "")
      .replace(/.*?(?:src\/|@\/)/, "");
    if (rel.endsWith(".test.ts") || rel.endsWith(".spec.ts")) continue;
    // 在 srcEntries 里找匹配路径（兼容无扩展名 / .ts / .vue）
    let matched = null;
    const candidates = [rel, rel + ".ts", rel + ".vue", rel + "/index.ts", rel + "/index.vue"];
    for (const srcAbs of srcEntries.keys()) {
      for (const c of candidates) {
        if (srcAbs.endsWith(c) || srcAbs.endsWith(c.replace(/\//g, "\\"))) {
          matched = srcAbs;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched) {
      continue;
    }
    const ids = srcEntries.get(matched);
    for (const fid of ids) {
      const fn = fid.replace(/\.I\d{2}$/, "");
      for (const x of itemsByFn.get(fn) || []) out.add(x);
    }
  }
  return out;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(test|spec)\.ts$/.test(name)) out.push(p);
  }
  return out;
}

let changed = 0;
let unchanged = 0;
let inferred = 0;
let skipped = 0;
const fnTag = (fns) => ` [fn: ${fns.join(", ")}]`;

for (const file of walk(TESTS)) {
  const rel = relative(TESTS, file).replace(/\\/g, "/");
  if (SKIP_FILES.has(rel)) { skipped++; continue; }
  let fns = FILE_FNS[rel];
  if (!fns && AUTO) {
    const inf = inferFromTest(file);
    if (inf.size > 0) {
      fns = [...inf].sort();
      inferred++;
      console.log(`  ~ ${rel} -- auto-inferred ${fns.length} ids`);
    }
  }
  if (!fns) { skipped++; console.log(`  ? ${rel} — no mapping, skipped`); continue; }

  let src = readFileSync(file, "utf8");
  // 在每个 `it(`/`test(` 调用的字符串字面量末尾追加/合并 [fn: ...]。
  // 排除 skip/xit/it.todo/it.skip。\b 边界避免误伤 .only / .skip。
  const re = /(?<!\.)\b(it|test)\s*\(\s*(["'`])([^"'`]*?)\2/g;
  src = src.replace(re, (m, kw, q, name) => {
    if (SKIP_PATTERNS.some((p) => p.test(name))) return m;
    const existing = /^(.*?)\s*\[fn:\s*([^\]]+)\]\s*$/.exec(name);
    if (existing) {
      const base = existing[1];
      const oldFns = existing[2].split(",").map((s) => s.trim()).filter(Boolean);
      const merged = [...new Set([...oldFns, ...fns])];
      return `${kw}(${q}${base}${fnTag(merged)}${q}`;
    }
    return `${kw}(${q}${name}${fnTag(fns)}${q}`;
  });

  if (DRY) {
    console.log(`  [dry] ${rel}`);
  } else {
    writeFileSync(file, src);
    changed++;
  }
  unchanged++;
}

console.log(`\nbind-fns: ${changed} files changed, ${inferred} auto-inferred, ${skipped} skipped`);
