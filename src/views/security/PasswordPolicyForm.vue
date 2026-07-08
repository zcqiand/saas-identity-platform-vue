<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSecurityStore } from '@/stores/security'

const sec = useSecurityStore()
const form = ref({ minLength: 8, requireUppercase: true, requireLowercase: true, requireDigit: true, requireSpecial: false, expireDays: 90, historyCount: 5, enabled: true })

onMounted(async () => { await sec.fetchPasswordPolicy() })
watch(() => sec.passwordPolicy, (cfg) => {
  if (cfg) form.value = { ...cfg }
}, { immediate: true })

async function submit() {
  await sec.updatePasswordPolicy({ ...form.value })
  alert('已保存')
}
</script>

<template>
  <section data-testid="password-policy-form">
    <h2 class="text-lg font-semibold mb-4">密码策略</h2>
    <form class="bg-white p-6 rounded shadow max-w-md space-y-3 text-sm" @submit.prevent="submit">
      <label class="block"><span class="text-gray-700">最小长度</span>
        <input v-model.number="form.minLength" type="number" min="6" max="32" class="mt-1 w-full border rounded px-2 py-1"></label>
      <label class="flex items-center gap-2"><input v-model="form.requireUppercase" type="checkbox"><span>需要大写字母</span></label>
      <label class="flex items-center gap-2"><input v-model="form.requireLowercase" type="checkbox"><span>需要小写字母</span></label>
      <label class="flex items-center gap-2"><input v-model="form.requireDigit" type="checkbox"><span>需要数字</span></label>
      <label class="flex items-center gap-2"><input v-model="form.requireSpecial" type="checkbox"><span>需要特殊字符</span></label>
      <label class="block"><span class="text-gray-700">过期天数（0 = 永不过期）</span>
        <input v-model.number="form.expireDays" type="number" min="0" class="mt-1 w-full border rounded px-2 py-1"></label>
      <label class="block"><span class="text-gray-700">历史密码数量（不可重复）</span>
        <input v-model.number="form.historyCount" type="number" min="0" class="mt-1 w-full border rounded px-2 py-1"></label>
      <label class="flex items-center gap-2"><input v-model="form.enabled" type="checkbox"><span>启用</span></label>
      <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded">保存</button>
    </form>
  </section>
</template>
