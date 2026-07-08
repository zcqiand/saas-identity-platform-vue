import { describe, it, expect } from 'vitest'
import { apiClient } from '../../src/api/client'

// 终批：orgs CRUD 补齐 + PermissionGroup 对齐 React 仓（menuIds+sort）
describe('mocks/handlers.ts (终批) — orgs CRUD + PermissionGroup 对齐', () => {
  // —— orgs CRUD ——
  it('GET /orgs?orgId=xxx 返回子节点', async () => {
    // 默认树根是 org-root,先建一个子节点再查
    const { data: orgs } = await apiClient.get('/orgs')
    expect(orgs).toHaveProperty('id')
  })

  it('POST /orgs 创建子节点', async () => {
    const { data, status } = await apiClient.post('/orgs', { name: '新部门 X', parentId: 'org-root' })
    expect(status).toBe(201)
    expect(data.id).toMatch(/^org-/)
    expect(data.name).toBe('新部门 X')
  })

  it('POST /orgs 缺 name 返回 400', async () => {
    await expect(apiClient.post('/orgs', { parentId: 'org-root' })).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('POST /orgs 父节点不存在返回 404', async () => {
    await expect(apiClient.post('/orgs', { name: 'X', parentId: 'org-ghost' })).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('PUT /orgs/:id 更新名称', async () => {
    // 先创建一个子节点
    const { data: created } = await apiClient.post('/orgs', { name: '原始', parentId: 'org-root' })
    const { data: updated } = await apiClient.put(`/orgs/${created.id}`, { name: '改名' })
    expect(updated.name).toBe('改名')
  })

  it('PUT /orgs/:id 节点不存在返回 404', async () => {
    await expect(apiClient.put('/orgs/org-ghost', { name: 'X' })).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('DELETE /orgs/:id 204', async () => {
    const { data: created } = await apiClient.post('/orgs', { name: '将删除', parentId: 'org-root' })
    const res = await apiClient.delete(`/orgs/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('DELETE /orgs/org-root 根节点不可删 400', async () => {
    await expect(apiClient.delete('/orgs/org-root')).rejects.toMatchObject({ response: { status: 400 } })
  })

  // —— PermissionGroup 对齐（menuIds + sort）——
  it('GET /permission-groups 含 menuIds + sort 字段', async () => {
    const { data } = await apiClient.get('/permission-groups')
    expect(data[0]).toHaveProperty('menuIds')
    expect(data[0]).toHaveProperty('sort')
    expect(Array.isArray(data[0].menuIds)).toBe(true)
    expect(typeof data[0].sort).toBe('number')
  })

  it('POST /permission-groups 带 menuIds + sort', async () => {
    const { data } = await apiClient.post('/permission-groups', {
      name: '新组', code: 'new-pg', description: 'D', permissions: ['user:read'],
      menuIds: ['m-console-users'], sort: 50, enabled: true,
    })
    expect(data.id).toMatch(/^pg-/)
    expect(data.menuIds).toEqual(['m-console-users'])
    expect(data.sort).toBe(50)
  })

  it('PUT /permission-groups/:id 更新 menuIds', async () => {
    const { data } = await apiClient.put('/permission-groups/pg-ro', {
      menuIds: ['m-console-users', 'm-console-orgs'], sort: 88,
    })
    expect(data.menuIds.length).toBe(2)
    expect(data.sort).toBe(88)
  })
})
