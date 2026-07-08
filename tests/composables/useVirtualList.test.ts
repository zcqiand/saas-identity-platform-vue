import { describe, it, expect } from 'vitest'
import { useVirtualList } from '../../src/composables/useVirtualList'

describe('useVirtualList (ch41)', () => {
  it('returns empty visible range for empty source', () => {
    const { visibleItems, startIndex, endIndex } = useVirtualList([], {
      itemHeight: 40,
      viewportHeight: 400,
      scrollTop: 0,
    })
    expect(visibleItems.value).toEqual([])
    expect(startIndex.value).toBe(0)
    expect(endIndex.value).toBe(0)
  })

  it('computes visible window for given scrollTop (with overscan buffer)', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `item-${i}`)
    const { visibleItems, startIndex, endIndex } = useVirtualList(items, {
      itemHeight: 40,
      viewportHeight: 400,
      scrollTop: 800,
    })
    // scrollTop=800 → 第一个完全可见项 = floor(800/40) = 20；overscan=5 → 渲染起点 = 15
    expect(startIndex.value).toBe(15)
    // 可见数量 = ceil(400/40) = 10，+2*overscan(10) → 渲染窗口 endIndex 至少 25
    expect(endIndex.value).toBeGreaterThanOrEqual(25)
    expect(visibleItems.value.length).toBeGreaterThan(0)
    expect(visibleItems.value[0]).toBe('item-15')
  })

  it('clamps endIndex to source length', () => {
    const items = Array.from({ length: 25 }, (_, i) => i)
    const { visibleItems, endIndex } = useVirtualList(items, {
      itemHeight: 40,
      viewportHeight: 400,
      scrollTop: 0,
    })
    expect(endIndex.value).toBeLessThanOrEqual(25)
    expect(visibleItems.value.length).toBeLessThanOrEqual(25)
  })

  it('totalHeight reflects source length * itemHeight', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const { totalHeight } = useVirtualList(items, {
      itemHeight: 40,
      viewportHeight: 400,
      scrollTop: 0,
    })
    expect(totalHeight.value).toBe(50 * 40)
  })
})
