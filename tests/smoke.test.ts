import { describe, it, expect } from 'vitest'
import { listTenants, findTenant } from '../mocks/db'

describe('smoke', () => {
  it('mock db seeds tenants', () => {
    expect(listTenants().length).toBeGreaterThan(0)
    expect(findTenant('acme')?.name).toBe('ACME 集团')
  })
})
