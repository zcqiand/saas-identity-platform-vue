import { describe, it, expect, beforeEach } from 'vitest'
import { buildSsoRedirectUrl, handleSsoCallback, generateState } from '../../src/composables/useSso'

describe('useSso (ch40)', () => {
  beforeEach(() => {
    // jsdom 自带 window.location，无需 stub；origin 默认 http://localhost:3000
  })

  it('buildSsoRedirectUrl composes /authorize URL with client_id/redirect_uri/state [fn: M01.F04.I01, M01.F04.I02, M01.F04.I05, M01.F04.I03, M01.F04.I04]', () => {
    const url = buildSsoRedirectUrl({ state: 'abc123' })
    expect(url).toContain('/sso/authorize')
    expect(url).toContain('client_id=saas-demo-client')
    expect(url).toContain('response_type=code')
    expect(url).toContain('state=abc123')
    expect(url).toContain('redirect_uri=')
  })

  it('buildSsoRedirectUrl honors override options [fn: M01.F04.I01, M01.F04.I02, M01.F04.I05, M01.F04.I03, M01.F04.I04]', () => {
    const url = buildSsoRedirectUrl({
      ssoBaseUrl: 'https://idp.example.com',
      clientId: 'custom-client',
      redirectUri: 'https://app.example.com/sso-callback',
      state: 'xyz',
    })
    expect(url.startsWith('https://idp.example.com/authorize')).toBe(true)
    expect(url).toContain('client_id=custom-client')
    expect(url).toContain('redirect_uri=' + encodeURIComponent('https://app.example.com/sso-callback'))
  })

  it('handleSsoCallback exchanges code for token via mock IdP [fn: M01.F04.I01, M01.F04.I02, M01.F04.I05, M01.F04.I03, M01.F04.I04]', async () => {
    const result = await handleSsoCallback('mock-auth-code-123', 'oidc')
    expect(result.token).toBeTruthy()
    expect(result.user.username).toBe('admin@acme')
    expect(result.user.departmentId).toBe('department-acme')
  })

  it('handleSsoCallback rejects invalid code [fn: M01.F04.I01, M01.F04.I02, M01.F04.I05, M01.F04.I03, M01.F04.I04]', async () => {
    await expect(handleSsoCallback('bad-code', 'oidc')).rejects.toThrow()
  })

  it('generateState returns non-empty unique-ish string [fn: M01.F04.I01, M01.F04.I02, M01.F04.I05, M01.F04.I03, M01.F04.I04]', () => {
    const s1 = generateState()
    const s2 = generateState()
    expect(s1.length).toBeGreaterThan(0)
    expect(s1).not.toEqual(s2)
  })
})
