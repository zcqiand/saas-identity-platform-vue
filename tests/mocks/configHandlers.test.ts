import { describe, it, expect } from 'vitest'
import { apiClient } from '../../src/api/client'

// ch41-42 单例配置 handlers
describe('mocks/handlers.ts (ch41-42) — loginSecurity/passwordPolicy/riskControl/notification/openPlatform', () => {
  it('GET /login-security 单例 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/login-security')
    expect(data.lockThreshold).toBe(5)
    expect(data.regionRestrictionEnabled).toBe(false)
  })
  it('PUT /login-security 更新 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/login-security', { lockThreshold: 10, regionRestrictionEnabled: true })
    expect(data.lockThreshold).toBe(10)
    expect(data.regionRestrictionEnabled).toBe(true)
  })
  it('GET /password-policy 单例 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/password-policy')
    expect(data.minLength).toBe(8)
  })
  it('PUT /password-policy 更新 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/password-policy', { minLength: 12, requireSpecial: true })
    expect(data.minLength).toBe(12)
    expect(data.requireSpecial).toBe(true)
  })
  it('GET /risk-control 单例 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/risk-control')
    expect(data.riskScoreThreshold).toBe(70)
  })
  it('PUT /risk-control 更新 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/risk-control', { riskScoreThreshold: 50, deviceFingerprintEnabled: true })
    expect(data.riskScoreThreshold).toBe(50)
    expect(data.deviceFingerprintEnabled).toBe(true)
  })
  it('GET /notification-config 单例 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/notification-config')
    expect(data.emailEnabled).toBe(true)
    expect(Array.isArray(data.notifyOn)).toBe(true)
  })
  it('PUT /notification-config 更新 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/notification-config', { smsEnabled: true, notifyOn: ['login', 'system'] })
    expect(data.smsEnabled).toBe(true)
    expect(data.notifyOn).toEqual(['login', 'system'])
  })
  it('GET /open-platform-config 单例 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/open-platform-config')
    expect(data.apiEnabled).toBe(true)
  })
  it('PUT /open-platform-config 更新 [fn: M06.F01.I01, M06.F04.I01, M06.F07.I01, M06.F08.I01, M06.F01.I02, M06.F01.I03, M06.F01.I04, M06.F01.I05, M06.F01.I06, M06.F01.I07, M06.F01.I08, M06.F04.I02, M06.F04.I03, M06.F04.I04, M06.F04.I05, M06.F07.I02, M06.F07.I03, M06.F07.I04, M06.F07.I05, M06.F07.I06, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/open-platform-config', { sdkEnabled: true })
    expect(data.sdkEnabled).toBe(true)
  })
})
