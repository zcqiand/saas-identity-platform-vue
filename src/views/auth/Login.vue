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
// 登录入口页（对齐 React pages/Login.tsx + M01.F04.I04）
// ch40 真实 SSO 跳转由 features/sso 实现；本页是入口占位，挂 data-fn 让 L5 认。

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { redirectToSso, generateState } from '../../composables/useSso'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

function onSsoLogin() {
  const state = generateState()
  redirectToSso({ state })
}

function onMockLogin() {
  // mock-friendly：直接拿 token 进 acme dashboard（与 React 仓 Login.tsx 占位一致）
  auth.token = 'mock-token'
  auth.user = { id: 'u-001', username: 'admin', displayName: '管理员', departmentId: 'department-acme' }
  router.replace('/acme/dashboard')
}
</script>

<template>
  <div data-fn="M01.F04.I01" class="min-h-screen flex items-center justify-center bg-gray-100">
    <div data-fn="M01.F04.I04" class="bg-white p-8 rounded shadow-md w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">登录</h2>
      <p class="text-gray-500 text-center text-sm mb-4">SaaS 多租户统一身份管理</p>
      <button
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2"
        @click="onSsoLogin"
      >
        SSO 登录
      </button>
      <button
        class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
        @click="onMockLogin"
      >
        跳过（mock 登录）
      </button>
    </div>
  </div>
</template>
