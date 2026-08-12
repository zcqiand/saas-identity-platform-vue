// M03.F01.I01 — 账号密码登录
import { describe, it, expect } from "vitest";
import { mountWithProviders } from "../helper";
import LoginPage from "../../src/pages/LoginPage.vue";

describe("M03.F01.I01 账号密码登录", () => {
  it("渲染登录表单，挂 data-fn=M03.F01.I01 的提交按钮", () => {
    const wrapper = mountWithProviders(LoginPage);
    const btn = wrapper.find('[data-fn="M03.F01.I01"]');
    expect(btn.exists()).toBe(true);
  });
});