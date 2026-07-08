// ch42 应用入口：创建 app → 安装 errorHandler + Pinia + Router → 启动 MSW（dev）→ 挂载
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter, routeModuleLoaders } from './router'
import { installErrorHandler } from './app/errorHandler'
import { permissionDirective } from './directives/permission'
import { initMonitoring } from './monitoring'
import './index.css'

async function enableMockWorker(): Promise<void> {
  // 仅 dev 启动 MSW；生产构建中 import.meta.env.DEV 为 false，整段被静态消除
  if (!import.meta.env.DEV) return
  if (import.meta.env.VITE_OFFLINE === '0') return
  // 关键：在 MSW 注册 Service Worker 之前，预加载全部路由组件模块。
  // MSW 的 SW 会拦截 /src/* 的动态导入并返回 404（passthrough bug），导致懒加载路由（岗位/权限组/审计…）白屏。
  // 先把这些模块拉进浏览器缓存，之后导航不再发起模块请求，从而绕开 SW 拦截。
  await Promise.all(Object.values(routeModuleLoaders).map((load) => load()))
  const { worker } = await import('../mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

enableMockWorker().finally(() => {
  const app = createApp(App)
  app.use(createPinia())
  app.use(createAppRouter())
  app.directive('permission', permissionDirective)
  // ch42：全局错误捕获 + 上报 stub
  installErrorHandler(app)
  app.mount('#app')
  // ch42：Sentry + Web Vitals 监控（DSN 为空时 no-op）
  initMonitoring()
})
