#!/usr/bin/env node
/**
 * trace-parse.js — 解析 vitest JSON 输出，写入 .state/trace.json
 * 用法: node tests/trace-parse.js
 *
 * 与 React 仓的 fnReporter（vitest 插件）不同：
 * - React：vitest reporter 钩子实时落 trace.json
 * - Vue：跑完测试拿 JSON，node 脚本再解析（更简单，零 vitest 内部耦合）
 *
 * 两者契约等价：`.state/trace.json` 的 schema 1，tests 列表含 test/fns/inert。
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

const outFile = ".state/trace.json";

function parseFns(name) {
  const m = String(name).match(/\[fn:\s*([^\]]+)\]/);
  return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
}

try {
  const stdout = execSync("npx vitest run --reporter=json", {
    encoding: null,
    maxBuffer: 100 * 1024 * 1024,
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  // Find last } to extract JSON (handles any trailing text)
  const text = stdout.toString("utf8");
  const lastBrace = text.lastIndexOf("}");
  const jsonStr = text.substring(0, lastBrace + 1);
  const data = JSON.parse(jsonStr);

  const tests = [];
  for (const file of data.testResults ?? []) {
    for (const r of file.assertionResults ?? []) {
      const inert = r.status === "skipped" || r.status === "todo";
      const fullName = String(r.fullName ?? r.title ?? "");
      const testName = fullName.replace(/\s*\[fn:\s*[^\]]+\]/, "").trim();
      const fns = inert ? [] : parseFns(fullName);
      tests.push({ test: testName, fns, inert });
    }
  }

  mkdirSync(".state", { recursive: true });
  writeFileSync(outFile, JSON.stringify({ schema: 1, tests }, null, 2) + "\n");
  console.error(`trace-parse: wrote ${tests.length} entries → ${outFile}`);
} catch (err) {
  console.error("trace-parse error:", err.message);
  process.exit(1);
}
