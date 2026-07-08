import { describe, it, expect } from 'vitest'
import { platformNavItems } from '../../src/router/nav'

// 平台 nav 单一来源（对齐 React PlatformLayout.tsx navItems 顺序）：
// 租户管理 → 应用管理 → 开放平台 → 平台配置
describe('router/nav platformNavItems (对齐 React)', () => {
  it('顺序固定为 租户/应用/开放平台/平台配置', () => {
    expect(platformNavItems.map((i) => i.label)).toEqual([
      '租户管理',
      '应用管理',
      '开放平台',
      '平台配置',
    ])
  })

  it('to 字段对齐 React 路径', () => {
    expect(platformNavItems.map((i) => i.to)).toEqual([
      '/platform/tenants',
      '/platform/apps',
      '/platform/open-platform',
      '/platform/config',
    ])
  })
})
