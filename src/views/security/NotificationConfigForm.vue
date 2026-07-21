// @entry M06.F05.I01
// @entry M06.F05.I02
// @entry M06.F05.I03
// @entry M06.F05.I04
// @entry M06.F05.I05
// @entry M06.F05.I06
// @entry M06.F05.I07
// @entry M06.F05.I08
// @entry M06.F05.I01
// @entry M06.F05.I02
// @entry M06.F05.I03
// @entry M06.F05.I04
// @entry M06.F05.I05
// @entry M06.F05.I06
// @entry M06.F05.I07
// @entry M06.F05.I08
// @entry M06.F05.I01
// @entry M06.F05.I02
// @entry M06.F05.I03
// @entry M06.F05.I04
// @entry M06.F05.I05
// @entry M06.F05.I06
// @entry M06.F05.I07
// @entry M06.F05.I08
// @entry M06.F05.I01
// @entry M06.F05.I02
// @entry M06.F05.I03
// @entry M06.F05.I04
// @entry M06.F05.I05
// @entry M06.F05.I06
// @entry M06.F05.I07
// @entry M06.F05.I08
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSecurityStore } from '@/stores/security'
import type { NotificationTrigger } from '@/types/security'

const sec = useSecurityStore()
const form = ref({ emailEnabled: true, smsEnabled: false, inAppEnabled: true })
const triggers = ref<NotificationTrigger[]>([])

onMounted(async () => { await sec.fetchNotificationConfig() })
watch(() => sec.notificationConfig, (cfg) => {
  if (!cfg) return
  form.value = { emailEnabled: cfg.emailEnabled, smsEnabled: cfg.smsEnabled, inAppEnabled: cfg.inAppEnabled }
  triggers.value = [...cfg.notifyOn]
}, { immediate: true })

const ALL_TRIGGERS: { value: NotificationTrigger; label: string }[] = [
  { value: 'login', label: '登录' },
  { value: 'password_change', label: '密码修改' },
  { value: 'security_alert', label: '安全告警' },
  { value: 'system', label: '系统通知' },
]

function toggleTrigger(t: NotificationTrigger, on: boolean) {
  if (on && !triggers.value.includes(t)) triggers.value = [...triggers.value, t]
  else if (!on) triggers.value = triggers.value.filter((x) => x !== t)
}

async function submit() {
  await sec.updateNotificationConfig({ ...form.value, notifyOn: triggers.value })
  alert('已保存')
}
</script>

<template>
  <section data-fn="M06.F05.I01" data-testid="notification-config-form">
    <h2 class="text-lg font-semibold mb-4">消息通知</h2>
    <form class="bg-white p-6 rounded shadow max-w-md space-y-3 text-sm" @submit.prevent="submit">
      <label class="flex items-center gap-2"><input v-model="form.emailEnabled" type="checkbox"><span>邮件通知</span></label>
      <label class="flex items-center gap-2"><input v-model="form.smsEnabled" type="checkbox"><span>短信通知</span></label>
      <label class="flex items-center gap-2"><input v-model="form.inAppEnabled" type="checkbox"><span>站内信</span></label>
      <fieldset class="border-t pt-3 mt-3">
        <legend class="text-gray-700 font-medium">触发类型</legend>
        <label v-for="t in ALL_TRIGGERS" :key="t.value" class="flex items-center gap-2 mt-1">
          <input type="checkbox" :checked="triggers.includes(t.value)" @change="toggleTrigger(t.value, ($event.target as HTMLInputElement).checked)">
          <span>{{ t.label }}</span>
        </label>
      </fieldset>
      <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded">保存</button>
    </form>
  </section>
</template>
