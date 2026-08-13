// M06.F01 — 审计日志
import { describe, it, expect } from "vitest";
import { mountWithProviders } from "../helper";
import AuditListPage from "../../src/pages/AuditListPage.vue";

describe("M06.F01 审计日志（tenant-scoped）", () => {
  it("渲染审计列表，导出按钮挂 data-fn=M06.F01.I03", async () => {
    const wrapper = mountWithProviders(AuditListPage, {
      router: { initialRoute: "/tenants/abc/audit" },
    });
    // 等待一个 microtask 让 Vue Query 初始化
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-fn="M06.F01.I03"]').exists()).toBe(true);
  });
});
