# ch42 交付清单 — saas-identity-platform-vue 案例二

> 部署前自检：逐项核对，全部勾选后方可上线。

## 构建产物

- [ ] `npm run build` 通过（`vue-tsc` 类型检查 + `vite build` 产出 `dist/`）
- [ ] `dist/index.html` 存在，引用带 hash 的 `assets/*.js` / `assets/*.css`
- [ ] `dist/assets/` 下产物大小合理（首屏 gzip < 300KB）
- [ ] `__APP_VERSION__` 已通过 `vite.config.ts` 的 `define` 注入

## 环境变量

- [ ] `.env.example` 已提交，无真实密钥/Token
- [ ] 生产环境 `.env`（或 CI 注入）已配置 `VITE_API_BASE_URL` / `VITE_SSO_BASE_URL`
- [ ] `VITE_OFFLINE` 生产环境设为 `0`（关闭 MSW，走真实后端）
- [ ] `VITE_MOCK_JWT_SECRET` 仅 mock 层使用，生产不依赖

## Nginx 配置（deploy/nginx.conf）

- [ ] `root` 指向 dist 产物目录（如 `/var/www/frontend`）
- [ ] `try_files $uri $uri/ /index.html` 已配置（SPA history 回退）
- [ ] `/api/` 反向代理到后端（`backend:8080`）
- [ ] `/sso/` 反向代理到后端（SSO 授权服务器）
- [ ] `/assets/` 静态资源缓存 `1y` + `immutable`
- [ ] `index.html` 不缓存（`no-cache, no-store, must-revalidate`）
- [ ] gzip 已启用

## Vite dev 代理（vite.config.ts）

- [ ] `server.proxy['/api']` 指向开发后端
- [ ] `server.proxy['/sso']` 指向开发 SSO
- [ ] `changeOrigin: true`

## 全局错误处理

- [ ] `main.ts` 已调用 `installErrorHandler(app)`
- [ ] `app.config.errorHandler` 已注册，渲染错误被捕获
- [ ] `/api/vitals` 上报通道可送达（或 stub 静默不抛错）

## 多租户 / 认证 / RBAC（ch39-41 回归）

- [ ] 租户识别：URL 首段解析为 `X-Tenant-ID`，请求头注入生效
- [ ] 主题切换：CSS 变量随租户切换即时生效
- [ ] SSO 登录：跳转 `/sso/authorize` → 回调换 token → 写入 auth store
- [ ] 权限守卫：无权限路由重定向 `/403`；未登录重定向 `/login`
- [ ] `v-permission` 指令在模板中按权限码移除元素

## 上线后验证（冒烟）

- [ ] 访问 `/acme/dashboard` 不白屏
- [ ] 切换租户（`/globex/dashboard`）主题色变化
- [ ] 用户列表加载、关键词搜索、角色分配可操作
- [ ] 审计日志分页 + action 过滤生效
- [ ] 浏览器 console 无未捕获错误
