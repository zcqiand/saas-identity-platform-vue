import { describe, it, expect } from 'vitest'
import { apiClient } from '../../src/api/client'

// ch40 安全/认证 handlers 形状
describe('mocks/handlers.ts (ch40) — loginMethods/sso/oauth2/token/apiKeys', () => {
  it('GET /login-methods 默认 6 种 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/login-methods')
    expect(data.length).toBe(6)
    expect(data[0]).toHaveProperty('method')
    expect(data[0]).toHaveProperty('enabled')
  })

  it('PUT /login-methods/:id 切换启用 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/login-methods/lm-totp', { enabled: true })
    expect(data.enabled).toBe(true)
  })

  it('PUT /login-methods/:id 404 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(apiClient.put('/login-methods/xx', { enabled: true })).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('GET /sso-providers 默认 2 个 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/sso-providers')
    expect(data.length).toBe(2)
    expect(data[0]).toHaveProperty('type')
  })

  it('PUT /sso-providers/:id 切换 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/sso-providers/sso-okta', { enabled: false })
    expect(data.enabled).toBe(false)
  })

  it('GET /oauth2-providers 默认 4 个 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/oauth2-providers')
    expect(data.length).toBe(4)
  })

  it('PUT /oauth2-providers/:id 切换 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/oauth2-providers/oa-google', { enabled: false })
    expect(data.enabled).toBe(false)
  })

  it('GET /token-config 返回单例 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/token-config')
    expect(data.accessTokenTtl).toBe(3600)
    expect(data.refreshTokenEnabled).toBe(true)
  })

  it('PUT /token-config 更新 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/token-config', { accessTokenTtl: 7200 })
    expect(data.accessTokenTtl).toBe(7200)
  })

  it('GET /api-keys 默认 3 个 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/api-keys')
    expect(data.length).toBe(3)
    expect(data[0]).toHaveProperty('keyPrefix')
  })

  it('POST /api-keys 创建 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data, status } = await apiClient.post('/api-keys', { name: '新 Key', scopes: ['user:read'] })
    expect(status).toBe(201)
    expect(data.id).toMatch(/^ak-/)
    expect(data.keyPrefix).toMatch(/^ak_/)
  })

  it('PUT /api-keys/:id 禁用 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/api-keys/ak-ci-1', { enabled: false })
    expect(data.enabled).toBe(false)
  })

  it('DELETE /api-keys/:id 204 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const res = await apiClient.delete('/api-keys/ak-legacy')
    expect(res.status).toBe(204)
  })
})
