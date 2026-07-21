// @entry M06.F04.I01
// @entry M06.F04.I02
// @entry M06.F04.I03
// @entry M06.F04.I04
// @entry M06.F04.I05
// @entry M06.F04.I01
// @entry M06.F04.I02
// @entry M06.F04.I03
// @entry M06.F04.I04
// @entry M06.F04.I05
// @entry M06.F04.I01
// @entry M06.F04.I02
// @entry M06.F04.I03
// @entry M06.F04.I04
// @entry M06.F04.I05
// @entry M06.F04.I01
// @entry M06.F04.I02
// @entry M06.F04.I03
// @entry M06.F04.I04
// @entry M06.F04.I05
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSecurityStore } from '@/stores/security'

const sec = useSecurityStore()
const form = ref({ accessTokenTtl: 3600, refreshTokenTtl: 604800, refreshTokenEnabled: true, tokenRevocationEnabled: true })

onMounted(async () => { await sec.fetchTokenConfig() })
watch(() => sec.tokenConfig, (cfg) => {
  if (cfg) form.value = { ...cfg }
}, { immediate: true })

async function submit() {
  if (!sec.tokenConfig) return
  await sec.updateTokenConfig({ ...form.value })
  alert('已保存')
}
</script>

<template>
  <section data-fn="M06.F04.I01" data-testid="token-config-form">
    <h2 class="text-lg font-semibold mb-4">令牌配置</h2>
    <form class="bg-white p-6 rounded shadow max-w-md space-y-3 text-sm" @submit.prevent="submit">
      <label class="block"><span class="text-gray-700">访问令牌 TTL（秒）</span>
        <input v-model.number="form.accessTokenTtl" type="number" class="mt-1 w-full border rounded px-2 py-1">
      </label>
      <label class="block"><span class="text-gray-700">刷新令牌 TTL（秒）</span>
        <input v-model.number="form.refreshTokenTtl" type="number" class="mt-1 w-full border rounded px-2 py-1">
      </label>
      <label class="flex items-center gap-2"><input v-model="form.refreshTokenEnabled" type="checkbox"><span>启用 token 续期</span></label>
      <label class="flex items-center gap-2"><input v-model="form.tokenRevocationEnabled" type="checkbox"><span>启用 token 主动失效（登出后失效）</span></label>
      <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded">保存</button>
    </form>
  </section>
</template>
