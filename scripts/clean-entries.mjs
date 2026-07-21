//
// clean-entries.mjs -- 清掉 bind-entries 多次跑产生的重复 @entry 行
//
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SRC = join(ROOT, "src");
const DRY = process.argv.includes("--dry-run");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(vue|ts|tsx|js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const f of walk(SRC)) {
  const src = readFileSync(f, "utf8");
  // 收集所有 // @entry Mxx.Fyy.Izz 行，去重，保留首次出现位置
  const lines = src.split("\n");
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const m = /^\/\/ @entry (M\d{2}\.F\d{2}\.I\d{2})$/.exec(line);
    if (m) {
      if (seen.has(m[1])) continue; // 跳过重复
      seen.add(m[1]);
    }
    out.push(line);
  }
  // 把分散的 @entry 行合并到 <script setup> 之前
  // 先收集所有 @entry，按文件首部出现顺序
  const entryLines = [];
  const final = [];
  for (const line of out) {
    const m = /^\/\/ @entry (M\d{2}\.F\d{2}\.I\d{2})$/.exec(line);
    if (m) {
      if (!entryLines.includes(m[1])) entryLines.push(m[1]);
      continue;
    }
    final.push(line);
  }
  // 在 <script setup> 之前插入 @entry
  let res = final.join("\n");
  const commentBlock = entryLines.map((f) => `// @entry ${f}`).join("\n");
  if (entryLines.length > 0) {
    if (/^<script\s/m.test(res)) {
      res = res.replace(/^(<script\s)/m, `${commentBlock}\n$1`);
    } else if (/^import\s/m.test(res)) {
      res = res.replace(/^(import\s)/m, `${commentBlock}\n$1`);
    } else {
      res = `${commentBlock}\n${res}`;
    }
  }
  // 把 data-fn 简化为单 ID（取第一个有效 ID）
  res = res.replace(/data-fn="([^"]*)"/, (m, v) => {
    const first = v.split(/\s+/)[0];
    return `data-fn="${first}"`;
  });

  if (res !== src) {
    if (DRY) console.log(`[dry] ${f.relativeTo ? f.relativeTo(ROOT) : f}`);
    else writeFileSync(f, res);
    changed++;
  }
}
console.log(`clean-entries: ${changed} files${DRY ? " (dry-run)" : ""}`);
