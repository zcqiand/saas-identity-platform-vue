// ch41 useTable：列表分页 + 关键词搜索的通用组合（与 useResource 即 user store 解耦）
import { reactive, ref, type Ref } from 'vue'

export interface TableState<Q extends Record<string, unknown>> {
  page: number
  pageSize: number
  keyword: string
  query: Q
}

export interface UseTableOptions<Q extends Record<string, unknown>> {
  initialPageSize?: number
  initialQuery?: Q
  /** 搜索防抖延迟（ms，默认 300） */
  debounceMs?: number
}

/**
 * 提供 page/pageSize/keyword/query 响应式状态 + 下一页/上一页/重置等动作。
 * 数据获取由调用方（通常是某个 store action）在 watch 中触发。
 */
export function useTable<Q extends Record<string, unknown> = Record<string, unknown>>(
  options: UseTableOptions<Q> = {},
) {
  const state = reactive<TableState<Q>>({
    page: 1,
    pageSize: options.initialPageSize ?? 10,
    keyword: '',
    query: (options.initialQuery ?? {}) as Q,
  })

  const total = ref(0)
  const loading = ref(false)
  const debounceTimer: Ref<ReturnType<typeof setTimeout> | null> = ref(null)

  function nextPage(): void {
    const maxPage = Math.max(1, Math.ceil(total.value / state.pageSize))
    if (state.page < maxPage) state.page += 1
  }

  function prevPage(): void {
    if (state.page > 1) state.page -= 1
  }

  function setPage(page: number): void {
    const maxPage = Math.max(1, Math.ceil(total.value / state.pageSize))
    state.page = Math.min(Math.max(1, page), maxPage)
  }

  function setKeyword(kw: string, onSearch?: () => void): void {
    state.keyword = kw
    state.page = 1
    if (onSearch) {
      if (debounceTimer.value) clearTimeout(debounceTimer.value)
      debounceTimer.value = setTimeout(onSearch, options.debounceMs ?? 300)
    }
  }

  function reset(): void {
    state.page = 1
    state.keyword = ''
    Object.keys(state.query).forEach((k) => {
      ;(state.query as Record<string, unknown>)[k] = (options.initialQuery ?? {})[k]
    })
  }

  const totalPages = ref(0)
  function syncTotalPages(): void {
    totalPages.value = Math.max(1, Math.ceil(total.value / state.pageSize))
  }

  return {
    state,
    total,
    loading,
    totalPages,
    nextPage,
    prevPage,
    setPage,
    setKeyword,
    reset,
    syncTotalPages,
  }
}
