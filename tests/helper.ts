// tests/helper.ts — mount components with Pinia + VueQueryPlugin + Router
//
// v0.2.0 收尾：vue page 直接调 `useXxx` hooks，需要 vue-query QueryClient；
// 这里提供统一 helper 避免每个测试重复。
import { mount, type MountingOptions } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import type { Component } from "vue";

export function mountWithProviders(
  component: Component,
  options: MountingOptions<any> & { router?: { initialRoute?: string } } = {},
) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // If initialRoute is provided, push before mount
  if (options.router?.initialRoute) {
    router.push(options.router.initialRoute).catch(() => {});
  }

  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [
        pinia,
        router,
        [VueQueryPlugin, { queryClient }],
        ...(options.global?.plugins ?? []),
      ],
      stubs: {
        ...(options.global?.stubs ?? {}),
        // 默认 stub Teleport（断言不依赖 document.body）；需要断言 portal 内容的
        // 用例显式传 stubs: { teleport: false } 覆盖（2026-09-12 登录页后端切换器）
        // （VTU 的 Stubs 类型没收录 'teleport' 字面键，这里过 Record 断言）
        teleport:
          (options.global?.stubs as Record<string, boolean | undefined> | undefined)
            ?.teleport ?? true,
      },
    },
  });
}
