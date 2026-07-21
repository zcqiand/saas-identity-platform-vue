// ch42 全局错误处理：app.config.errorHandler 捕获 + 上报 stub
// @entry M01.F01.I10
// @entry M01.F01.I01
// @entry M01.F01.I02
// @entry M01.F01.I03
// @entry M01.F01.I04
// @entry M01.F01.I05
// @entry M01.F01.I06
// @entry M01.F01.I07
// @entry M01.F01.I08
// @entry M01.F01.I09
// @entry M01.F01.I10
// @entry M01.F01.I11
// @entry M01.F01.I10
// @entry M01.F01.I01
// @entry M01.F01.I02
// @entry M01.F01.I03
// @entry M01.F01.I04
// @entry M01.F01.I05
// @entry M01.F01.I06
// @entry M01.F01.I07
// @entry M01.F01.I08
// @entry M01.F01.I09
// @entry M01.F01.I10
// @entry M01.F01.I11
// @entry M01.F01.I10
import type { App } from 'vue'
import { apiClient } from '../api/client'

export interface ErrorReport {
  error: unknown
  info: string
  instance: unknown
  timestamp: string
  /** 应用版本（由 vite define 注入） */
  version?: string
}

export interface ReportOptions {
  endpoint?: string
}

export interface ErrorHandlerOptions {
  /** 上报通道（默认走 reportError 到 /api/vitals） */
  report?: (report: ErrorReport) => void
}

/**
 * 安装全局 errorHandler：捕获 Vue 渲染/生命周期错误，转发到上报通道。
 * 上报失败不抛错（fire-and-forget），保证不影响渲染主流程。
 */
export function installErrorHandler(app: App, options: ErrorHandlerOptions = {}): void {
  const report = options.report ?? ((r: ErrorReport) => {
    void reportError(r).catch(() => {
      /* 上报失败静默：避免错误上报本身引发二次错误 */
    })
  })

  app.config.errorHandler = (err, instance, info) => {
    const payload: ErrorReport = {
      error: err,
      info,
      instance,
      timestamp: new Date().toISOString(),
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
    }
    report(payload)
    // 控制台保留原始错误（开发态可见）
    if (import.meta.env.DEV) {
      console.error('[Vue error]', err, info)
    }
  }
}

/**
 * 上报错误到后端（stub：网络不可达时不抛错）。
 * 默认走 apiClient（baseURL=/api）的 /vitals → 完整路径 /api/vitals。
 * 生产可替换为 Sentry/自建 APM。
 */
export async function reportError(
  payload: Partial<ErrorReport> & { message?: string },
  opts: ReportOptions = {},
): Promise<void> {
  const endpoint = opts.endpoint ?? '/vitals'
  try {
    await apiClient.post(endpoint, {
      type: 'error',
      ...payload,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    })
  } catch {
    // 静默：上报通道不可达时不影响主流程
  }
}
