// M03.F01.I01 - 账号密码登录 (PLAN-2026-001 T-8)
//
// 策略：mock `useAuthLogin`（orval mutation）与 vue-sonner toast，
// 验证表单提交 -> POST /auth/login 参数、错误提示（401 / 423 锁定）、
// 成功后写 tenant-store + 跳 /tenants。
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mountWithProviders } from "../helper";
import LoginPage from "../../src/pages/LoginPage.vue";
import { ApiError } from "../../src/api/http-client";
import { useTenantStore } from "../../src/state/tenant-store";

// mock orval mutation：mutateAsync / isPending 可控。
// isPending 用普通 { value } 对象（vi.hoisted 执行先于 import，
// 不能在里面调 ref() - 会撞 TDZ）
const { loginMut } = vi.hoisted(() => {
  return { loginMut: { mutateAsync: vi.fn(), isPending: { value: false } } };
});
vi.mock("../../src/api/endpoints/endpoints", () => ({
  // 只 mock 登录 mutation；tenant-store 引用的 useAdminTenants* 仅在
  // 函数体内惰性调用，模块加载期缺省无碍
  useAuthLogin: () => loginMut,
}));

// mock toast：捕获 toast.error 的文案
const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("vue-sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof mountWithProviders>>) {
  await wrapper.find('input[id="username"]').setValue("alice");
  await wrapper.find('input[id="password"]').setValue("dev123456");
  await wrapper.find("form").trigger("submit");
}

describe("M03.F01.I01 账号密码登录", () => {
  beforeEach(() => {
    loginMut.mutateAsync.mockReset();
    toastError.mockReset();
    // beforeEach 阶段还没有 mount -> 先给个独立 pinia 让 store 可用
    setActivePinia(createPinia());
    useTenantStore().logout();
    localStorage.removeItem("saas.tenant");
  });

  it("渲染登录表单，挂 data-fn=M03.F01.I01 的提交按钮", () => {
    const wrapper = mountWithProviders(LoginPage);
    const btn = wrapper.find('[data-fn="M03.F01.I01"]');
    expect(btn.exists()).toBe(true);
  });

  it("提交 username/password -> POST /auth/login（mutation 参数一致）", async () => {
    loginMut.mutateAsync.mockResolvedValue({
      data: {
        accessToken: "at-1",
        refreshToken: "rt-1",
        userId: "u-1",
        currentTenantId: "t-1",
      },
    });
    const wrapper = mountWithProviders(LoginPage);
    await fillAndSubmit(wrapper);
    expect(loginMut.mutateAsync).toHaveBeenCalledWith({
      data: { username: "alice", password: "dev123456" },
    });
  });

  it("错密码（401）-> toast 显示用户名或密码错误", async () => {
    loginMut.mutateAsync.mockRejectedValue(new ApiError(401, null, "invalid credentials"));
    const wrapper = mountWithProviders(LoginPage);
    await fillAndSubmit(wrapper);
    await vi.waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("用户名或密码错误");
  });

  it("账号锁定（423）-> toast 显示锁定提示", async () => {
    loginMut.mutateAsync.mockRejectedValue(
      new ApiError(423, { code: "ACCOUNT_LOCKED" }, "account locked"),
    );
    const wrapper = mountWithProviders(LoginPage);
    await fillAndSubmit(wrapper);
    await vi.waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(String(toastError.mock.calls[0]?.[0])).toContain("锁定");
  });

  it("登录成功 -> tenant-store 写 session + 跳 /tenants", async () => {
    loginMut.mutateAsync.mockResolvedValue({
      data: {
        accessToken: "at-1",
        refreshToken: "rt-1",
        userId: "u-1",
        currentTenantId: "t-1",
      },
    });
    const wrapper = mountWithProviders(LoginPage);
    await fillAndSubmit(wrapper);
    await vi.waitFor(() => {
      expect(wrapper.vm.$router.currentRoute.value.path).toBe("/tenants");
    });
    const store = useTenantStore();
    expect(store.accessToken).toBe("at-1");
    expect(store.currentTenantId).toBe("t-1");
  });
});
