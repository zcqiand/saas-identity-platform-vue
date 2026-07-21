import { describe, it, expect } from 'vitest'
import { apiClient } from '../../src/api/client'

// 验证 mocks/handlers.ts 中新增的 positions/user-groups/permission-groups handlers
describe('mocks/handlers.ts (ch42) — positions/userGroups/permissionGroups', () => {
  it('GET /positions 默认 5 个岗位 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/positions')
    expect(data.length).toBeGreaterThanOrEqual(5)
    expect(data[0]).toHaveProperty('id')
    expect(data[0]).toHaveProperty('code')
  })

  it('GET /positions/:id 404 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(apiClient.get('/positions/non-exist')).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('POST /positions 创建 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data, status } = await apiClient.post('/positions', {
      name: '测试岗', code: 'tester', description: 'X', sort: 99, enabled: true,
    })
    expect(status).toBe(201)
    expect(data.id).toMatch(/^pos-/)
  })

  it('POST /positions 缺 name 返回 400 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(apiClient.post('/positions', { code: 'x' })).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('PUT /positions/:id 更新 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/positions/pos-dev', { name: '研发 v2', sort: 88 })
    expect(data.name).toBe('研发 v2')
    expect(data.sort).toBe(88)
  })

  it('DELETE /positions/:id 204 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const res = await apiClient.delete('/positions/pos-hr')
    expect(res.status).toBe(204)
  })

  it('GET /user-groups 默认 5 个组 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/user-groups')
    expect(data.length).toBeGreaterThanOrEqual(5)
    expect(data[0]).toHaveProperty('memberCount')
  })

  it('POST /user-groups 创建 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.post('/user-groups', { name: '新组', description: 'D', enabled: true })
    expect(data.id).toMatch(/^ug-/)
    expect(data.memberCount).toBe(0)
  })

  it('PUT /user-groups/:id 更新 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/user-groups/ug-rd', { name: '研发中心' })
    expect(data.name).toBe('研发中心')
  })

  it('DELETE /user-groups/:id 204 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const res = await apiClient.delete('/user-groups/ug-vip')
    expect(res.status).toBe(204)
  })

  it('GET /permission-groups 默认 4 个 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/permission-groups')
    expect(data.length).toBeGreaterThanOrEqual(4)
    expect(Array.isArray(data[0].permissions)).toBe(true)
  })

  it('POST /permission-groups 创建带 permissions [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.post('/permission-groups', {
      name: '测试组', code: 'test-pg', description: 'D', permissions: ['user:read'], enabled: true,
    })
    expect(data.id).toMatch(/^pg-/)
    expect(data.permissions).toEqual(['user:read'])
  })

  it('PUT /permission-groups/:id 更新 permissions [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/permission-groups/pg-ro', { permissions: ['user:read', 'org:read', 'audit:read'] })
    expect(data.permissions.length).toBe(3)
  })

  it('DELETE /permission-groups/:id 204 [fn: M02.F01.I01, M02.F02.I01, M02.F02.I09, M02.F01.I09, M02.F02.I08, M02.F01.I02, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F02.I02, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const res = await apiClient.delete('/permission-groups/pg-rw')
    expect(res.status).toBe(204)
  })
})
