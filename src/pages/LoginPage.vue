<template>
  <form @submit.prevent="onSubmit" style="padding: 32px; max-width: 360px; margin: 60px auto">
    <h2>登录 SaaS Identity Platform</h2>
    <label>
      用户名
      <input v-model="username" data-fn="M03.F01.I01" style="display: block; width: 100%; padding: 8px; margin-top: 4px" />
    </label>
    <label style="margin-top: 12px; display: block">
      密码
      <input
        type="password"
        v-model="password"
        data-fn="M03.F01.I01"
        style="display: block; width: 100%; padding: 8px; margin-top: 4px"
      />
    </label>
    <button type="submit" style="margin-top: 16px; padding: 8px 16px" data-fn="M03.F01.I01">登录</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useTenantStore } from "../state/tenant-store";

const username = ref("");
const password = ref("");
const tenantStore = useTenantStore();
const router = useRouter();

function onSubmit() {
  // In real app: POST /api/auth/login
  tenantStore.setTenant("00000000-0000-0000-0000-000000000001", "acme", "mock-jwt-token");
  router.push("/tenants");
}
</script>