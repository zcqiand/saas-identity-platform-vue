import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'
import { resetMockDb } from '../mocks/db'
import { resetApiClient } from '../src/api/client'

// MSW 全局 server 生命周期：所有测试统一拦截后端请求与 OAuth2 授权服务器，无真实网络。
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
  resetMockDb()
  resetApiClient()
})
afterAll(() => server.close())
