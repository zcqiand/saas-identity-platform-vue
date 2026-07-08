// ch41 useVirtualList：大列表虚拟滚动（定高计算可见区间）
import { computed, unref, type ComputedRef, type Ref } from 'vue'

export interface VirtualListOptions {
  /** 每项固定高度（px） */
  itemHeight: number
  /** 视口高度（px） */
  viewportHeight: number
  /** 当前滚动条偏移（px） */
  scrollTop: Ref<number> | number
  /** 上下额外缓冲的项数（默认 5） */
  overscan?: number
}

export interface VirtualListResult<T> {
  visibleItems: ComputedRef<T[]>
  startIndex: ComputedRef<number>
  endIndex: ComputedRef<number>
  totalHeight: ComputedRef<number>
  offsetY: ComputedRef<number>
}

/**
 * 计算虚拟列表的可见区间（定高模型）。
 * - startIndex = floor(scrollTop / itemHeight) - overscan（>=0）
 * - visibleCount = ceil(viewportHeight / itemHeight) + 2*overscan
 * - endIndex = min(startIndex + visibleCount, source.length)
 *
 * 用法：把 scrollTop 绑定到容器的 @scroll，visibleItems 渲染到带 translateY(offsetY) 的内层容器。
 */
export function useVirtualList<T>(source: Ref<T[]> | T[], options: VirtualListOptions): VirtualListResult<T> {
  const overscan = options.overscan ?? 5

  const totalHeight = computed(() => unref(source).length * options.itemHeight)

  const startIndex = computed(() => {
    const raw = Math.floor(unref(options.scrollTop) / options.itemHeight) - overscan
    return Math.max(0, raw)
  })

  const visibleCount = computed(() => {
    return Math.ceil(options.viewportHeight / options.itemHeight) + 2 * overscan
  })

  const endIndex = computed(() => {
    return Math.min(unref(source).length, startIndex.value + visibleCount.value)
  })

  const visibleItems = computed(() => {
    const arr = unref(source)
    return arr.slice(startIndex.value, endIndex.value)
  })

  const offsetY = computed(() => startIndex.value * options.itemHeight)

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  }
}
