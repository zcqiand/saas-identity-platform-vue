import { describe, it, expect } from 'vitest'
import { apiClient } from '../../src/api/client'

// Phase 5d 终批：departments CRUD 补齐 + PermissionGroup 对齐 React 仓（menuIds+sort）
// v0.3.0 重命名（原 orgs → departments）
describe('mocks/handlers.ts (终批) — departments CRUD + PermissionGroup 对齐', () => {
  // —— departments CRUD ——
  it('GET /departments 返回根节点 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const { data: departments } = await apiClient.get('/departments')
    expect(departments).toHaveProperty('id')
  })

  it('POST /departments 创建子节点 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const { data, status } = await apiClient.post('/departments', { name: '新部门 X', parentId: 'department-root' })
    expect(status).toBe(201)
    expect(data.id).toMatch(/^department-/)
    expect(data.name).toBe('新部门 X')
  })

  it('POST /departments 缺 name 返回 400 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    await expect(apiClient.post('/departments', { parentId: 'department-root' })).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('POST /departments 父节点不存在返回 404 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    await expect(apiClient.post('/departments', { name: 'X', parentId: 'department-ghost' })).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('PUT /departments/:id 更新名称 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    // 先创建一个子节点
    const { data: created } = await apiClient.post('/departments', { name: '原始', parentId: 'department-root' })
    const { data: updated } = await apiClient.put(`/departments/${created.id}`, { name: '改名' })
    expect(updated.name).toBe('改名')
  })

  it('PUT /departments/:id 节点不存在返回 404 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    await expect(apiClient.put('/departments/department-ghost', { name: 'X' })).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('DELETE /departments/:id 204 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    const { data: created } = await apiClient.post('/departments', { name: '将删除', parentId: 'department-root' })
    const res = await apiClient.delete(`/departments/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('DELETE /departments/department-root 根节点不可删 400 [fn: M06.F02.I01, M06.F03.I01, M06.F05.I01, M06.F06.I01, M02.F01.I01, M02.F01.I03, M02.F01.I04, M02.F01.I05, M02.F01.I06, M02.F01.I07, M02.F01.I08, M02.F01.I09]', async () => {
    await expect(apiClient.delete('/departments/department-root')).rejects.toMatchObject({ response: { status: 400 } })
  })
  // permission-group tests moved to permissionsExtHandlers.test.ts (避免重复)
})
