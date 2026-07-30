import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// 构建配置（dev/build/preview）。测试配置见 vitest.config.ts。
// env 模式与 saas-identity-platform/(React) 对齐：
// - VITE_* 前缀 = 浏览器可读
// - SAAS_* 无 VITE_ 前缀 = Node / 构建时读
//   （SAAS_API_PORT 给本仓 dev-server Hono；SAAS_API_BASE_URL 给 saas-vue vite proxy
//   指向真实后端——msw 拦截漏网的兜底。注意：之前硬编码 'backend' 主机名 ENOTFOUND 错误已修。）
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.SAAS_VITE_PORT ?? 5173),
    // ch42：dev 跨域代理（与生产 nginx 反代一致）。目标走 env SAAS_BACKEND_URL：dev 默认
    // localhost:8080；生产改 SAAS_BACKEND_URL=https://api.xiangru.uk。msw SW 同源先拦截 proxy。
    proxy: {
      // /api → dev-api（5174）+ 剥 /api 前缀，与 saas-React REF vite.config 对齐。
      // lab-vue 跨源打 /api/sso/authorize 等 → 剥成 /sso/authorize 命中 dev-api 路由。
      // （vite proxy 仅 dev 生效；生产由 nginx 反代到真后端。）
      '/api': {
        target: process.env.SAAS_API_BASE_URL ?? `http://localhost:${process.env.SAAS_API_PORT ?? 5174}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // ch42：MSW Service Worker 启动有竞争窗口，/api/vitals 可能漏到 proxy → ENOTFOUND。
        // 直接给 vite 返 204，浏览器 .catch(()=>{}) 静默。
        bypass: (req, res) => {
          if (req.url?.endsWith('/api/vitals')) {
            res.statusCode = 204
            res.end()
            return false
          }
          return undefined
        },
      },
      '/sso': {
        target: process.env.SAAS_API_BASE_URL ?? `http://localhost:${process.env.SAAS_API_PORT ?? 5174}`,
        changeOrigin: true,
      },
    },
  },
  define: {
    // ch42：生产构建时注入的应用版本号（import.meta.env 示例）
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
