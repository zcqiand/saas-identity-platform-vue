// M04.F01 — 平台级 OAuth 应用列表
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import OAuthAppListPage from "../../src/pages/OAuthAppListPage.vue";

describe("M04.F01 OAuth 应用（平台级）", () => {
  it("渲染应用列表，注册按钮挂 data-fn=M04.F01.I02", () => {
    const wrapper = mount(OAuthAppListPage);
    expect(wrapper.find('[data-fn="M04.F01.I02"]').exists()).toBe(true);
  });
});