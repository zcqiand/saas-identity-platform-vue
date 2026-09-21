// 成员管理页真链路测试（tenant-scoped 用户列表七项收口，与 saas-react
// tests/integration/user-list.test.tsx 八用例语义对称）。
//
// 基建：setup.ts 对 endpoints 的 hook mock 是全局的，真链路用例在本文件用
// vi.mock(importOriginal) 恢复真实生成 hook（注册晚于 setup，本文件内覆盖）；
// axios 拦截器（baseURL + Bearer）由本文件自装一次（main.ts bootstrap 不跑）；
// jsdom url 与 :5101 同源（vitest.config environmentOptions）。
//
// 断言锚 saas-shared seeds（tenant1 = tenants[0] 共 3 名成员：alice/bob active、
// carol invited——seeds/tenant_member.json c…001~003；禁止硬编码易变业务值）。
// it() 标题不带功能 ID 字面（fnReporter 泄漏禁令）；UI 锚由页面 data-fn 属性承载。
import { afterEach, describe, expect, it, vi } from "vitest";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import UserListPage from "../../src/pages/UserListPage.vue";
import { installHttpClient } from "../../src/api/http-client";
import { SEED, installRealChain, testToken } from "../helpers/real-chain";

// 真链路：恢复 setup.ts 全局 mock 盖掉的 orval 生成 hook（tenant-members/tenant-roles）。
vi.mock("../../src/api/endpoints/tenant-members/tenant-members", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../src/api/endpoints/tenant-members/tenant-members")
  >()),
}));
vi.mock("../../src/api/endpoints/tenant-roles/tenant-roles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/api/endpoints/tenant-roles/tenant-roles")>()),
}));

// axios 桥（每文件进程一次性，不重复装——拦截器叠链教训在册）：baseURL 走 env
// 空串（jsdom 同源 :5101），token 取 globalSetup 铸的 TEST_TOKEN。
installHttpClient(() => testToken());

enableAutoUnmount(afterEach);

// reka 弹层（CrudDialog/ConfirmDialog/详情 Dialog）走 DialogPortal → document.body；
// teleport: false = 关 stub 渲染真 teleport（仓内既有配方），断言/交互全走 document.body。
async function mountPage() {
  installRealChain();
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/tenants/:tenantId/members", component: UserListPage },
      { path: "/:pathMatch(.*)*", component: { template: "<div />" } },
    ],
  });
  router.push(`/tenants/${SEED.tenants[0].id}/members`);
  await router.isReady();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return mount(UserListPage, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      stubs: { teleport: false },
    },
  });
}

// ———— document.body 查询/交互 helpers（portal 内容不进 wrapper）————

function rows(): HTMLElement[] {
  return [...document.body.querySelectorAll('[data-testid="user-row"]')] as HTMLElement[];
}

function rowByText(text: string): HTMLElement {
  const hit = rows().find((r) => r.textContent?.includes(text));
  if (!hit) throw new Error(`找不到含「${text}」的 user-row（现 ${rows().length} 行）`);
  return hit;
}

function bodyButton(text: string): HTMLButtonElement {
  const hit = [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!hit) throw new Error(`document.body 里找不到按钮「${text}」`);
  return hit;
}

