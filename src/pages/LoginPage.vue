<script setup lang="ts">
// M03.F01.I01 — 账号密码登录（独立布局：登录页绕过 AppShell）
//
// 提交：调 authLogin（orval 1:1 端点函数）；成功后写 tenant-store session；
// 失败：toast.error（vue-sonner）。

import { ref } from "vue";
import { useRouter } from "vue-router";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue"
import CardDescription from "../components/ui/card-description.vue"
import CardHeader from "../components/ui/card-header.vue"
import CardTitle from "../components/ui/card-title.vue"
import Input from "../components/ui/input.vue";
import Label from "../components/ui/label.vue";
import { useTenantStore } from "../state/tenant-store";
import { useBackendStore } from "../state/backend-context";
import { useAuthLogin } from "../api/endpoints/endpoints";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";

const DEMO_ACCOUNTS = [
  { username: "alice", tenant: "ACME Corp" },
  { username: "bob", tenant: "ACME Corp" },
  { username: "dave", tenant: "Globex Industries" },
  { username: "eve", tenant: "Initech" },
];

const username = ref("");
const password = ref("");
const router = useRouter();
const tenantStore = useTenantStore();
const backendStore = useBackendStore();
const loginMut = useAuthLogin();

async function onSubmit(e: Event) {
  e.preventDefault();
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
    const msg =
      apiErr.status === 401
        ? "用户名或密码错误"
        : apiErr.status === 0
          ? `后端不可达（${backendStore.backend}）：${apiErr.message}`
          : apiErr.message;
    toast.error(msg);
  }
}
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-100 via-white to-slate-200 p-4"
  >
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader class="space-y-2">
        <CardTitle class="text-lg">SaaS 多租户身份平台</CardTitle>
        <CardDescription>使用账号密码登录管理控制台</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit="onSubmit">
          <div class="space-y-2">
            <Label for="username">用户名</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="alice"
              required
              autocomplete="username"
            />
          </div>
          <div class="space-y-2">
            <Label for="password">密码</Label>
            <Input
              id="password"
              type="password"
              v-model="password"
              placeholder="请输入密码"
              required
              autocomplete="current-password"
            />
          </div>
          <Button
            type="submit"
            class="w-full"
            :disabled="loginMut.isPending.value"
            data-fn="M03.F01.I01"
          >
            {{ loginMut.isPending.value ? "登录中…" : "登录" }}
          </Button>
        </form>

        <div class="mt-6 pt-4 border-t space-y-4">
          <div class="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs space-y-2">
            <p class="font-medium text-amber-900">🔐 演示账号密码不公开</p>
            <p class="text-amber-800 leading-relaxed">
              如需体验，请通过下方任一方式获取最新演示密码：
            </p>
            <ul class="space-y-1 text-amber-800">
              <li class="flex items-center gap-2">
                <span
                  class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0"
                  >微</span
                >
                <span
                  >关注微信公众号
                  <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200"
                    >SaaS 实战派</code
                  >，回复「演示」</span
                >
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0"
                  >书</span
                >
                <span
                  >关注小红书
                  <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200"
                    >@SaaS 实战派</code
                  >，查看置顶笔记</span
                >
              </li>
            </ul>
          </div>

          <div class="text-xs text-slate-500 space-y-1">
            <p class="font-medium text-slate-700">演示账号（用户名公开，密码见上方）</p>
            <ul class="font-mono space-y-0.5">
              <li v-for="a in DEMO_ACCOUNTS" :key="a.username">
                {{ a.username }} · {{ a.tenant }}
              </li>
            </ul>
          </div>

          <p class="text-xs text-slate-400">
            当前后端模式：<span class="font-medium text-slate-700">{{ backendStore.backend }}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
