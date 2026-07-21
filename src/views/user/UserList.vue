// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
// @entry M02.F02.I08
// @entry M02.F02.I09
// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
// @entry M02.F02.I08
// @entry M02.F02.I09
// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
// @entry M02.F02.I08
// @entry M02.F02.I09
// @entry M02.F02.I01
// @entry M02.F02.I02
// @entry M02.F02.I03
// @entry M02.F02.I04
// @entry M02.F02.I05
// @entry M02.F02.I06
// @entry M02.F02.I07
<script setup lang="ts">
// ch41 用户列表：useTable（分页/搜索）+ useResource（user store）+ 角色分配
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../../stores/user'
import { useTable } from '../../composables/useTable'
import type { UserQuery, UserRole } from '../../types/user'

const userStore = useUserStore()
const { users, total, loading, error } = storeToRefs(userStore)

const table = useTable<{ role?: string; status?: string; orgId?: string }>({
  initialPageSize: 10,
})

// 把 table 内的 ref 暴露为 computed，模板直接用（避免 table.xxx ref 不自动解包）
const currentPage = computed(() => table.state.page)
const totalPages = computed(() => table.totalPages.value)
const keyword = computed(() => table.state.keyword)

async function load(): Promise<void> {
  const query: UserQuery = {
    page: table.state.page,
    pageSize: table.state.pageSize,
    keyword: table.state.keyword || undefined,
    role: table.state.query.role as UserRole | undefined,
    status: table.state.query.status as never,
    orgId: table.state.query.orgId,
  }
  await userStore.fetchUsers(query)
  table.total.value = total.value
  table.syncTotalPages()
}

onMounted(load)
watch(() => [table.state.page, table.state.pageSize], load)

function onKeywordInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  table.setKeyword(value, load)
}

async function onRoleChange(userId: string, e: Event): Promise<void> {
  const value = (e.target as HTMLSelectElement).value as UserRole
  await userStore.assignRoles(userId, [value])
}

function nextPage(): void {
  table.nextPage()
}

function prevPage(): void {
  table.prevPage()
}

const roleOptions: UserRole[] = ['admin', 'manager', 'member', 'viewer']
</script>

<template>
  <div data-fn="M02.F02.I01" class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">用户管理</h2>
      <input
        data-testid="keyword-input"
        :value="keyword"
        type="text"
        placeholder="搜索用户名/姓名/邮箱"
        class="border rounded px-3 py-1.5 text-sm w-64"
        @input="onKeywordInput"
      />
    </div>

    <div v-if="error" role="alert" class="text-red-600 text-sm bg-red-50 p-2 rounded">
      {{ error }}
    </div>

    <div class="bg-white rounded shadow overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-2 text-left">用户名</th>
            <th class="px-4 py-2 text-left">姓名</th>
            <th class="px-4 py-2 text-left">邮箱</th>
            <th class="px-4 py-2 text-left">组织</th>
            <th class="px-4 py-2 text-left">角色</th>
            <th class="px-4 py-2 text-left">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            data-testid="user-row"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-2">{{ user.username }}</td>
            <td class="px-4 py-2">{{ user.displayName }}</td>
            <td class="px-4 py-2">{{ user.email }}</td>
            <td class="px-4 py-2">{{ user.orgId }}</td>
            <td class="px-4 py-2">
              <select
                data-testid="role-select"
                class="border rounded px-2 py-1 text-xs"
                :value="user.roles[0]"
                @change="onRoleChange(user.id, $event)"
              >
                <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
              </select>
            </td>
            <td class="px-4 py-2">{{ user.status }}</td>
          </tr>
          <tr v-if="users.length === 0 && !loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-600">
      <span>共 {{ total }} 条</span>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="currentPage <= 1"
          @click="prevPage"
        >
          上一页
        </button>
        <span class="px-2 py-1">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button
          data-testid="next-page"
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
