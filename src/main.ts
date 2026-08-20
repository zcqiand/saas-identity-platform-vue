import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import App from "./App.vue";
import { router } from "./router";
import { installHttpClient } from "./api/http-client";
import { useTenantStore } from "./state/tenant-store";
import "./index.css";

// ADR-0014：运行时不再切后端；MSW 是否启用走 VITE_ENABLE_MSW（部署期 env）。
async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  const tenantStore = useTenantStore();

  // 装 axios 拦截器：用 callback 形式取 token（避免循环依赖：tenant-store → http-client → tenant-store）
  installHttpClient(() => tenantStore.accessToken);

  // dev 模式启动 MSW worker（VITE_ENABLE_MSW=false 时跳过；走 VITE_API_BASE_URL 真后端）
  if (import.meta.env.DEV) {
    const { enableMocking } = await import("./mocks/browser");
    await enableMocking();
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5_000 } },
  });
  app.use(VueQueryPlugin, { queryClient });
  app.use(router);
  app.mount("#app");
}

bootstrap();