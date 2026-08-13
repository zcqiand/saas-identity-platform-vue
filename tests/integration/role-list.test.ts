// M02.F01 — tenant-scoped 角色列表
import { describe, it, expect } from "vitest";
import { mountWithProviders } from "../helper";
import RoleListPage from "../../src/pages/RoleListPage.vue";

describe("M02.F01 角色权限（tenant-scoped）", () => {
  it("渲染角色列表，新建角色按钮挂 data-fn=M02.F01.I02", () => {
    const wrapper = mountWithProviders(RoleListPage, { props: { tenantId: "abc" } });
    expect(wrapper.find('[data-fn="M02.F01.I02"]').exists()).toBe(true);
  });
});
