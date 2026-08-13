import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import App from "./App.vue";
import { router } from "./router";
import { installHttpClient } from "./api/http-client";
import { useTenantStore } from "./state/tenant-store";
import { useBackendStore } from "./state/backend-context";
import "./index.css";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  // 必须 Pinia installed 后才能 instantiate store（触发 lazy hydrate）
  // backend store 先实例化：hydrateBackendConfig 同步写模块级单例，axios 拦截器随后才拿得到正确 baseUrl
  useBackendStore();
  const tenantStore = useTenantStore();

  // 装 axios 拦截器：用 callback 形式取 token（避免循环依赖：tenant-store → http-client → tenant-store）
  installHttpClient(() => tenantStore.accessToken);

  // dev 模式启动 MSW worker（backend = "msw" 才启；切到真后端时不启）
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
