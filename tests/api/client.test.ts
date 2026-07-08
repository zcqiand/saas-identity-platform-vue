import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../msw/server'
import { apiClient, setTenantId, setToken, getTenantId, resetApiClient } from '../../src/api/client'

// 通过 MSW handler 观测实际发出的请求头（最贴近真实契约）。
describe('api client interceptor (ch39/ch40)', () => {
  beforeEach(() => {
    resetApiClient()
  })

  it('injects X-Tenant-ID header from tenant store value', async () => {
    server.use(
      http.get('*/echo-headers', ({ request }) => {
        const tenant = request.headers.get('X-Tenant-ID')
        return HttpResponse.json({ tenant })
      }),
    )
    setTenantId('globex')
    const res = await apiClient.get<{ tenant: string | null }>('/echo-headers')
    expect(res.data.tenant).toBe('globex')
  })

  it('injects Authorization header when token set', async () => {
    server.use(
      http.get('*/echo-headers', ({ request }) => {
        const auth = request.headers.get('Authorization')
        return HttpResponse.json({ auth })
      }),
    )
    setToken('my-token')
    const res = await apiClient.get<{ auth: string | null }>('/echo-headers')
    expect(res.data.auth).toBe('Bearer my-token')
  })

  it('getTenantId returns current set value', () => {
    setTenantId('initech')
    expect(getTenantId()).toBe('initech')
  })

  it('omits X-Tenant-ID when not set', async () => {
    server.use(
      http.get('*/echo-headers', ({ request }) => {
        const tenant = request.headers.get('X-Tenant-ID')
        return HttpResponse.json({ tenant })
      }),
    )
    const res = await apiClient.get<{ tenant: string | null }>('/echo-headers')
    expect(res.data.tenant).toBeNull()
  })
})
