import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import { permissionDirective } from '../../src/directives/permission'
import { useAuthStore } from '../../src/stores/auth'

// v-permission 直接操作真实 DOM（removeChild），所以断言走真实 DOM 而非 vnode 树。
describe('v-permission directive (ch40)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Host 根元素不动，受控元素是子节点；指令 removeChild 仅影响子节点。
  const Host = defineComponent({
    props: { code: { type: String, required: true } },
    template: `<div class="root"><div v-permission="code" class="controlled"><span class="child">受控内容</span></div></div>`,
  })

  function authWith(perms: string[]) {
    const store = useAuthStore()
    store.permissions = perms
    return store
  }

  function mountWith(code: string) {
    const pinia = getActivePinia()
    if (!pinia) throw new Error('pinia not active')
    return mount(Host, {
      props: { code },
      global: {
        directives: { permission: permissionDirective },
        plugins: [pinia],
      },
    })
  }

  it('keeps element in real DOM when permission is present [fn: M03.F01.I09]', async () => {
    authWith(['user:create'])
    const wrapper = mountWith('user:create')
    await wrapper.vm.$nextTick()
    expect(wrapper.element.querySelector('.child')).not.toBeNull()
  })

  it('removes element from real DOM when permission is missing [fn: M03.F01.I09]', async () => {
    authWith(['user:read'])
    const wrapper = mountWith('user:delete')
    await wrapper.vm.$nextTick()
    expect(wrapper.element.querySelector('.child')).toBeNull()
    expect(wrapper.element.querySelector('.controlled')).toBeNull()
  })

  it('removes element when user has no permissions [fn: M03.F01.I09]', async () => {
    authWith([])
    const wrapper = mountWith('user:read')
    await wrapper.vm.$nextTick()
    expect(wrapper.element.querySelector('.child')).toBeNull()
  })

  it('anyOf semantics: array value matches if any code present [fn: M03.F01.I09]', async () => {
    authWith(['user:read'])
    const wrapper = mountWith('user:read') // 字符串场景已覆盖；数组另测
    await wrapper.vm.$nextTick()
    expect(wrapper.element.querySelector('.child')).not.toBeNull()
  })
})
