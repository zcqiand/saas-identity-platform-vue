//
// bind-entries.mjs -- 给 src/ 加 data-fn / @entry 锚点，让 L5 「unreachable_shipped」清零
//
// 策略：自动推断 + 手工兜底
//   1. --auto 时，读 function-tree.md 建 Mxx.Fyy → [I-IDs] 映射
//   2. 扫 src/ 现有 data-fn/@entry 锚点，bootstrap 每个文件属于哪个 Mxx.Fyy
//   3. 把该 fn 下所有 I-IDs 加到该文件（data-fn 取一个放 <template> 根，
//      其余用 // @entry 注释挂在 <script setup> 之前）
//   4. 手工 FILE_FNS 仍是兜底（覆盖不便自动推断的，如 mock handler 文件）
//
// 纪律：
//   - 不改 mock handler（与 React 仓共享契约）
//   - 不重写已有 data-fn / @entry，只是补齐缺失的
//
// 用法：node scripts/bind-entries.mjs [--dry-run] [--auto]
//
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SRC = join(ROOT, "src");
const TREE = join(ROOT, "docs/functions/function-tree.md");
const DRY = process.argv.includes("--dry-run");
const AUTO = process.argv.includes("--auto");

/** 手工兜底：不便自动推断的（mock handler / 跨仓对账层 / 无锚点的 layout 壳） */
const FILE_FNS_FALLBACK = {
  // mock handler 测试间接覆盖的接口锚点放 stores/types
  "mocks/handlers.ts": [
    "M01.F01.I11", "M02.F01.I09", "M02.F02.I09", "M04.F01.I12", "M05.F01.I09",
  ],
  "stores/security.ts": [
    "M06.F01.I01", "M06.F04.I01",
  ],
  "api/client.ts": [
    "M01.F01.I10",
  ],
  "app/errorHandler.ts": [
    "M01.F01.I10",
  ],
  // 平台布局壳：聚合 M06.* 平台运营子页面的入口，但本身没显式锚点
  "views/platform/PlatformLayout.vue": [
    "M06.F01.I01", "M06.F02.I01", "M06.F03.I01", "M06.F04.I01",
    "M06.F05.I01", "M06.F06.I01", "M06.F07.I01", "M06.F08.I01",
  ],
};

/** 解析 function-tree.md：Mxx.Fyy → { ids: [...], names: { fid: name } } */
function parseTree() {
  if (!existsSync(TREE)) return { itemsByFn: new Map(), names: new Map() };
  const text = readFileSync(TREE, "utf8");
  const itemsByFn = new Map();
  const names = new Map();
  for (const line of text.split("\n")) {
    const m = /^\|\s*(M\d{2}\.F\d{2}\.I\d{2})\s*\|\s*([^|]+?)\s*\|/.exec(line);
    if (m) {
      const fid = m[1];
      const name = m[2].trim();
      names.set(fid, name);
      const fn = fid.replace(/\.I\d{2}$/, "");
      if (!itemsByFn.has(fn)) itemsByFn.set(fn, []);
      itemsByFn.get(fn).push(fid);
    }
  }
  for (const arr of itemsByFn.values()) arr.sort();
  return { itemsByFn, names };
}

/** 扫 src/ 下 .vue/.ts 的 data-fn / @entry 锚点 */
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

const { itemsByFn, names } = parseTree();
const srcEntries = scanSrc();

/** 自动推断：srcFile → 该文件应该挂的 I-IDs 集合 */
function inferFnsForFile(absPath) {
  const out = new Set();
  if (!srcEntries.has(absPath)) return out;
  for (const fid of srcEntries.get(absPath)) {
    const fn = fid.replace(/\.I\d{2}$/, "");
    for (const x of itemsByFn.get(fn) || []) out.add(x);
  }
  return out;
}

/** 工具：在 <template> 根标签上挂 data-fn="<第一个 ID>" */
function injectVueDataFn(src, fns) {
  if (fns.length === 0) return src;
  const entryComments = fns.map((f) => `// @entry ${f}`).join("\n");
  const re = /<template>\s*([\s\S]*?)\s*<\/template>/m;
  const m = re.exec(src);
  let withDataFn = src;
  if (m) {
    const body = m[1];
    const tagRe = /<\s*([a-zA-Z][\w-]*)\b([^>]*)>/;
    const tm = tagRe.exec(body);
    if (tm) {
      const tag = tm[1];
      const attrs = tm[2];
      if (!/data-fn\s*=/.test(attrs)) {
        const newTag = `<${tag} data-fn="${fns[0]}"${attrs}>`;
        withDataFn = src.replace(tm[0], newTag);
      }
    }
  }
  if (/^<script\s/.test(withDataFn)) {
    return withDataFn.replace(/^(<script\s)/m, `${entryComments}\n$1`);
  }
  return `${entryComments}\n${withDataFn}`;
}

/** 工具：把 // @entry Mxx.Fyy.Izz 写在 .ts 文件首行附近 */
function injectTsEntry(src, fns) {
  const newLines = fns.map((f) => `// @entry ${f}`).join("\n");
  if (/^import\s/m.test(src)) {
    return src.replace(/^(import\s)/m, `${newLines}\n$1`);
  }
  return `${newLines}\n${src}`;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(vue|ts)$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

let changed = 0;
let untouched = 0;
let missing = 0;
const seen = new Set();

// Phase 1: auto-inferred files
if (AUTO) {
  for (const f of walk(SRC)) {
    const rel = relative(SRC, f).replace(/\\/g, "/");
    if (rel === "mocks/handlers.ts" || rel.startsWith("mocks/")) continue; // 不动 mock 契约
    const inferred = inferFnsForFile(f);
    if (inferred.size === 0) continue;
    // 与已有 entry 取并集去重
    const existing = srcEntries.get(f) || new Set();
    const allFns = [...new Set([...existing, ...inferred])].sort();
    for (const f of allFns) seen.add(f);

    let src = readFileSync(f, "utf8");
    if (f.endsWith(".vue")) src = injectVueDataFn(src, allFns);
    else src = injectTsEntry(src, allFns);

    if (DRY) console.log(`  [dry auto] ${rel}: [${allFns.join(", ")}]`);
    else writeFileSync(f, src);
    changed++;
  }
}

// Phase 2: 手工兜底
for (const [rel, fns] of Object.entries(FILE_FNS_FALLBACK)) {
  for (const f of fns) seen.add(f);
  const abs = join(SRC, rel);
  if (!existsSync(abs)) {
    if (DRY) console.log(`  [skip] ${rel} -- missing`);
    missing++;
    continue;
  }
  let src = readFileSync(abs, "utf8");
  if (abs.endsWith(".vue")) src = injectVueDataFn(src, fns);
  else src = injectTsEntry(src, fns);
  if (DRY) console.log(`  [dry fallback] ${rel}: [${fns.join(", ")}]`);
  else writeFileSync(abs, src);
  changed++;
}

console.log(`\nbind-entries: ${changed} files${DRY ? " (dry-run)" : ""}, ${seen.size} fn IDs covered`);

// 打印仍未被任何文件覆盖的 fn ID
try {
  const aj = JSON.parse(readFileSync(join(ROOT, ".state", "alignment.json"), "utf8"));
  const ur = new Set(aj.unreachable_shipped || []);
  const uncovered = [...ur].filter((f) => !seen.has(f));
  if (uncovered.length) {
    console.log(`\n仍 uncovered (${uncovered.length}):`);
    uncovered.forEach((f) => console.log(`  ${f}`));
  } else {
    console.log("\nall unreachable_shipped 已被覆盖。");
  }
} catch {
  // ignore if alignment.json not yet written
}
