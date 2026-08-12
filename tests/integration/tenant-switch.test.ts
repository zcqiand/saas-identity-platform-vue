// M00.F02.I03 — 切换租户
import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import TenantSwitcher from "../../src/components/tenant-switcher.vue";

describe("M00.F02.I03 当前用户跨租户切换", () => {
  it("渲染 TenantSwitcher，下拉框挂 data-fn=M00.F02.I03", async () => {
    setActivePinia(createPinia());
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/tenants/:tenantId/users", component: { template: "<div/>" } }] });
    await router.push("/tenants/abc/users");
    await router.isReady();
    const wrapper = mount(TenantSwitcher, { global: { plugins: [router] } });
    await flushPromises();
    const select = wrapper.find('[data-fn="M00.F02.I03"]');
    expect(select.exists()).toBe(true);
  });
});