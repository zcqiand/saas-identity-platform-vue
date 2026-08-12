// M01.F01 — tenant-scoped 用户列表
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UserListPage from "../../src/pages/UserListPage.vue";

describe("M01.F01 用户管理（tenant-scoped）", () => {
  it("渲染用户列表，邀请按钮挂 data-fn=M01.F01.I02", () => {
    const wrapper = mount(UserListPage, { props: { tenantId: "abc" } });
    const btn = wrapper.find('[data-fn="M01.F01.I02"]');
    expect(btn.exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="user-row"]').length).toBeGreaterThan(0);
  });
});