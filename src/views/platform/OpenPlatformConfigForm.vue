// @entry M06.F07.I01
// @entry M06.F07.I02
// @entry M06.F07.I03
// @entry M06.F07.I04
// @entry M06.F07.I05
// @entry M06.F07.I06
// @entry M06.F07.I01
// @entry M06.F07.I02
// @entry M06.F07.I03
// @entry M06.F07.I04
// @entry M06.F07.I05
// @entry M06.F07.I06
// @entry M06.F07.I01
// @entry M06.F07.I02
// @entry M06.F07.I03
// @entry M06.F07.I04
// @entry M06.F07.I05
// @entry M06.F07.I06
// @entry M06.F07.I01
// @entry M06.F07.I02
// @entry M06.F07.I03
// @entry M06.F07.I04
// @entry M06.F07.I05
// @entry M06.F07.I06
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSecurityStore } from '@/stores/security'

const sec = useSecurityStore()
const form = ref({ apiEnabled: true, webhookEnabled: true, sdkEnabled: false, openScopesText: 'user:read,org:read', callbackWhitelistText: '' })

onMounted(async () => { await sec.fetchOpenPlatformConfig() })
watch(() => sec.openPlatformConfig, (cfg) => {
  if (!cfg) return
  form.value = {
    apiEnabled: cfg.apiEnabled,
    webhookEnabled: cfg.webhookEnabled,
    sdkEnabled: cfg.sdkEnabled,
    openScopesText: cfg.openScopes.join(','),
    callbackWhitelistText: cfg.callbackWhitelist.join('\n'),
  }
}, { immediate: true })

async function submit() {
  await sec.updateOpenPlatformConfig({
    apiEnabled: form.value.apiEnabled,
    webhookEnabled: form.value.webhookEnabled,
    sdkEnabled: form.value.sdkEnabled,
    openScopes: form.value.openScopesText.split(',').map((s) => s.trim()).filter(Boolean),
    callbackWhitelist: form.value.callbackWhitelistText.split('\n').map((s) => s.trim()).filter(Boolean),
  })
  alert('已保存')
}
</script>

<template>
  <section data-fn="M06.F07.I01" data-testid="open-platform-config-form">
    <h2 class="text-lg font-semibold mb-4">开放平台</h2>
    <form class="bg-white p-6 rounded shadow max-w-2xl space-y-3 text-sm" @submit.prevent="submit">
      <label class="flex items-center gap-2"><input v-model="form.apiEnabled" type="checkbox"><span>开放 API</span></label>
      <label class="flex items-center gap-2"><input v-model="form.webhookEnabled" type="checkbox"><span>开放 Webhook</span></label>
      <label class="flex items-center gap-2"><input v-model="form.sdkEnabled" type="checkbox"><span>开放 SDK 下载</span></label>
      <label class="block"><span class="text-gray-700">开放范围（英文逗号分隔）</span>
        <input v-model="form.openScopesText" class="mt-1 w-full border rounded px-2 py-1 font-mono"></label>
      <label class="block"><span class="text-gray-700">回调白名单（每行一个 URL）</span>
        <textarea v-model="form.callbackWhitelistText" rows="3" class="mt-1 w-full border rounded px-2 py-1 font-mono" /></label>
      <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded">保存</button>
    </form>
  </section>
</template>
