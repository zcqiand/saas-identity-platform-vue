// @entry M05.F01.I01
// @entry M05.F01.I02
// @entry M05.F01.I03
// @entry M05.F01.I04
// @entry M05.F01.I05
// @entry M05.F01.I06
// @entry M05.F01.I07
// @entry M05.F01.I08
// @entry M05.F01.I09
// @entry M05.F01.I01
// @entry M05.F01.I02
// @entry M05.F01.I03
// @entry M05.F01.I04
// @entry M05.F01.I05
// @entry M05.F01.I06
// @entry M05.F01.I07
// @entry M05.F01.I08
// @entry M05.F01.I09
// @entry M05.F01.I01
// @entry M05.F01.I02
// @entry M05.F01.I03
// @entry M05.F01.I04
// @entry M05.F01.I05
// @entry M05.F01.I06
// @entry M05.F01.I07
// @entry M05.F01.I08
// @entry M05.F01.I09
// @entry M05.F01.I01
// @entry M05.F01.I02
// @entry M05.F01.I03
// @entry M05.F01.I04
// @entry M05.F01.I05
// @entry M05.F01.I06
// @entry M05.F01.I07
<script setup lang="ts">
// ch41 审计日志：shallowRef 大数据 + 虚拟滚动 + 分页 + action 过滤
import { onMounted, ref, shallowRef, watch, computed } from 'vue'
import { apiClient } from '../../api/client'
import { useVirtualList } from '../../composables/useVirtualList'
import type { AuditLog, AuditQuery, AuditAction, PageResult } from '../../types/user'

// shallowRef：审计日志条目多，整体替换避免深层响应式开销
const logs = shallowRef<AuditLog[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

const page = ref(1)
const pageSize = ref(20)
const actionFilter = ref<AuditAction | ''>('')

const scrollTop = ref(0)
const VIEWPORT_HEIGHT = 480
const ITEM_HEIGHT = 48

const { visibleItems, totalHeight, offsetY } = useVirtualList<AuditLog>(logs, {
  itemHeight: ITEM_HEIGHT,
  viewportHeight: VIEWPORT_HEIGHT,
  scrollTop,
  overscan: 4,
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

async function fetchLogs(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const query: AuditQuery & { action?: string } = {
      page: page.value,
      pageSize: pageSize.value,
      action: actionFilter.value || undefined,
    }
    const res = await apiClient.get<PageResult<AuditLog>>('/audit-logs', { params: query })
    logs.value = res.data.items
    total.value = res.data.total
  } catch (err) {
    error.value = extractErrorMessage(err, '审计日志加载失败')
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogs)
watch([page, actionFilter], fetchLogs)

function onScroll(e: Event): void {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}

function nextPage(): void {
  if (page.value < totalPages.value) page.value += 1
}

function prevPage(): void {
  if (page.value > 1) page.value -= 1
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
</script>

<template>
  <div data-fn="M05.F01.I01" class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">审计日志</h2>
      <select
        data-testid="action-filter"
        v-model="actionFilter"
        class="border rounded px-3 py-1.5 text-sm"
      >
        <option value="">全部操作</option>
        <option value="login">login</option>
        <option value="logout">logout</option>
        <option value="create">create</option>
        <option value="update">update</option>
        <option value="delete">delete</option>
        <option value="permission_change">permission_change</option>
      </select>
    </div>

    <div v-if="error" role="alert" class="text-red-600 text-sm bg-red-50 p-2 rounded">
      {{ error }}
    </div>

    <div class="bg-white rounded shadow overflow-hidden">
      <div
        class="overflow-auto"
        :style="{ height: VIEWPORT_HEIGHT + 'px' }"
        @scroll.passive="onScroll"
      >
        <div :style="{ height: totalHeight + 'px', position: 'relative' }">
          <div :style="{ transform: `translateY(${offsetY}px)` }">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 text-gray-600 sticky top-0">
                <tr>
                  <th class="px-4 py-2 text-left">时间</th>
                  <th class="px-4 py-2 text-left">操作</th>
                  <th class="px-4 py-2 text-left">操作人</th>
                  <th class="px-4 py-2 text-left">资源</th>
                  <th class="px-4 py-2 text-left">IP</th>
                  <th class="px-4 py-2 text-left">详情</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="log in visibleItems"
                  :key="log.id"
                  data-testid="audit-row"
                  class="border-t hover:bg-gray-50"
                  :style="{ height: ITEM_HEIGHT + 'px' }"
                >
                  <td class="px-4 py-2 whitespace-nowrap">{{ log.timestamp.replace('T', ' ').replace('Z', '') }}</td>
                  <td class="px-4 py-2">{{ log.action }}</td>
                  <td class="px-4 py-2">{{ log.operator }}</td>
                  <td class="px-4 py-2">{{ log.resource }}</td>
                  <td class="px-4 py-2">{{ log.ip }}</td>
                  <td class="px-4 py-2">{{ log.detail }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-600">
      <span>共 {{ total }} 条</span>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page <= 1"
          @click="prevPage()"
        >
          上一页
        </button>
        <span class="px-2 py-1">第 {{ page }} / {{ totalPages }} 页</span>
        <button
          data-testid="next-page"
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page >= totalPages"
          @click="nextPage()"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
