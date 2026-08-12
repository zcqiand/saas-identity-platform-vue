import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { enableMocking } = await import("./mocks/browser");
    await enableMocking();
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5_000 } },
  });
  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(VueQueryPlugin, { queryClient });
  app.mount("#app");
}

bootstrap();