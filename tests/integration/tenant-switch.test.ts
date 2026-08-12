// M00.F02.I03 — 切换租户
import { describe, it, expect } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mountWithProviders } from "../helper";
import TenantSwitcher from "../../src/components/tenant-switcher.vue";

describe("M00.F02.I03 当前用户跨租户切换", () => {
  it("渲染 TenantSwitcher，下拉框挂 data-fn=M00.F02.I03", async () => {
    const wrapper = mountWithProviders(TenantSwitcher);
    await flushPromises();
    const select = wrapper.find('[data-fn="M00.F02.I03"]');
    expect(select.exists()).toBe(true);
  });
});