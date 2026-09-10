// M01.F04.I03 - 账号密码登录 (PLAN-2026-001 T-8)
//
// 策略：mock `useSessionsLogin`（orval mutation）与 vue-sonner toast，
// 验证表单提交 -> POST /auth/login 参数、错误提示（401 / 423 锁定）、
// 成功后写 tenant-store + 跳 /tenants。
//
// OAuth 2.0 授权码回跳（RFC 6749 §4.1.2，镜像 saas-nextjs app/login）：
// lab 后端 pre-code 后把浏览器送到 /login?code=&redirect_uri=&state=，
// 登录成功后 302 redirect_uri?code&state 回 RP；无参数时行为不变。
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mountWithProviders } from "../helper";
import LoginPage from "../../src/pages/LoginPage.vue";
import { ApiError } from "../../src/api/http-client";
import { useTenantStore } from "../../src/state/tenant-store";

// mock orval mutation：mutateAsync / isPending 可控。
// isPending 用普通 { value } 对象（vi.hoisted 执行先于 import，
// 不能在里面调 ref() - 会撞 TDZ）
const { loginMut, authorizeMut } = vi.hoisted(() => {
  return {
    loginMut: { mutateAsync: vi.fn(), isPending: { value: false } },
    authorizeMut: { mutateAsync: vi.fn(), isPending: { value: false } },
  };
});
// 2026-09-09 L4 收尾: LoginPage 实际 import 路径是 ../api/endpoints/auth/auth
// （不是旧 endpoints barrel），同时 hook 名是 useSessionsLogin。
// OAuth 跳板从 ../api/endpoints/oauth/oauth 拿 useOAuthAuthorize。
vi.mock("../../src/api/endpoints/auth/auth", () => ({
  useSessionsLogin: () => loginMut,
}));
vi.mock("../../src/api/endpoints/oauth/oauth", () => ({
  // 2026-08-29 OAuth 跳板场景: 已登录 + ?redirect_uri=&state=&client_id= 时,
  // LoginPage 自动调 useOAuthAuthorize 拿 code 跳回 RP。
  useOAuthAuthorize: () => authorizeMut,
}));

// mock toast：捕获 toast.error 的文案
const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("vue-sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
  // LoginPage 自挂 <Toaster/>（2026-09-11）——mock 成空渲染
  Toaster: () => null,
}));

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof mountWithProviders>>) {
  await wrapper.find('input[id="username"]').setValue("alice");
  await wrapper.find('input[id="password"]').setValue("dev123456");
  await wrapper.find("form").trigger("submit");
}

