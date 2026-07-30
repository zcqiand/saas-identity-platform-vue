/**
 * dev-server/server.ts
 *
 * saas-vue 仓内 dev-only 真后端：把 ch40 4 条 auth 端点落到 Node 端口。
 * 让 saas-vue 自家 vite (5173) 跨进程请求能命中 dev-server（5174/其他）；
 * 浏览器侧 msw Service Worker 不能跨 origin 拦截——所以 dev 用真 HTTP 后端。
 *
 * 启动：npm run dev （concurrently -k 启 vite + tsx dev-server）
 * 配合：saas-vue/vite.config.ts 的 server.proxy['/api'] → http://localhost:$SAAS_API_PORT
 *
 * 端口 + CORS 配置走 env：
 * - SAAS_API_PORT        dev-api 监听端口（默认 5174）
 * - SAAS_VITE_PORT       vite dev 端口（仅 CORS 同步参考，默认 5173）
 * - SAAS_ALLOWED_ORIGINS 生产 / staging 跨域追加（逗号分隔）
 *
 * 设计模式：与 saas-identity-platform（React）/dev-server/server.ts 同构（hono + cors）。
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import {
  handleSsoAuthorize,
  handleOAuthCallback,
  handleOAuthCallbackFromBody,
  handleAuthPermissions,
  handleGetMenus,
} from './authHandlers'

const app = new Hono()

// CORS：默认白名单 saas-vue dev 实际可能用到的所有端口（vite 端口被占会 +1 漂移）。
// 全部 localhost:5173-5180 已硬列白名单，避免改 CORS；生产 / staging 域名通过 env 追加。
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
]
const PROD_ORIGINS = (process.env.SAAS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const ALLOWED_ORIGINS = [...DEV_ORIGINS, ...PROD_ORIGINS]
app.use(
  '*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ch40 4 条 auth 端点
// 注意：Handler 接受 Request 但 c.req.raw.body 流被 Hono 解析后已耗尽；
// callback 路径直接用 Hono context 的 c.req.json() 拿 body，避免重复读 raw。
app.get('/sso/authorize', (c) => handleSsoAuthorize(c.req.raw))
app.post('/auth/oauth/callback', async (c) => {
  // 注意：handler 已返回 Web Fetch Response 对象；直接转发，不要再用 c.json() 二次包装
  // （否则会按空对象 {} 序列化）。
  const body = await c.req.json().catch(() => ({}))
  return handleOAuthCallbackFromBody(body as Parameters<typeof handleOAuthCallbackFromBody>[0])
})
app.get('/auth/permissions', (c) => handleAuthPermissions(c.req.raw))
app.get('/menus', (c) => handleGetMenus(c.req.raw))

// health
app.get('/health', (c) => c.json({ ok: true }))

const PORT = Number(process.env.SAAS_API_PORT ?? 5174)
serve({ fetch: app.fetch, port: PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[saas-vue dev-api] listening on http://localhost:${info.port}`)
  // eslint-disable-next-line no-console
  console.log(`[saas-vue dev-api] CORS allowed: ${ALLOWED_ORIGINS.join(', ')}`)
})
