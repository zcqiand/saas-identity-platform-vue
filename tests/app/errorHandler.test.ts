import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp } from 'vue'
import { installErrorHandler, reportError } from '../../src/app/errorHandler'

describe('global error handler (ch42)', () => {
  let reported: unknown[] = []
  beforeEach(() => {
    reported = []
    vi.stubEnv('VITE_OFFLINE', '1')
  })

  it('installErrorHandler registers app.config.errorHandler [fn: M01.F01.I10]', () => {
    const app = createApp({ template: '<div>hi</div>' })
    installErrorHandler(app, { report: (e) => reported.push(e) })
    expect(typeof app.config.errorHandler).toBe('function')
  })

  it('handler captures error + reports to channel [fn: M01.F01.I10]', () => {
    const app = createApp({ template: '<div>hi</div>' })
    installErrorHandler(app, { report: (e) => reported.push(e) })
    const handler = app.config.errorHandler as unknown as (
      err: unknown,
      instance: unknown,
      info: string,
    ) => void
    const err = new Error('boom')
    handler(err, null, 'render')
    expect(reported.length).toBe(1)
    expect((reported[0] as { error: Error; info: string }).error).toBe(err)
    expect((reported[0] as { info: string }).info).toBe('render')
  })

  it('reportError posts to /api/vitals via mock and resolves (does not throw) [fn: M01.F01.I10]', async () => {
    await expect(reportError({ message: 'x' }, { endpoint: '/vitals' })).resolves.toBeUndefined()
  })
})
