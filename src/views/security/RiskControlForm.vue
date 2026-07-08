<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSecurityStore } from '@/stores/security'

const sec = useSecurityStore()
const form = ref({ anomalyDetectionEnabled: true, crossRegionAlertEnabled: true, deviceFingerprintEnabled: false, riskScoreThreshold: 70 })

onMounted(async () => { await sec.fetchRiskControl() })
watch(() => sec.riskControl, (cfg) => {
  if (cfg) form.value = { ...cfg }
}, { immediate: true })

async function submit() {
  await sec.updateRiskControl({ ...form.value })
  alert('已保存')
}
</script>

<template>
  <section data-testid="risk-control-form">
    <h2 class="text-lg font-semibold mb-4">风险控制</h2>
    <form class="bg-white p-6 rounded shadow max-w-md space-y-3 text-sm" @submit.prevent="submit">
      <label class="flex items-center gap-2"><input v-model="form.anomalyDetectionEnabled" type="checkbox"><span>异常登录检测</span></label>
      <label class="flex items-center gap-2"><input v-model="form.crossRegionAlertEnabled" type="checkbox"><span>异地登录告警</span></label>
      <label class="flex items-center gap-2"><input v-model="form.deviceFingerprintEnabled" type="checkbox"><span>设备指纹识别</span></label>
      <label class="block"><span class="text-gray-700">风险评分阈值（0-100）</span>
        <input v-model.number="form.riskScoreThreshold" type="number" min="0" max="100" class="mt-1 w-full border rounded px-2 py-1"></label>
      <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded">保存</button>
    </form>
  </section>
</template>
