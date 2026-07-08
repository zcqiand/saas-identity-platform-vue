import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, clearTheme, THEME_VARS } from '../../src/composables/useTheme'
import type { ThemeConfig } from '../../src/types/tenant'

describe('useTheme (ch39)', () => {
  beforeEach(() => {
    clearTheme()
  })

  it('applyTheme writes CSS variables to documentElement', () => {
    const theme: ThemeConfig = { primary: '#ff0000', sidebar: '#00ff00', logoText: 'TEST' }
    applyTheme(theme)
    const root = document.documentElement
    expect(root.style.getPropertyValue(THEME_VARS.primary)).toBe('#ff0000')
    expect(root.style.getPropertyValue(THEME_VARS.sidebar)).toBe('#00ff00')
    expect(root.style.getPropertyValue(THEME_VARS.logoText)).toBe('TEST')
  })

  it('clearTheme removes all tenant CSS variables', () => {
    applyTheme({ primary: '#a', sidebar: '#b', logoText: 'C' })
    clearTheme()
    const root = document.documentElement
    expect(root.style.getPropertyValue(THEME_VARS.primary)).toBe('')
    expect(root.style.getPropertyValue(THEME_VARS.sidebar)).toBe('')
    expect(root.style.getPropertyValue(THEME_VARS.logoText)).toBe('')
  })

  it('applyTheme overwrites previous values on switch', () => {
    applyTheme({ primary: '#111111', sidebar: '#222222', logoText: 'A' })
    applyTheme({ primary: '#333333', sidebar: '#444444', logoText: 'B' })
    const root = document.documentElement
    expect(root.style.getPropertyValue(THEME_VARS.primary)).toBe('#333333')
    expect(root.style.getPropertyValue(THEME_VARS.logoText)).toBe('B')
  })
})
