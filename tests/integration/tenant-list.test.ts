// M00.F01 — 平台级租户管理
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TenantListPage from "../../src/pages/TenantListPage.vue";

describe("M00.F01 租户管理（平台 admin）", () => {
  it("渲染租户列表，新建按钮挂 data-fn=M00.F01.I02", () => {
    const wrapper = mount(TenantListPage);
    const btn = wrapper.find('[data-fn="M00.F01.I02"]');
    expect(btn.exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="tenant-row"]').length).toBeGreaterThan(0);
  });
});