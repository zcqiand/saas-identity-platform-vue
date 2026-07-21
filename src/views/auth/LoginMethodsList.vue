// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M06.F02.I01
// @entry M06.F02.I02
// @entry M06.F02.I03
// @entry M06.F02.I04
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M06.F02.I01
// @entry M06.F02.I02
// @entry M06.F02.I03
// @entry M06.F02.I04
// @entry M01.F04.I01
// @entry M01.F04.I02
// @entry M01.F04.I03
// @entry M01.F04.I04
// @entry M01.F04.I05
// @entry M06.F02.I01
// @entry M06.F02.I02
// @entry M06.F02.I03
// @entry M06.F02.I04
// @entry M01.F04.I04
// @entry M06.F02.I01
// @entry M06.F02.I02
// @entry M06.F02.I03
// @entry M06.F02.I04
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSecurityStore } from '@/stores/security'

// ch40 登录方式：合并 3 个子区（登录方式 / SSO / OAuth2）
const sec = useSecurityStore()
const activeTab = ref<'login' | 'sso' | 'oauth'>('login')

onMounted(async () => {
  await Promise.all([sec.fetchLoginMethods(), sec.fetchSsoProviders(), sec.fetchOAuth2Providers()])
})

async function toggleLoginMethod(id: string, enabled: boolean) {
  await sec.updateLoginMethod(id, { enabled })
}
async function toggleSsoProvider(id: string, enabled: boolean) {
  await sec.updateSsoProvider(id, { enabled })
}
async function toggleOAuth2Provider(id: string, enabled: boolean) {
  await sec.updateOAuth2Provider(id, { enabled })
}
</script>

<template>
  <section data-fn="M06.F02.I01" data-testid="login-methods-list">
    <header class="mb-4">
      <h2 class="text-lg font-semibold">登录方式</h2>
      <p class="text-xs text-gray-500">配置租户可用的登录方式、SSO、第三方 OAuth2</p>
    </header>

    <nav class="flex gap-1 border-b mb-4 text-sm">
      <button :class="['px-3 py-2', activeTab === 'login' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600']" @click="activeTab = 'login'">登录方式 ({{ sec.loginMethods.length }})</button>
      <button :class="['px-3 py-2', activeTab === 'sso' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600']" @click="activeTab = 'sso'">SSO ({{ sec.ssoProviders.length }})</button>
      <button :class="['px-3 py-2', activeTab === 'oauth' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600']" @click="activeTab = 'oauth'">OAuth2 ({{ sec.oauth2Providers.length }})</button>
    </nav>

    <!-- 登录方式 -->
    <table v-if="activeTab === 'login'" class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr><th class="px-3 py-2">方式</th><th class="px-3 py-2">名称</th><th class="px-3 py-2">说明</th><th class="px-3 py-2">启用</th></tr>
      </thead>
      <tbody>
        <tr v-for="m in sec.loginMethods" :key="m.id" data-testid="login-method-row" class="border-t">
          <td class="px-3 py-2 font-mono text-xs text-gray-600">{{ m.method }}</td>
          <td class="px-3 py-2 font-medium">{{ m.name }}</td>
          <td class="px-3 py-2 text-gray-600">{{ m.description ?? '—' }}</td>
          <td class="px-3 py-2">
            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" :checked="m.enabled" @change="toggleLoginMethod(m.id, ($event.target as HTMLInputElement).checked)">
            </label>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- SSO -->
    <table v-else-if="activeTab === 'sso'" class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr><th class="px-3 py-2">名称</th><th class="px-3 py-2">类型</th><th class="px-3 py-2">Client ID</th><th class="px-3 py-2">Issuer URL</th><th class="px-3 py-2">启用</th></tr>
      </thead>
      <tbody>
        <tr v-for="p in sec.ssoProviders" :key="p.id" data-testid="sso-provider-row" class="border-t">
          <td class="px-3 py-2 font-medium">{{ p.name }}</td>
          <td class="px-3 py-2 text-gray-600 uppercase">{{ p.type }}</td>
          <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ p.clientId ?? '—' }}</td>
          <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ p.issuerUrl ?? '—' }}</td>
          <td class="px-3 py-2"><input type="checkbox" :checked="p.enabled" @change="toggleSsoProvider(p.id, ($event.target as HTMLInputElement).checked)"></td>
        </tr>
      </tbody>
    </table>

    <!-- OAuth2 -->
    <table v-else class="w-full text-sm bg-white shadow rounded">
      <thead class="bg-gray-50 text-left">
        <tr><th class="px-3 py-2">名称</th><th class="px-3 py-2">平台</th><th class="px-3 py-2">Client ID</th><th class="px-3 py-2">启用</th></tr>
      </thead>
      <tbody>
        <tr v-for="p in sec.oauth2Providers" :key="p.id" data-testid="oauth2-provider-row" class="border-t">
          <td class="px-3 py-2 font-medium">{{ p.name }}</td>
          <td class="px-3 py-2 text-gray-600">{{ p.provider }}</td>
          <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ p.clientId ?? '—' }}</td>
          <td class="px-3 py-2"><input type="checkbox" :checked="p.enabled" @change="toggleOAuth2Provider(p.id, ($event.target as HTMLInputElement).checked)"></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
