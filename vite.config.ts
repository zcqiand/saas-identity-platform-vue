import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// 构建配置（dev/build/preview）。测试配置见 vitest.config.ts。
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // ch42：dev 跨域代理（与生产 nginx 反代一致）
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
      '/sso': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
  define: {
    // ch42：生产构建时注入的应用版本号（import.meta.env 示例）
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
