// 面包屑 label map 防回潮（2026-09-21 终审 I-1）：路由段已从 users/apps 改齐为
// members/clients，app-shell.vue 的 SUB_PATH_LABEL 按路径段字面建键——键名漂移
// 就会把裸段字面（members/clients）直接渲染进面包屑。这里的断言锁住
// 「段 → 中文 label」映射，不许裸段回流。
//
// 注：不能走 mountWithProviders 的 initialRoute——它 push 不 await isReady，
// AppShell 首帧 route.path 仍是 "/"（menu-tree 直挂页面读 params 不受影响，
// 面包屑读整条 path 就漏了）。这里自建 router，push 后 await isReady 再挂载。
import { describe, it, expect } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import AppShell from "../../src/components/app/app-shell.vue";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function breadcrumbNavAt(path: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
  });
  router.push(path);
  await router.isReady();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = mount(AppShell, {
    global: {
      plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      stubs: { teleport: true },
    },
  });
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await nextTick();
  const nav = wrapper.find('nav[aria-label="breadcrumb"]');
  wrapper.unmount();
  return nav;
}

describe("面包屑 label map 防回潮", () => {
  it("/tenants/{id}/members 面包屑含「用户」，不含裸 members 段", async () => {
    const nav = await breadcrumbNavAt(`/tenants/${TENANT_ID}/members`);
    expect(nav.exists()).toBe(true);
    expect(nav.text()).toContain("用户");
    expect(nav.text()).not.toContain("members");
  });

  it("/tenants/{id}/applications 面包屑含「应用」，不含裸 applications 段", async () => {
    const nav = await breadcrumbNavAt(`/tenants/${TENANT_ID}/applications`);
    expect(nav.exists()).toBe(true);
    expect(nav.text()).toContain("应用");
    expect(nav.text()).not.toContain("applications");
  });

  it("/admin/clients 面包屑翻齐 admin/clients 两段（平台管理/应用）", async () => {
    const nav = await breadcrumbNavAt("/admin/clients");
    expect(nav.exists()).toBe(true);
    expect(nav.text()).toContain("平台管理");
    expect(nav.text()).toContain("应用");
    expect(nav.text()).not.toContain("clients");
  });

  it("/admin/clients/{code}/menus 面包屑含「菜单」，不含裸 menus 段", async () => {
    const nav = await breadcrumbNavAt(`/admin/clients/lab-management/menus`);
    expect(nav.exists()).toBe(true);
    expect(nav.text()).toContain("菜单");
    expect(nav.text()).not.toContain("menus");
  });
});
