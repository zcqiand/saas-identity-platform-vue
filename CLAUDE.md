# saas-identity-platform-vue

> Vue 3.5 + Vite + Pinia + Vue Query + shadcn-vue。消费 shared 仓 TypeSpec codegen 产物。

## 1. 这是什么

saas-identity-platform 的 Vue 前端。结构与 react 仓 1:1 对称。

## 2. 禁止事项

- 禁止 zod 手写 schema
- 禁止 Options API；一律 `<script setup lang="ts">`
- 禁止在组件里直接 fetch

## 3. 指向别处

- shared 仓：`../saas-identity-platform-shared`
- function-tree：`docs/functions/function-tree.md`

## 4. 工作循环

1. 改 UI（`src/pages/<module>/*.vue`）
2. `npm run gen:shared`
3. `python scripts/gate.py -p saas-identity-platform-vue`
