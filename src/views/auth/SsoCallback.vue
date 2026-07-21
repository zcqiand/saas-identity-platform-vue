// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// SSO 回调处理页（对齐 React features/sso/SsoCallback.tsx + M01.F04.I03）
// 从 URL ?code= 取授权码 → 调 useSso.handleSsoCallback 换 token → 跳 dashboard。
// 失败或无 code 跳回 /login。

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { handleSsoCallback } from '../../composables/useSso'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const status = ref<'loading' | 'error' | 'success'>('loading')
const errorMsg = ref<string | null>(null)
let processed = false

onMounted(async () => {
  if (processed) return
  processed = true

  const code = String(route.query.code ?? '')
  if (!code) {
    status.value = 'error'
    errorMsg.value = '缺少授权码'
    setTimeout(() => router.replace('/login'), 800)
    return
  }

  try {
    const result = await handleSsoCallback(code, 'sso')
    auth.token = result.token
    auth.user = result.user
    status.value = 'success'
    setTimeout(() => router.replace('/acme/dashboard'), 400)
  } catch (err) {
    status.value = 'error'
    errorMsg.value = err instanceof Error ? err.message : 'SSO 回调失败'
    setTimeout(() => router.replace('/login'), 800)
  }
})
</script>

<template>
  <div data-fn="M01.F04.I01" class="min-h-screen flex items-center justify-center bg-gray-100">
    <div data-fn="M01.F04.I03" class="bg-white p-8 rounded shadow-md w-96 text-center">
      <template v-if="status === 'loading'">
        <p class="text-gray-600">SSO 回调处理中…</p>
      </template>
      <template v-else-if="status === 'error'">
        <p class="text-red-600 font-semibold mb-2">SSO 登录失败</p>
        <p class="text-gray-500 text-sm">{{ errorMsg }}</p>
      </template>
      <template v-else>
        <p class="text-green-600 font-semibold">登录成功，正在跳转…</p>
      </template>
    </div>
  </div>
</template>
