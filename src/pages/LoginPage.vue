<template>
  <form
    @submit.prevent="onSubmit"
    style="padding: 32px; max-width: 360px; margin: 60px auto; border: 1px solid #eee; border-radius: 8px"
  >
    <h2 style="margin-top: 0">登录 SaaS Identity Platform</h2>
    <label style="display: block; margin-bottom: 12px">
      <span style="display: block; font-size: 13px; margin-bottom: 4px">用户名</span>
      <input
        v-model="username"
        data-fn="M03.F01.I01"
        style="display: block; width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px"
      />
    </label>
    <label style="display: block; margin-bottom: 16px">
      <span style="display: block; font-size: 13px; margin-bottom: 4px">密码</span>
      <input
        type="password"
        v-model="password"
        data-fn="M03.F01.I01"
        style="display: block; width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px"
      />
    </label>

    <div
      style="
        background: #fffbeb;
        border: 1px solid #fcd34d;
        border-radius: 6px;
        padding: 12px;
        font-size: 12px;
        margin-bottom: 16px;
        line-height: 1.6;
      "
    >
      <p style="font-weight: 600; color: #92400e; margin: 0 0 6px 0">🔐 演示账号密码不公开</p>
      <p style="color: #92400e; margin: 0 0 6px 0">
        如需体验，请通过下方任一方式获取最新演示密码：
      </p>
      <ul style="list-style: none; padding: 0; margin: 0; color: #92400e">
        <li style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px">
          <span
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #10b981;
              color: #fff;
              font-size: 10px;
              font-weight: 700;
              flex-shrink: 0;
            "
            >微</span
          >
          关注微信公众号 <code style="font-family: monospace; background: #fff; padding: 1px 4px; border-radius: 3px; border: 1px solid #fcd34d">SaaS 实战派</code>，回复「演示」
        </li>
        <li style="display: flex; align-items: center; gap: 6px">
          <span
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #ef4444;
              color: #fff;
              font-size: 10px;
              font-weight: 700;
              flex-shrink: 0;
            "
            >书</span
          >
          关注小红书 <code style="font-family: monospace; background: #fff; padding: 1px 4px; border-radius: 3px; border: 1px solid #fcd34d">@SaaS 实战派</code>，查看置顶笔记
        </li>
      </ul>
      <p v-if="demoUsernames.length" style="color: #92400e; margin: 8px 0 0 0; font-size: 11px">
        可用用户名：<span style="font-family: monospace">{{ demoUsernames.join(" / ") }}</span>
      </p>
    </div>

    <button
      type="submit"
      :disabled="loginMut.isPending.value"
      style="
        width: 100%;
        padding: 10px;
        background: #1f2937;
        color: #fff;
        border: 0;
        border-radius: 4px;
        cursor: pointer;
      "
      data-fn="M03.F01.I01"
    >
      {{ loginMut.isPending.value ? "登录中…" : "登录" }}
    </button>
    <p v-if="errorMessage" style="color: #c00; margin: 12px 0 0 0; font-size: 13px">
      登录失败：{{ errorMessage }}
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthLogin } from "../api/endpoints/endpoints";
import { useTenantStore } from "../state/tenant-store";
import { toApiError } from "../api/http-client";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const demoUsernames = ref<string[]>([]);

const router = useRouter();
const tenantStore = useTenantStore();
const loginMut = useAuthLogin();

async function onSubmit() {
  errorMessage.value = "";
  try {
    const res = await loginMut.mutateAsync({
      data: { username: username.value, password: password.value },
    });
    const { accessToken, refreshToken, userId, currentTenantId } = res.data;
    tenantStore.login({
      accessToken,
      refreshToken,
      userId,
      username: username.value,
      email: undefined,
      currentTenantId,
      tenantCode: null,
    });
    router.push("/tenants");
  } catch (err) {
    const apiErr = toApiError(err);
    errorMessage.value = apiErr.message;
    // 401 时从响应体取可用用户名清单（msw handler 透传）
    if (apiErr.status === 401 && apiErr.body?.availableUsernames) {
      demoUsernames.value = apiErr.body.availableUsernames;
    }
  }
}
</script>