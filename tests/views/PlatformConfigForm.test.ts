import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlatformConfigForm from '@/views/platform/PlatformConfigForm.vue'

describe('PlatformConfigForm.vue（对齐 React PlatformConfig）', () => {
  it('渲染平台配置标题与平台信息只读展示', () => {
    const wrapper = mount(PlatformConfigForm)
    expect(wrapper.text()).toContain('平台配置')
    expect(wrapper.text()).toContain('平台信息')
    expect(wrapper.text()).toContain('SaaS IAM 统一身份管理平台')
    expect(wrapper.text()).toContain('多租户 / RBAC / SSO')
  })
})
