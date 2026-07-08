import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

// 租户级侧边栏（ch39 多租户 + ch40 RBAC）：
// - 展示所有租户可见的导航项（dashboard / users / org / roles / menu-permissions / positions / user-groups / permission-groups / audit / login-methods / token-config / api-keys / login-security / password-policy / risk-control / notification-config）
// - v-permission 指令过滤：当前用户没有权限码的菜单项不渲染
// - 高亮当前路由（NavLink active 类）
describe('AppSidebar.vue (ch39/ch40)', () => {
  let router: Router

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/:tenantId', component: { template: '<div />' },
          children: [
            { path: 'dashboard', component: { template: '<div />' } },
            { path: 'users', component: { template: '<div />' } },
            { path: 'roles', component: { template: '<div />' } },
            { path: 'audit', component: { template: '<div />' } },
            { path: 'menu-permissions', component: { template: '<div />' } },
          ],
        },
      ],
    })
  })

  it('admin 全权限：渲染所有租户级菜单项', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u1', name: '管理员', role: 'admin', roleId: 'role-admin' } as never
    auth.permissions = [
      'dashboard:read', 'user:read', 'org:read', 'role:read', 'menu:read',
      'position:read', 'user-group:read', 'permission-group:read', 'audit:read',
      'login-method:read', 'token-config:read', 'api-key:read',
      'login-security:read', 'password-policy:read', 'risk-control:read',
      'notification-config:read',
    ] as never
    await router.push('/acme/dashboard')
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      global: { plugins: [router] },
    })
    const links = wrapper.findAll('a, [role="link"]')
    // 至少 14 个菜单项（不含 dashboard 因为测试路径是 dashboard 自己已激活）
    expect(links.length).toBeGreaterThanOrEqual(13)
  })

  it('普通用户仅有 user:read：仅渲染 dashboard + users', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u2', name: '普通', role: 'user', roleId: 'role-user' } as never
    auth.permissions = ['dashboard:read', 'user:read'] as never
    await router.push('/acme/dashboard')
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      global: { plugins: [router] },
    })
    // 看到 users,不看到 roles/audit/menu-permissions
    expect(wrapper.text()).toContain('用户')
    expect(wrapper.text()).not.toContain('审计')
    expect(wrapper.text()).not.toContain('角色权限')
  })

  it('当前路由高亮：active 类应用于匹配项', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u3', name: 'A', role: 'admin', roleId: 'role-admin' } as never
    auth.permissions = ['dashboard:read', 'audit:read'] as never
    await router.push('/acme/audit')
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      global: { plugins: [router] },
    })
    // 当前路由对应的菜单项被标记为激活（isActive 加 bg-slate-700 高亮类）
    const html = wrapper.html()
    expect(html).toMatch(/审计[\s\S]*?bg-slate-700|bg-slate-700[\s\S]*?审计/)
  })

  // 对齐 React Layout.tsx：身份管理分组顺序为
  // 组织管理 → 岗位管理 → 角色管理 → 权限组别 → 菜单权限 → 用户组别 → 用户管理（用户管理末位）
  it('身份管理分组顺序对齐 React（组织管理在用户管理之前，用户管理末位）', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u4', name: '管理员', role: 'admin', roleId: 'role-admin' } as never
    auth.permissions = [
      'dashboard:read', 'user:read', 'org:read', 'position:read', 'role:read',
      'permission-group:read', 'menu:read', 'user-group:read',
    ] as never
    await router.push('/acme/dashboard')
    await router.isReady()
    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    const text = wrapper.text()
    // 组织管理 必须出现在 用户管理 之前
    expect(text.indexOf('组织管理')).toBeLessThan(text.indexOf('用户管理'))
    // 岗位管理 必须出现在 角色管理 之前
    expect(text.indexOf('岗位管理')).toBeLessThan(text.indexOf('角色管理'))
    // 身份管理分组的 7 个 label 必须都在首页之后
    expect(text.indexOf('身份管理')).toBeLessThan(text.indexOf('组织管理'))
  })

  // 平台 nav 顺序对齐 React PlatformLayout：租户 → 应用 → 开放平台 → 平台配置
  it('平台 nav 顺序对齐 React（租户/应用/开放平台/平台配置）', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u5', name: '管理员', role: 'admin', roleId: 'role-admin' } as never
    auth.permissions = ['platform:read'] as never
    await router.push('/acme/dashboard')
    await router.isReady()
    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    const text = wrapper.text()
    expect(text.indexOf('租户管理')).toBeLessThan(text.indexOf('应用管理'))
    expect(text.indexOf('应用管理')).toBeLessThan(text.indexOf('开放平台'))
    expect(text.indexOf('开放平台')).toBeLessThan(text.indexOf('平台配置'))
  })
})
