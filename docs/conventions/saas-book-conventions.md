# 书稿代码约定 — saas-identity-platform-vue

> 配合书稿 ch39-42 落地用的项目级编码约定。
> 通用 Vue/TS 性能/UI 惯例与本仓无关，参见 `.claude/skills/using-vue/`。

## 1. 双栈对照

| 维度 | React 仓 | Vue 仓（本仓） |
|---|---|---|
| 视图层 | 函数组件 + Hooks | `<script setup>` + Composables |
| 状态管理 | zustand | pinia（setup store 风格） |
| 跨组件上下文 | Context | `provide` / `inject` |
| 路由 | react-router-dom v7 | vue-router v4 |
| UI 底座 | shadcn/ui（`src/components/ui/`） | 自研 Tailwind 复合组件（`src/components/`） |
| 表单 | 受控 input + 组件内 state | `v-model` + `defineModel` |
| 权限指令 | `<PermissionGuard>` JSX 包裹 | `v-permission` 自定义指令 |

**双栈硬契约**：
- `src/types/*` 字段名与类型与 React 仓一致
- `mocks/handlers.ts` 与 React 仓等价
- 业务行为（CRUD、权限判定、状态机）一致
- 仅 UI 实现与组件 API 形态可不同

## 2. 目录结构

```text
src/
├── api/             # HTTP 客户端 + 拦截器
├── app/             # 应用级：错误处理、布局
├── components/      # 通用 UI 组件（AppSidebar / OrgTreeNode / 各种 Modal）
├── composables/     # 复用业务逻辑（useSso / useOAuth / usePermission / useTheme / useTable / useVirtualList）
├── directives/      # v-permission 等自定义指令
├── monitoring/      # Sentry / web-vitals 接入
├── router/          # 路由表（index.ts + dynamicRoutes.ts + nav.ts）
├── stores/          # pinia（tenant / auth / user / org / rbac / app / security）
├── types/           # 全局 TS 类型
└── views/           # 业务页面
mocks/               # MSW mock（与 React 仓 1:1）
tests/               # vitest 测试
```

## 3. 编码规则

- 所有 store 用 setup store 风格（`defineStore('xxx', () => { ... })`），不用 options store
- 所有 composable 用 `useXxx` 命名
- `defineProps` / `defineEmits` 必须用 type-only 声明
- `<script setup>` 是唯一允许的组件写法（不用 `defineComponent` 选项式）
- 业务类型放 `src/types/`，不放组件文件里
- 路由 path 用 kebab-case（`/platform/tenants`，不是 `/platform/Tenants`）
- vue-router 的 `name` 用 kebab-case（`platform-tenants`）
- 业务 ID（功能子项 ID）通过 `data-fn` 锚点暴露，详见 §4

## 4. 对齐测试（fnTest + trace-parse）

业务测试必须挂功能子项 ID，写法：

```ts
import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

it('[fn: M01.F01.I01] mount 后渲染「平台租户管理」标题', async () => {
  // ...
})
```

`[fn: ID1, ID2, ...]` 标记会由 `tests/trace-parse.js` 解析写入 `.state/trace.json`，
作为 L5 对齐矩阵的「测试 → 功能子项」映射来源。

**纪律**：
- skip/xit 的测试不要挂 ID
- 一个 it 通常挂 1-3 个 ID；超过 3 个通常说明测得太宽
- 接口 / 工具测试（与业务子项无直接关系）不挂 ID

## 5. MSW mock 规则

- `mocks/handlers.ts` 注册表**只增不改**（与 React 仓共享契约）
- 任何 handler URL、method、response shape 改动都需先在 React 仓对齐
- 新增 handler 必须配套：handler + db fixture + tests/mocks/handlers 测试

## 6. 版本约束

- 依赖与 `version-lock.json` 的 `version_lock` 严格一致
- 不引入 lock 外的库
- npm 镜像一律用 `registry.npmmirror.com`（项目 `package.json` 通过 `npm config` 注入，不进 npmrc）
