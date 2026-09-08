<script setup lang="ts">
// M01.F04.I03 — 账号密码登录（独立布局：登录页绕过 AppShell）
//
// 提交：调 authLogin（orval 1:1 端点函数）；成功后写 tenant-store session；
// 失败：toast.error（vue-sonner）。
//
// SSO 返回（OAuth 2.0 授权码模式，RFC 6749）：URL 带 ?code=&redirect_uri=&state=
// （lab RP 经 /api/auth/sso/authorize 领 code 后跳来）。saas 认证资源所有者后，
// 302 redirect_uri?code&state（§4.1.2）原样透传给 RP。镜像 saas-nextjs app/login。
//
// M01.F04.I02 — 失败锁定（5 次/15min，后端阈值）：
// 423 + LockedAccountResponse → 锁定期间提交按钮禁用，显示倒计时到 lockedUntil。

import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue";
import CardDescription from "../components/ui/card-description.vue";
import CardHeader from "../components/ui/card-header.vue";
import CardTitle from "../components/ui/card-title.vue";
import Input from "../components/ui/input.vue";
import Label from "../components/ui/label.vue";
import { useTenantStore } from "../state/tenant-store";
import { getApiMode } from "../api/backend-config";
import { useSessionsLogin } from "../api/endpoints/auth/auth";
import { useOAuthAuthorize } from "../api/endpoints/oauth/oauth";
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
const apiMode = getApiMode();
const loginMut = useSessionsLogin();
const authorizeMut = useOAuthAuthorize();

// M03.F01 — RFC 6749 §4.1.1 跳板: ?client_id= 表示此次密码登录是给哪个 OAuth client。
// 直接打开登录页（无 client_id）时：取 VITE_LOGIN_CLIENT_ID env,无值则提示用户。
// 禁止 fallback 到 demo 字面量(ADR-0019)。
const loginClientId = computed(() => {
  const fromUrl = new URLSearchParams(window.location.search).get("client_id");
  if (fromUrl) return fromUrl;
  const fromEnv = (import.meta.env.VITE_LOGIN_CLIENT_ID ?? "").trim();
  if (fromEnv) return fromEnv;
  return "";
});

