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
  options: MountingOptions<any> = {},
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
        teleport: true,
      },
    },
  });
}