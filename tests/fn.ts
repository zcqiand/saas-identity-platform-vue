/**
 * tests/fn.ts — 测试 ↔ 功能子项 ID 绑定工具（Vue 仓版）
 *
 * 业务测试挂功能子项 ID，suite 门禁据此做 L5 对齐矩阵。
 * 标签名 `[fn: ID1, ID2, ...]` 由 `tests/trace-parse.js` 解析，
 * 写入 `.state/trace.json`。
 *
 * 用法：
 *   import { it, expect } from 'vitest'
 *
 *   it('[fn: M01.F01.I01, M01.F01.I02] mount 后渲染列表与拉取数据', () => { ... })
 *
 * 纪律：
 *   - skip / xit 的测试不要挂 ID（trace-parse 强制空）
 *   - 一个 it 通常挂 1-3 个 ID；超过 3 个通常说明测得太宽
 *   - 与业务子项无直接关系的工具/契约测试不挂 ID
 *
 * 与 React 仓的 `fnTest`（vitest 扩展）不同：本仓走「测试名内联标签 +
 * JSON reporter 后处理」路线，契约等价，实现简单。
 */
export const FNS_NONE: readonly string[] = Object.freeze([])

/** 提取测试名中的 [fn: ...] 标签，返回 ID 列表（顺序保留，去重）。 */
export function extractFnIds(testName: string): string[] {
  const m = /\[fn:\s*([^\]]+)\]/.exec(testName)
  if (!m) return []
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