// M01.F04.I02 — 锁定状态（来自 423 LockedAccountResponse.lockedUntil）
const lockoutUntil = ref<Date | null>(null);
const nowTick = ref(Date.now());
let lockoutTicker: number | null = null;
function startLockoutTicker() {
  if (lockoutTicker !== null) return;
  // 1Hz tick — 倒计时按秒刷新
  lockoutTicker = window.setInterval(() => {
    nowTick.value = Date.now();
    // 锁定已过期 → 自动解锁（清状态 + 允许重试）
    if (lockoutUntil.value && nowTick.value >= lockoutUntil.value.getTime()) {
      clearLockout();
    }
  }, 1000);
}
function clearLockout() {
  lockoutUntil.value = null;
  if (lockoutTicker !== null) {
    window.clearInterval(lockoutTicker);
    lockoutTicker = null;
  }
}
onBeforeUnmount(() => clearLockout());
const lockoutRemaining = computed(() => {
  if (!lockoutUntil.value) return null;
  const ms = Math.max(0, lockoutUntil.value.getTime() - nowTick.value);
  const totalSec = Math.floor(ms / 1000);
  const mm = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const ss = (totalSec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
});
// RFC 6749 §4.1.1 授权码范式：lab 后端（confidential client）已替浏览器领到 code，
// saas 登录页只负责认证资源所有者，成功后 302 redirect_uri?code&state（§4.1.2）。
const oauthReturn = ref<{
  redirectUri: string;
  code: string;
  state: string;
} | null>(null);

// 解析 OAuth 2.0 authorize 回跳：?code=&redirect_uri=&state=
// 用 window.location.search 直接读，不依赖路由的 query 时序。
onMounted(() => {
  const sp = new URLSearchParams(window.location.search);
  const oauthCode = sp.get("code");
  const oauthRedirect = sp.get("redirect_uri");
  if (oauthCode && oauthRedirect) {
    oauthReturn.value = {
      redirectUri: oauthRedirect,
      code: oauthCode,
      state: sp.get("state") ?? "",
    };
  }
});

// RFC 6749 §4.1.2：授权码回跳不依赖 onSubmit —— 资源所有者已登录（saas session
// 已在）时无需再认证，解析出 code+redirect_uri 即刻回跳。否则已登录用户落在
// 登录页没表单可提交，code 永远回不到 RP。
onMounted(() => {
  if (!oauthReturn.value) return;
  try {
    const target = new URL(oauthReturn.value.redirectUri);
    target.searchParams.set("code", oauthReturn.value.code);
    if (oauthReturn.value.state) target.searchParams.set("state", oauthReturn.value.state);
    window.location.href = target.toString();
  } catch (err) {
    console.error("[SSO/login] auto oauth redirect failed:", err);
  }
});

// 2026-08-29 OAuth 2.0 跳板场景: lab RP 跳过来 ?redirect_uri=&state=&client_id=
// (无 ?code=,因为 lab 后端不再代理调 saas authorize),已登录用户必须主动调
// saas /api/v1/oauth/authorize 拿 code 跳回 RP(router guard 不跳 /tenants)。
// RFC 6749 §4.1.1: 资源所有者已 saas 登录 → authorize 端点用 session.UserId
// 签 code 绑 user/tenant,不再信 body.TenantId(已 v0.3.20 修)。
onMounted(async () => {
  if (oauthReturn.value) return; // 已有 code,走上面的回跳逻辑
  const sp = new URLSearchParams(window.location.search);
  const redirectUri = sp.get("redirect_uri");
  const state = sp.get("state") ?? "";
  const clientId = sp.get("client_id") ?? "";
  if (!redirectUri || !clientId) return; // 非 OAuth 跳板 URL
  if (!tenantStore.isAuthenticated) return; // 未登录,显示表单让用户输密码
  try {
    const res = await authorizeMut.mutateAsync({
      data: {
        clientId,
        redirectUri,
        responseType: "code",
        scope: "lab.read lab.write",
        state,      },
    });
    const target = new URL(redirectUri);
    target.searchParams.set("code", res.data.code);
    if (state) target.searchParams.set("state", state);
    window.location.href = target.toString();
  } catch (err) {
    console.error("[SSO/login] oauth authorize (logged-in user) failed:", err);
    // 留在登录页让用户手动重试输密码
  }
});

async function onSubmit(e: Event) {
  e.preventDefault();
  if (!loginClientId.value) {
    toast.error("缺少 clientId：请通过 OAuth 跳转访问，或配置 VITE_LOGIN_CLIENT_ID");
    return;
  }
  try {
    const res = await loginMut.mutateAsync({
      data: {
        username: username.value,
        password: password.value,
        clientId: loginClientId.value,
      },
    });
    const { accessToken, refreshToken } = res.data;
    if (!accessToken || !refreshToken) {
      toast.error("登录响应缺少 token，请联系管理员");
      return;
    }
    const userId = res.data.user?.id ?? "";
    const currentTenantId = res.data.availableTenants?.[0]?.tenantId ?? "";
    tenantStore.login({
      accessToken,
      refreshToken,
      userId,
      username: username.value,
      email: res.data.user?.email,
      currentTenantId,
      tenantCode: null,
    });
    // OAuth 2.0 code 回跳：把 code+state 原样透传给 RP 的 redirect_uri。
    // 用 setTimeout(0) 让 Vue 先把 store 写入的 re-render 跑完之后再做导航，
    // 避免与路由跳转竞争（saas-nextjs / saas-react 同款）。
    setTimeout(async () => {
      if (oauthReturn.value) {
        try {
          const target = new URL(oauthReturn.value.redirectUri);
          target.searchParams.set("code", oauthReturn.value.code);
          if (oauthReturn.value.state)
            target.searchParams.set("state", oauthReturn.value.state);
          window.location.href = target.toString();
        } catch (err) {
          console.error("[SSO/login] oauth redirect build failed:", err);
          toast.error("OAuth 回跳 URL 构造失败");
        }
        return;
      }
      // 2026-08-29 OAuth 跳板: 用户手动输密码登录 (无 ?code= 但有 ?redirect_uri=&state=&client_id=),
      // 登录成功后调 saas /api/v1/oauth/authorize 拿 code 跳回 RP (不跳 /tenants)。
      // 镜像 onMounted 跳板分支,但触发点是 onSubmit 而非 hydrate。
      const sp = new URLSearchParams(window.location.search);
      const redirectUri = sp.get("redirect_uri");
      const state = sp.get("state") ?? "";
      const clientId = sp.get("client_id") ?? "";
      if (redirectUri && clientId) {
        try {
          const authRes = await authorizeMut.mutateAsync({
            data: {
              clientId,
              redirectUri,
              responseType: "code",
              scope: "lab.read lab.write",
              state,
            },
          });
          const target = new URL(redirectUri);
          target.searchParams.set("code", authRes.data.code);
          if (state) target.searchParams.set("state", state);
          window.location.href = target.toString();
        } catch (err) {
          console.error("[SSO/login] oauth authorize (after submit) failed:", err);
          // 兜底:留在登录页(让用户重试)
          return;
        }
        return;
      }
      router.push("/tenants");
    }, 0);
  } catch (err) {
    const apiErr = toApiError(err);
    // M01.F04.I02 - 423 = 失败锁定（shared LockedAccountResponse）
    if (apiErr.status === 423 && apiErr.body?.lockedUntil) {
      lockoutUntil.value = new Date(apiErr.body.lockedUntil);
      startLockoutTicker();
      toast.error(`账号已被锁定，请 ${lockoutRemaining.value ?? "15 分钟"} 后再试`);
      return;
    }
    const msg =
      apiErr.status === 423
        ? "账号已被锁定，请 15 分钟后再试"
        : apiErr.status === 401
          ? "用户名或密码错误"
          : apiErr.status === 0
            ? `后端不可达（${apiMode}）：${apiErr.message}`
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
        <CardTitle class="text-lg">SaaS 多租户多应用身份平台</CardTitle>
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
          <!-- M01.F04.I02 — 锁定倒计时（共享契约 LockedAccountResponse.lockedUntil） -->
          <div
            v-if="lockoutRemaining"
            data-testid="lockout-countdown"
            class="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
            role="alert"
          >
            账号已锁定，剩余 <span class="font-mono font-semibold">{{ lockoutRemaining }}</span> 后可重试
          </div>
          <Button
            type="submit"
            class="w-full"
            :disabled="loginMut.isPending.value || lockoutRemaining !== null"
            data-fn="M01.F04.I03"
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
                    >南荣相如</code
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
                    >@南荣相如</code
                  >，查看置顶笔记</span
                >
              </li>
            </ul>
          </div>

          <p class="text-xs text-slate-400">
            当前后端模式：<span class="font-medium text-slate-700">{{ apiMode }}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
