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
// @entry M01.F01.I08
// @entry M01.F01.I09
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTenantStore } from '../stores/tenant'

const router = useRouter()
const route = useRoute()
const tenantStore = useTenantStore()

onMounted(() => {
  if (tenantStore.list.length === 0) {
    tenantStore.fetchTenants()
  }
})

function handleSwitch(newTenantId: string) {
  const query = route.query
  const q = Object.keys(query).length ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : ''
  router.push(`/${newTenantId}/dashboard${q}`)
}
</script>

<template>
  <div data-fn="M01.F01.I08" class="flex items-center gap-2">
    <span class="text-xs text-gray-500">切换租户：</span>
    <button
      v-for="t in tenantStore.list"
      :key="t.id"
      type="button"
      class="px-2 py-1 text-xs rounded border transition-colors"
      :class="tenantStore.current?.id === t.id
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
      @click="handleSwitch(t.id)"
    >
      {{ t.name }}
    </button>
  </div>
</template>
