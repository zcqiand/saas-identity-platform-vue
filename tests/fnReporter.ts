/**
 * vitest 2.x 自定义 reporter：把 task.meta.fn 落成 .state/trace.json。
 *
 * 与 React 姊妹仓的 fnReporter 同思路（vitest 插件），但走 vitest 2 的
 * onFinished 接口而不是 v3+ 的 onTestRunEnd（避免 API 漂移）。
 *
 * 用法（在 vitest.config.ts 里加）：
 *   import FnReporter from './tests/fnReporter'
 *   reporters: ['default', new FnReporter()],
 *
 * 触发条件（避免每次测试都写盘）：
 *   仅当 env.TRACE_MAP === '1' 时才落 trace.json。
 *   `.harness/stack.json` 的 trace_env 控制。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

interface TraceEntry {
  test: string;
  fns: string[];
  inert: boolean;
}

interface LegacyTask {
  type: string;
  name: string;
  mode?: string;
  meta?: { fn?: string[] };
  result?: { state?: string };
  tasks?: LegacyTask[];
}

interface LegacyFile {
  filepath: string;
  tasks: LegacyTask[];
}

function clean(fns: unknown, inert: boolean): string[] {
  if (inert || !Array.isArray(fns)) return [];
  return [...new Set(fns.map(String))].sort();
}

function walk(tasks: LegacyTask[], out: TraceEntry[]): void {
  for (const t of tasks) {
    if (t.type === "test" || t.type === "it") {
      const state = t.result?.state ?? "unknown";
      const inert = state === "skip" || state === "skipped" || state === "todo";
      const fullName = t.name; // 简化：vitest 2 的 onFinished 给出的是 task 自带 name
      out.push({ test: fullName, fns: clean(t.meta?.fn, inert), inert });
    }
    if (t.tasks) walk(t.tasks, out);
  }
}

function emit(tests: TraceEntry[]): void {
  const out = ".state/trace.json";
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ schema: 1, tests }, null, 2) + "\n");
}

export default class FnReporter {
  enabled = process.env.TRACE_MAP === "1";

  onFinished(files: LegacyFile[] | unknown): void {
    if (!this.enabled) return;
    const out: TraceEntry[] = [];
    if (Array.isArray(files)) {
      for (const f of files) {
        if (f && Array.isArray(f.tasks)) walk(f.tasks, out);
      }
    }
    emit(out);
  }
}
