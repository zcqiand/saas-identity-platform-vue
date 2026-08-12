// M03.F01.I01 — 账号密码登录
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginPage from "../../src/pages/LoginPage.vue";

describe("M03.F01.I01 账号密码登录", () => {
  it("渲染登录表单，挂 data-fn=M03.F01.I01 的提交按钮", async () => {
    setActivePinia(createPinia());
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/login", component: LoginPage }, { path: "/tenants", component: { template: "<div/>" } }] });
    await router.push("/login");
    await router.isReady();
    const wrapper = mount(LoginPage, { global: { plugins: [router] } });
    const btn = wrapper.find('[data-fn="M03.F01.I01"]');
    expect(btn.exists()).toBe(true);
  });
});