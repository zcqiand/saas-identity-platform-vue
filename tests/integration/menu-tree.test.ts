// M08.F01 — 菜单树（应用下）
// v0.4.x：真树表格（可展开/收起）
import { describe, it, expect } from "vitest";
import { nextTick } from "vue";
import { mountWithProviders } from "../helper";
import MenuTreePage from "../../src/pages/MenuTreePage.vue";
import PageLoading from "../../src/components/app/page-loading.vue";

describe("M08.F01 菜单树（树表化）", () => {
  it("PageLoading 组件存在（sanity）", () => {
    expect(typeof PageLoading).toBe("object");
  });

  it("默认渲染所有菜单行（含嵌套子级），每行带 data-depth", async () => {
    const wrapper = mountWithProviders(MenuTreePage, {
      router: { initialRoute: "/admin/apps/00000000-0000-0000-0000-000000000001/menus" },
    });
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await nextTick();
    const rows = wrapper.findAll('[data-testid="menu-row"]');
    expect(rows.length).toBeGreaterThan(0);
    const nested = rows.filter((r) => Number(r.attributes("data-depth")) > 0);
    expect(nested.length).toBeGreaterThan(0);
  });

  it("父级菜单行带 data-testid=menu-toggle-* 切换按钮", async () => {
    const wrapper = mountWithProviders(MenuTreePage, {
      router: { initialRoute: "/admin/apps/00000000-0000-0000-0000-000000000001/menus" },
    });
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const toggles = wrapper.findAll('[data-testid^="menu-toggle-"]');
    expect(toggles.length).toBeGreaterThan(0);
  });

  it("点击父级切换按钮后子级行消失", async () => {
    const wrapper = mountWithProviders(MenuTreePage, {
      router: { initialRoute: "/admin/apps/00000000-0000-0000-0000-000000000001/menus" },
    });
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const before = wrapper.findAll('[data-testid="menu-row"]').length;
    expect(before).toBeGreaterThan(1);
    const firstToggle = wrapper.find('[data-testid^="menu-toggle-"]');
    expect(firstToggle.exists()).toBe(true);
    await firstToggle.trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 30));
    const after = wrapper.findAll('[data-testid="menu-row"]').length;
    expect(after).toBeLessThan(before);
  });

  it("每个菜单行挂 data-fn=M08.F01.I05 删除按钮", async () => {
    const wrapper = mountWithProviders(MenuTreePage, {
      router: { initialRoute: "/admin/apps/00000000-0000-0000-0000-000000000001/menus" },
    });
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const rows = wrapper.findAll('[data-testid="menu-row"]');
    expect(rows.length).toBeGreaterThan(0);
    const deleteBtns = wrapper.findAll('button[data-fn="M08.F01.I05"]');
    expect(deleteBtns.length).toBe(rows.length);
  });
});

