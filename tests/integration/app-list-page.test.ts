// M04 — AppListPage 编辑改名回归锚（2026-09-12 OAuthClient 契约形状收敛）
//
// 背景：AppListPage onUpdate 曾读 `values.name`（EDIT_FIELDS 字段名是 clientName），
// 恒 undefined → 编辑应用改名称后 PATCH payload.clientName 丢失。
// 本文件锁「编辑应用改 clientName → 提交 payload.clientName 为新值」路径。
//
// 测试配方（与 login.test.ts 切换器用例一致）：
//   - CrudDialog 走 reka DialogPortal → stubs: { teleport: false } + attachTo document.body
//   - 控件 id 由 crud-dialog.vue 生成：`crud-field-${name}`
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import { mountWithProviders } from "../helper";
import AppListPage from "../../src/pages/AppListPage.vue";
import { apps } from "../../../saas-identity-platform-shared/seeds";

// mock orval mutation：mutateAsync 可检（vi.hoisted 先于 import 执行，不能在里面调 ref()
// —— 会撞 TDZ，所以 isPending 用普通 { value } 对象，与 login.test.ts 同配方）
const { updateClientMut, toastSuccess } = vi.hoisted(() => ({
  updateClientMut: { mutateAsync: vi.fn(), isPending: { value: false } },
  toastSuccess: vi.fn(),
}));

vi.mock("../../src/api/endpoints/admin-clients/admin-clients", async () => {
  const { apps: seedApps } = await import(
    "../../../saas-identity-platform-shared/seeds"
  );
  const listStub = {
    data: {
      value: {
        data: { items: seedApps, page: 1, pageSize: seedApps.length, total: seedApps.length },
      },
    },
    isLoading: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: async () => {},
  };
  const mut = () => ({ mutateAsync: vi.fn(), isPending: { value: false }, reset: () => {} });
  return {
    useAdminClientsListClients: () => listStub,
    useAdminClientsCreateClient: mut,
    useAdminClientsUpdateClient: () => updateClientMut,
    useAdminClientsDeleteClient: mut,
    useAdminClientsSetClientStatus: mut,
  };
});

vi.mock("vue-sonner", () => ({
  toast: { success: toastSuccess, error: vi.fn() },
}));

const mountOpts = { attachTo: document.body, global: { stubs: { teleport: false } } };

describe("M04 应用编辑", () => {
  let wrapper: ReturnType<typeof mountWithProviders> | null = null;
  beforeEach(() => {
    updateClientMut.mutateAsync.mockReset();
    toastSuccess.mockReset();
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("M04 AppListPage 编辑改名 → PATCH payload.clientName 为新值（values.name bug 回归锚）", async () => {
    wrapper = mountWithProviders(AppListPage, mountOpts);
    await flushPromises();
    // fixture 纯 OAuthClient 形状：clientName 可见
    expect(wrapper.text()).toContain(apps[0].clientName);

    // 打开首行「编辑」对话框（portal 内容挂 document.body）
    await wrapper.find('[data-fn="M04.F04.I04"]').trigger("click");
    await flushPromises();

    const nameInput = document.body.querySelector<HTMLInputElement>("#crud-field-clientName");
    expect(nameInput).toBeTruthy();
    // 预填 = 行内 clientName（契约形状，无 name/code 旧键）
    expect(nameInput!.value).toBe(apps[0].clientName);

    await new DOMWrapper(nameInput!).setValue("新名");
    const form = document.body.querySelector("form");
    expect(form).toBeTruthy();
    await new DOMWrapper(form!).trigger("submit");
    await flushPromises();

    expect(updateClientMut.mutateAsync).toHaveBeenCalledTimes(1);
    const vars = updateClientMut.mutateAsync.mock.calls[0][0];
    // 按契约 clientId（code 形）寻址——真后端按 client_id 列查，行 UUID 会 404
    expect(vars.clientId).toBe(apps[0].clientId);
    // 核心回归断言：payload 带新 clientName（旧代码读 values.name → undefined）
    expect(vars.data.clientName).toBe("新名");
    // status 表单选项 "1"/"0" → 提交 Number 映射
    expect(vars.data.status).toBe(1);
    expect(toastSuccess).toHaveBeenCalledWith("应用已更新");
  });
});
