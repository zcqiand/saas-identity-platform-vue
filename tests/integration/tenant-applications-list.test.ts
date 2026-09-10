// M00.F05 — tenant-scoped 应用订阅列表
import { describe, it, expect } from "vitest";
import { mountWithProviders } from "../helper";
import TenantApplicationsListPage from "../../src/pages/TenantApplicationsListPage.vue";

describe("M00.F05 租户应用", () => {
  it("渲染订阅应用按钮挂 data-fn=M00.F05.I02", () => {
    const wrapper = mountWithProviders(TenantApplicationsListPage, {
      props: { tenantId: "abc" },
    });
    expect(wrapper.find('[data-fn="M00.F05.I02"]').exists()).toBe(true);
  });

  it("空列表显示 EmptyState", () => {
    const wrapper = mountWithProviders(TenantApplicationsListPage, {
      props: { tenantId: "abc" },
    });
    expect(wrapper.text()).toContain("还没有订阅应用");
  });
});
