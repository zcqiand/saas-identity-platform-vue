import { describe, it, expect, beforeEach } from 'vitest'
import { apiClient } from '../../src/api/client'

// 验证 mocks/handlers.ts 中新增的 apps/menus handlers 形状与 shared v0.3.0 一致
// Phase 5d：app-console / app-portal 已废弃（shared 只有 app-lab / app-erp / app-finance）。
// 测试统一改用 app-lab（与 saas-React 仓 msw/handlers.ts 共享）。
describe('mocks/handlers.ts (ch42) — apps/menus', () => {
  beforeEach(() => {
    // resetMockDb 在 tests/setup.ts afterEach 自动调
  })

  it('GET /apps 返回默认应用列表（至少 3 个） [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/apps')
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(3)
    expect(data[0]).toHaveProperty('id')
    expect(data[0]).toHaveProperty('name')
    expect(data[0]).toHaveProperty('code')
    expect(data[0]).toHaveProperty('enabled')
  })

  it('GET /apps?keyword=实验室 过滤 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/apps', { params: { keyword: '实验室' } })
    expect(data.length).toBeGreaterThanOrEqual(1)
    const list = data as { code: string; name: string }[]
    expect(list.every((a) => a.code.includes('lab') || a.name.includes('实验室'))).toBe(true)
  })

  it('GET /apps/:id 返回单个应用 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/apps/app-lab')
    expect(data.id).toBe('app-lab')
  })

  it('GET /apps/:id 404 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(apiClient.get('/apps/non-exist')).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('POST /apps 创建应用 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data, status } = await apiClient.post('/apps', {
      name: '新应用', code: 'new-app', description: '测试创建', theme: '#ff0000', sort: 99, enabled: true,
    })
    expect(status).toBe(201)
    expect(data.id).toMatch(/^app-/)
    expect(data.name).toBe('新应用')
    expect(data.code).toBe('new-app')
  })

  it('POST /apps 缺 name 返回 400 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(apiClient.post('/apps', { code: 'x' })).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('PUT /apps/:id 更新 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/apps/app-lab', { name: '实验室 v2', enabled: false })
    expect(data.name).toBe('实验室 v2')
    expect(data.enabled).toBe(false)
  })

  it('DELETE /apps/:id 204 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const res = await apiClient.delete('/apps/app-finance')
    expect(res.status).toBe(204)
    await expect(apiClient.get('/apps/app-finance')).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('GET /menus?appId=xxx 返回该应用菜单 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/menus', { params: { appId: 'app-lab' } })
    expect(data.length).toBeGreaterThanOrEqual(4)
    expect(data.every((m: { appId: string }) => m.appId === 'app-lab')).toBe(true)
  })

  it('GET /menus/:id 含 appId 限定 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.get('/menus/m-lab-dash', { params: { appId: 'app-lab' } })
    expect(data.id).toBe('m-lab-dash')
  })

  it('GET /menus/:id 跨 appId 404 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(
      apiClient.get('/menus/m-lab-dash', { params: { appId: 'app-erp' } }),
    ).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('POST /menus 创建 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.post('/menus', {
      name: '报表中心', path: '/reports', appId: 'app-lab', sort: 5, enabled: true,
    })
    expect(data.id).toMatch(/^m-/)
    expect(data.name).toBe('报表中心')
  })

  it('POST /menus 缺 appId 400 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(apiClient.post('/menus', { name: 'x', path: '/x' })).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('POST /menus appId 不存在 400 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await expect(
      apiClient.post('/menus', { name: 'x', path: '/x', appId: 'app-ghost' }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('PUT /menus/:id 更新 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const { data } = await apiClient.put('/menus/m-lab-dash', { name: '实验室仪表盘', sort: 99 })
    expect(data.name).toBe('实验室仪表盘')
    expect(data.sort).toBe(99)
  })

  it('DELETE /menus/:id 204 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    const res = await apiClient.delete('/menus/m-erp-01')
    expect(res.status).toBe(204)
  })

  it('DELETE /apps/:id 一并清其菜单 [fn: M04.F01.I01, M04.F01.I07, M04.F01.I12, M04.F01.I02, M04.F01.I08, M04.F01.I09, M04.F01.I10, M04.F01.I11, M01.F01.I01, M01.F01.I02, M01.F01.I03, M01.F01.I04, M01.F01.I05, M01.F01.I06, M01.F01.I07, M01.F01.I08, M01.F01.I09, M01.F01.I10, M01.F01.I11]', async () => {
    await apiClient.delete('/apps/app-erp')
    const { data } = await apiClient.get('/menus', { params: { appId: 'app-erp' } })
    expect(data.length).toBe(0)
  })
})
