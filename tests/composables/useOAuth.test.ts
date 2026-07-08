import { describe, it, expect, beforeEach } from 'vitest'
import { buildOAuthAuthorizeUrl, handleOAuthCallback } from '../../src/composables/useOAuth'

describe('useOAuth (ch40)', () => {
  beforeEach(() => {
    // jsdom 自带 window.location，无需 stub
  })

  it('buildOAuthAuthorizeUrl composes provider /authorize URL', () => {
    const url = buildOAuthAuthorizeUrl({ provider: 'github', state: 'st1' })
    expect(url).toContain('/sso/authorize')
    expect(url).toContain('client_id=github-demo-client')
    expect(url).toContain('state=st1')
  })

  it('handleOAuthCallback exchanges code for token via mock IdP', async () => {
    const result = await handleOAuthCallback('mock-auth-code-1', 'github')
    expect(result.token).toBeTruthy()
    expect(result.user.username).toBe('admin@acme')
  })

  it('handleOAuthCallback rejects bad code', async () => {
    await expect(handleOAuthCallback('bad-code', 'github')).rejects.toThrow()
  })
})