function clickButton(text: string): void {
  bodyButton(text).dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

/** 等按钮出现再点（弹层 teleport 挂载是异步的，紧跟触发后的同步点查不到）。 */
async function clickButtonWhen(text: string): Promise<void> {
  await vi.waitFor(
    () => {
      const btn = [...document.body.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === text,
      );
      expect(btn).toBeTruthy();
      btn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    },
    { timeout: 20_000, interval: 250 },
  );
}

function setInput(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) throw new Error(`document.body 里找不到 #${id}`);
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function selectByAriaLabel(label: string, value: string): void {
  const el = document.querySelector(`select[aria-label="${label}"]`) as HTMLSelectElement | null;
  if (!el) throw new Error(`document.body 里找不到 select[aria-label="${label}"]`);
  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitRows(min = 1): Promise<void> {
  await vi.waitFor(
    () => {
      expect(rows().length).toBeGreaterThanOrEqual(min);
    },
    { timeout: 20_000, interval: 250 },
  );
}

describe("M01.F01 用户管理（tenant-scoped，真链路）", () => {
  it("渲染用户列表，创建成员按钮挂创建锚", async () => {
    await mountPage();
    await waitRows();
    expect(document.body.querySelector('button[data-fn="M01.F04.I03"]')).toBeTruthy();
  });
});

describe("成员管理页（tenant-scoped 用户列表，真链路八用例）", () => {
  it("渲染种子成员行：alice / bob 在列", async () => {
    await mountPage();
    await waitRows();
    const text = rows()
      .map((r) => r.textContent)
      .join("|");
    expect(text).toContain("alice");
    expect(text).toContain("bob");
  });

  it("状态过滤 invited：只剩种子里的已邀请成员行", async () => {
    await mountPage();
    await waitRows();
    selectByAriaLabel("状态过滤", "invited");
    // 种子：tenant1 的 invited 成员恰 1 行（c…003 → user b…003 carol = SEED.users[2]）
    await vi.waitFor(
      () => {
        expect(rows().length).toBe(1);
      },
      { timeout: 20_000, interval: 250 },
    );
    expect(rows()[0]!.textContent).toContain(SEED.users[2]!.username);
  });

  it("每页 2 条分页：翻到第 2 页页码指示更新", async () => {
    await mountPage();
    await waitRows();
    selectByAriaLabel("每页", "2");
    await vi.waitFor(
      () => {
        expect(rows().length).toBe(2);
      },
      { timeout: 20_000, interval: 250 },
    );
    clickButton("下一页");
    await vi.waitFor(
      () => {
        expect(
          document.body.querySelector('[data-testid="user-page-indicator"]')?.textContent,
        ).toContain("第 2 页");
      },
      { timeout: 20_000, interval: 250 },
    );
  });

  it("行内详情弹层：展示邮箱与角色码完整信息", async () => {
    await mountPage();
    await waitRows();
    const aliceRow = rowByText("alice");
    const detailBtn = [...aliceRow.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "详情",
    );
    expect(detailBtn).toBeTruthy();
    detailBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const dlg = await vi.waitFor(
      () => {
        const el = document.body.querySelector('[data-testid="member-detail-dialog"]');
        expect(el).toBeTruthy();
        return el as HTMLElement;
      },
      { timeout: 20_000, interval: 250 },
    );
    // 种子：alice roleIds=[a…001] → rolesQ 映射出 roleCode admin
    await vi.waitFor(
      () => {
        expect(dlg.textContent).toContain("admin");
      },
      { timeout: 20_000, interval: 250 },
    );
    expect(dlg.textContent).toContain("alice");
    expect(dlg.textContent).toContain("alice@acme.io");
  });

  it("创建成员并勾选 admin 角色：行内角色计数为 1 项", async () => {
    await mountPage();
    await waitRows();
    clickButton("创建成员");
    // 必填字段的 label 带星号（Field 组件同元素渲染），控件按 id 定位（crud-field-*）
    await vi.waitFor(
      () => {
        expect(document.getElementById("crud-field-username")).toBeTruthy();
      },
      { timeout: 20_000, interval: 250 },
    );
    // 种子里已有 dave（sys_user 全局唯一约束），换种子外的 dora
    setInput("crud-field-username", "dora");
    setInput("crud-field-password", "dora-pass-123");
    setInput("crud-field-email", "dora@acme.io");
    // label 双 span（roleCode + roleName），admin 复选框经 label 文本定位
    const adminLabel = await vi.waitFor(
      () => {
        const hit = [...document.body.querySelectorAll("label")].find((l) =>
          l.textContent?.includes("admin"),
        );
        expect(hit).toBeTruthy();
        return hit as HTMLLabelElement;
      },
      { timeout: 20_000, interval: 250 },
    );
    (adminLabel.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    clickButton("创建");
    // 创建成功后自动 assignRoles → 行渲染且角色计数为 1 项
    //（waitFor 兜住「先出现 0 项、assignRoles 刷新后 1 项」的中间态）
    await vi.waitFor(
      () => {
        const row = rowByText("dora");
        expect(row.textContent).toContain("1 项");
      },
      { timeout: 20_000, interval: 250 },
    );
  });

  it("邀请成员：email 前缀用户名的行出现", async () => {
    await mountPage();
    await waitRows();
    const email = `ivy-${Date.now()}@acme.io`;
    clickButton("邀请成员");
    await vi.waitFor(
      () => {
        expect(document.getElementById("crud-field-email")).toBeTruthy();
      },
      { timeout: 20_000, interval: 250 },
    );
    setInput("crud-field-email", email);
    clickButton("发送邀请");
    // 后端语义：username=email 前缀、无邀请链接展示面。徽标不在此断言：
    // nextjs invite 实建 tenant_member.status=active（Task 1 已裁），断言核心=行出现。
    await vi.waitFor(
      () => {
        const row = rowByText(email.split("@")[0]!);
        expect(row.textContent).toContain(email);
      },
      { timeout: 20_000, interval: 250 },
    );
  });

  it("编辑成员：可改邮箱与手机号，弹窗无状态字段", async () => {
    await mountPage();
    await waitRows();
    const aliceRow = rowByText("alice");
    const editBtn = [...aliceRow.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "编辑",
    );
    expect(editBtn).toBeTruthy();
    editBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(
      () => {
        expect(document.getElementById("crud-field-email")).toBeTruthy();
      },
      { timeout: 20_000, interval: 250 },
    );
    expect((document.getElementById("crud-field-email") as HTMLInputElement).value).toBe(
      "alice@acme.io",
    );
    // 状态已从编辑弹窗移除（label 精确串「状态」不存在；「状态过滤」是 aria-label 不误中）
    expect(
      [...document.body.querySelectorAll("label")].some((l) => l.textContent?.trim() === "状态"),
    ).toBe(false);
    // 手机号字段存在（契约 UpdateSysUserRequest 全字段：email + mobile）
    expect(document.getElementById("crud-field-mobile")).toBeTruthy();
    setInput("crud-field-mobile", "13800000000");
    setInput("crud-field-email", "alice2@acme.io");
    clickButton("保存");
    await vi.waitFor(
      () => {
        expect(rowByText("alice").textContent).toContain("alice2@acme.io");
      },
      { timeout: 20_000, interval: 250 },
    );
  });

  it("行内停用经确认后：状态徽标翻转为暂停", async () => {
    await mountPage();
    await waitRows();
    const bobRow = rowByText("bob");
    const suspendBtn = [...bobRow.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "停用",
    );
    expect(suspendBtn).toBeTruthy();
    suspendBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await clickButtonWhen("确认");
    await vi.waitFor(
      () => {
        expect(rowByText("bob").textContent).toMatch(/暂停/);
      },
      { timeout: 20_000, interval: 250 },
    );
  });
});