describe("M01.F04.I03 账号密码登录", () => {
  beforeEach(() => {
    loginMut.mutateAsync.mockReset();
    toastError.mockReset();
    // beforeEach 阶段还没有 mount -> 先给个独立 pinia 让 store 可用
    setActivePinia(createPinia());
    useTenantStore().logout();
    localStorage.removeItem("saas.tenant");
  });

  it("渲染登录表单，挂 data-fn=M01.F04.I03 的提交按钮", () => {
    const wrapper = mountWithProviders(LoginPage);
    const btn = wrapper.find('[data-fn="M01.F04.I03"]');
    expect(btn.exists()).toBe(true);
  });

  it("提交 username/password -> POST /auth/login（mutation 参数一致）", async () => {
    loginMut.mutateAsync.mockResolvedValue({
      data: {
        accessToken: "at-1",
        refreshToken: "rt-1",
        user: { id: "u-1", username: "alice" },
        availableTenants: [{ tenantId: "t-1", tenantCode: null, tenantName: "ACME", roleCodes: [] }],
        clientId: "test-client-id",
      },
    });
    const wrapper = mountWithProviders(LoginPage);
    await fillAndSubmit(wrapper);
    // LoginPage 拼上 clientId（业务身份字段，从 VITE_LOGIN_CLIENT_ID 来），
    // 不能只断言 username/password；clientId 必须等于 env 实际注入值
    // （2026-09-11 起 .env.test 提供真值 saas-console …1114，setup 兜底不再触发）
    expect(loginMut.mutateAsync).toHaveBeenCalledWith({
      data: {
        username: "alice",
        password: "dev123456",
        clientId: import.meta.env.VITE_LOGIN_CLIENT_ID,
      },
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

  // M01.F04.I02 - 423 + LockedAccountResponse：锁定时显示 countdown + 禁用提交按钮
  it("账号锁定（423 + lockedUntil）-> 显示倒计时 + 禁用提交按钮", async () => {
    // 锁定到 15 分钟之后
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    loginMut.mutateAsync.mockRejectedValue(
      new ApiError(
        423,
        { code: "ACCOUNT_LOCKED", message: "account locked", lockedUntil },
        "account locked",
      ),
    );
    const wrapper = mountWithProviders(LoginPage);
    await fillAndSubmit(wrapper);
    // 倒计时元素出现
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="lockout-countdown"]').exists()).toBe(true);
    });
    // 提交按钮禁用
    const btn = wrapper.find('[data-fn="M01.F04.I03"]');
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);
    // 倒计时文本含「分钟」或秒数提示
    expect(wrapper.find('[data-testid="lockout-countdown"]').text()).toMatch(/\d/);
  });

  it("登录成功 -> tenant-store 写 session + 跳 /tenants", async () => {
    loginMut.mutateAsync.mockResolvedValue({
      data: {
        accessToken: "at-1",
        refreshToken: "rt-1",
        user: { id: "u-1", username: "alice" },
        availableTenants: [{ tenantId: "t-1", tenantCode: null, tenantName: "ACME", roleCodes: [] }],
        clientId: "test-client-id",
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

// === M01.F04.I03 OAuth 2.0 授权码回跳（RFC 6749 §4.1.2）===

// jsdom 的 window.location.href 只读 — 用 Proxy 拦截赋值记录目标 URL（lab-react 同款手法）。
function interceptLocationHref(): { assigned: () => string; restore: () => void } {
  const original = window.location;
  let assignedHref = "";
  Object.defineProperty(window, "location", {
    configurable: true,
    get() {
      return new Proxy(original, {
        set(target, prop, value) {
          if (prop === "href") {
            assignedHref = String(value);
            return true;
          }
          return Reflect.set(target, prop, value);
        },
      });
    },
  });
  return {
    assigned: () => assignedHref,
    restore: () =>
      Object.defineProperty(window, "location", {
        configurable: true,
        value: original,
      }),
  };
}

describe("M01.F04.I03 OAuth code 回跳", () => {
  it("带 ?code=&redirect_uri=&state= 登录成功 -> 302 redirect_uri?code&state（不跳 /tenants）", async () => {
    const loc = interceptLocationHref();
    loginMut.mutateAsync.mockResolvedValue({
      data: {
        accessToken: "at-1",
        refreshToken: "rt-1",
        user: { id: "u-1", username: "alice" },
        availableTenants: [{ tenantId: "t-1", tenantCode: null, tenantName: "ACME", roleCodes: [] }],
        clientId: "test-client-id",
      },
    });
    try {
      window.history.replaceState(
        {},
        "",
        "/login?code=auth-code-1&redirect_uri=https%3A%2F%2Flab-vue.xiangru.uk%2Flogin&state=xyz",
      );
      const wrapper = mountWithProviders(LoginPage);
      await fillAndSubmit(wrapper);
      await vi.waitFor(() => expect(loc.assigned()).toBeTruthy());
      const target = new URL(loc.assigned());
      expect(target.origin + target.pathname).toBe(
        "https://lab-vue.xiangru.uk/login",
      );
      expect(target.searchParams.get("code")).toBe("auth-code-1");
      expect(target.searchParams.get("state")).toBe("xyz");
      // 回跳 RP，而不是进 saas 自己的 /tenants
      expect(wrapper.vm.$router.currentRoute.value.path).not.toBe("/tenants");
      // 吸干 onSubmit 路径的 setTimeout(0)（waitFor 可能被挂载期自动回跳先行满足），
      // 否则游离定时器会在下一个测试的 Proxy 里落赋值。
      await new Promise((r) => setTimeout(r, 20));
    } finally {
      loc.restore();
      window.history.replaceState({}, "", "/login");
    }
  });

  it("无 OAuth 参数登录成功 -> 行为不变（跳 /tenants，不读 location.href）", async () => {
    const loc = interceptLocationHref();
    loginMut.mutateAsync.mockResolvedValue({
      data: {
        accessToken: "at-1",
        refreshToken: "rt-1",
        user: { id: "u-1", username: "alice" },
        availableTenants: [{ tenantId: "t-1", tenantCode: null, tenantName: "ACME", roleCodes: [] }],
        clientId: "test-client-id",
      },
    });
    try {
      const wrapper = mountWithProviders(LoginPage);
      await fillAndSubmit(wrapper);
      await vi.waitFor(() => {
        expect(wrapper.vm.$router.currentRoute.value.path).toBe("/tenants");
      });
      expect(loc.assigned()).toBe("");
    } finally {
      loc.restore();
    }
  });
});
