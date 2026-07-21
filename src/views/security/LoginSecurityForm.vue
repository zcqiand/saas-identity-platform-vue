// @entry M06.F01.I01
// @entry M06.F01.I02
// @entry M06.F01.I03
// @entry M06.F01.I04
// @entry M06.F01.I05
// @entry M06.F01.I06
// @entry M06.F01.I07
// @entry M06.F01.I08
// @entry M06.F01.I01
// @entry M06.F01.I02
// @entry M06.F01.I03
// @entry M06.F01.I04
// @entry M06.F01.I05
// @entry M06.F01.I06
// @entry M06.F01.I07
// @entry M06.F01.I08
// @entry M06.F01.I01
// @entry M06.F01.I02
// @entry M06.F01.I03
// @entry M06.F01.I04
// @entry M06.F01.I05
// @entry M06.F01.I06
// @entry M06.F01.I07
// @entry M06.F01.I08
// @entry M06.F01.I01
// @entry M06.F01.I02
// @entry M06.F01.I03
// @entry M06.F01.I04
// @entry M06.F01.I05
// @entry M06.F01.I06
// @entry M06.F01.I07
// @entry M06.F01.I08
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSecurityStore } from '@/stores/security'

const sec = useSecurityStore()
const form = ref({ ipWhitelistText: '', ipBlacklistText: '', regionRestrictionEnabled: false, allowedRegionsText: 'CN,US', failedAttemptLockEnabled: true, lockThreshold: 5, lockDuration: 900 })

onMounted(async () => { await sec.fetchLoginSecurity() })
watch(() => sec.loginSecurity, (cfg) => {
  if (!cfg) return
  form.value = {
    ipWhitelistText: cfg.ipWhitelist.join('\n'),
    ipBlacklistText: cfg.ipBlacklist.join('\n'),
    regionRestrictionEnabled: cfg.regionRestrictionEnabled,
    allowedRegionsText: cfg.allowedRegions.join(','),
    failedAttemptLockEnabled: cfg.failedAttemptLockEnabled,
    lockThreshold: cfg.lockThreshold,
    lockDuration: cfg.lockDuration,
  }
}, { immediate: true })

async function submit() {
  await sec.updateLoginSecurity({
    ipWhitelist: form.value.ipWhitelistText.split('\n').map((s) => s.trim()).filter(Boolean),
    ipBlacklist: form.value.ipBlacklistText.split('\n').map((s) => s.trim()).filter(Boolean),
    regionRestrictionEnabled: form.value.regionRestrictionEnabled,
    allowedRegions: form.value.allowedRegionsText.split(',').map((s) => s.trim()).filter(Boolean),
    failedAttemptLockEnabled: form.value.failedAttemptLockEnabled,
    lockThreshold: form.value.lockThreshold,
    lockDuration: form.value.lockDuration,
  })
  alert('已保存')
}
</script>

<template>
  <section data-fn="M06.F01.I01" data-testid="login-security-form">
    <h2 class="text-lg font-semibold mb-4">登录安全</h2>
    <form class="bg-white p-6 rounded shadow max-w-2xl space-y-3 text-sm" @submit.prevent="submit">
      <label class="block"><span class="text-gray-700">IP 白名单（每行一个 CIDR 或 IP）</span>
        <textarea v-model="form.ipWhitelistText" rows="3" class="mt-1 w-full border rounded px-2 py-1 font-mono" /></label>
      <label class="block"><span class="text-gray-700">IP 黑名单（每行一个 CIDR 或 IP）</span>
        <textarea v-model="form.ipBlacklistText" rows="3" class="mt-1 w-full border rounded px-2 py-1 font-mono" /></label>
      <label class="flex items-center gap-2"><input v-model="form.regionRestrictionEnabled" type="checkbox"><span>启用地区限制</span></label>
      <label class="block"><span class="text-gray-700">允许地区（英文逗号分隔）</span>
        <input v-model="form.allowedRegionsText" class="mt-1 w-full border rounded px-2 py-1"></label>
      <label class="flex items-center gap-2"><input v-model="form.failedAttemptLockEnabled" type="checkbox"><span>启用登录失败锁定</span></label>
      <label class="block"><span class="text-gray-700">锁定阈值（次）</span>
        <input v-model.number="form.lockThreshold" type="number" class="mt-1 w-full border rounded px-2 py-1"></label>
      <label class="block"><span class="text-gray-700">锁定时长（秒）</span>
        <input v-model.number="form.lockDuration" type="number" class="mt-1 w-full border rounded px-2 py-1"></label>
      <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded">保存</button>
    </form>
  </section>
</template>
