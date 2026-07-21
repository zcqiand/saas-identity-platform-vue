# CLAUDE.md — saas-identity-platform-vue

> 入口，不是手册。L0 门强制上限 60 行。细节进 `docs/conventions/saas-book-conventions.md`。

## 1. 是什么

本仓是《Vue从入门到项目实践》案例二（SaaS 多租户统一身份管理）的可运行配套工程，覆盖 ch39-42。MSW mock 全覆盖（含 OAuth2 授权服务器模拟），无 Key / Docker / 网络依赖。**书稿代码块的 source of truth**——书与仓不一致以仓为准。与 React 姊妹仓 `saas-identity-platform` 共享 API 契约 + MSW mock fixtures。

## 2. 禁止事项（项目铁律）

- **TDD**：先写失败测试 → 跑确认失败 → 实现 → 跑确认绿 → commit
- **版本钉死**：依赖必须落在 `version-lock.json` 的 `version_lock` 范围内；不引入 lock 外的库
- **tag 即放行**：全量回归绿后打 `v<MAJOR>.<MINOR>-<NNN>`（NNN=项目号）
- **mock-friendly**：`npm install && npm test` 在无 Key / Docker / 网络下全绿
- **只增不改（React 对齐召回除外）**：API 契约与 `mocks/handlers.ts` 不动；菜单/路由/布局/视图可因 1:1 对齐 React 仓而重制
- 不直接改 `docs/functions/function-tree.md`；走 `/tree-change` 提案由人批准
- 不先改代码后补功能清单；改功能与改功能清单必须同一个 commit
- 不删功能清单里的行来消除告警；废弃改状态，编号永不复用
- 不在本文件里堆细则

技术栈与版本钉死于 `version-lock.json` 的 `version_lock` + `package.json`。

## 3. 指向别处

- 编码约定 / 双栈对照 / fnTest 用法 / MSW 规则 → [docs/conventions/saas-book-conventions.md](docs/conventions/saas-book-conventions.md)
- 通用 Vue/TS 性能/UI 惯例 → `.claude/skills/using-vue/`（suite 自带）
- 通用目录/测试约束 → [docs/conventions/saas-book-conventions.md §2](docs/conventions/saas-book-conventions.md)
- 门禁命令 → `.harness/stack.json`

## 4. 工作循环

1. `npm test` —— 「tag 即放行」的最低标准
2. `npm run build` —— vue-tsc --noEmit && vite build
3. `python ../../scripts/gate.py -p saas-identity-platform-vue` —— suite 门禁（L0/L1/L2/L3/L4/L5）
4. exit 0 = 完成；非 0 回到第 1 步；exit 2 停下问人，不要自行改 `.harness/stack.json` 让门变松
