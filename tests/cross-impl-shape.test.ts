// 端到端对比：同一 API 在两仓的响应形状是否完全一致
//
// Phase 5d (saas-vue full migration to shared v0.3.0.1) 重写后：
//   - Vue 仓与 React 仓共用 @saas/identity-platform-shared 作为 seed 真理源
//   - 字段 shape 由 shared schemas/* 强保证（zod），已不需要 mock 层字符串扫
//   - 实际 hard 验证在每个 mocks/*.test.ts 与 types/*.test.ts 中通过 expect 字段名断言
//
// 因此，本文件的「Vue 仓 db.ts 字符串扫 React 仓字段」方法失效（mocks/db.ts
// 现在是 `import { APPS } from '@saas/identity-platform-shared/seeds'`，不再
// 持有字段字面量）。本 suite 整体废弃，但保留为 suite-level skip 占位：
// - 后续跨仓对账应改走「同 shared seed」比对（不需要 mock 层字段扫）。
// - 若仍需要，可改为解析 shared schemas/*.ts 的 zod key 集。
import { describe, it } from 'vitest'

describe.skip('cross-impl — saas-identity-platform-vue vs saas-identity-platform (React) field parity (Phase 5d 废弃)', () => {
  it.skip('Phase 5d 已废弃：Vue/React 仓 mock 层均由 shared seeds 派生，cross-impl shape 不再适用字符串扫', () => {})
})
