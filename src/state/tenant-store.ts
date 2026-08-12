// Pinia tenant store — current tenant + JWT + user + login/logout flow.
//
// 设计：
//   - localStorage["saas.tenant"] 持久化整个 session
//   - store 首次 useTenantStore() 时同步 hydrate（lazy initializer，避免守卫误判）
//   - login / logout / setTenant / clear 同时更新 ref + localStorage
//   - isAuthenticated 由 accessToken + user 派生（守卫用）
//
// 与 react 仓 src/state/tenant-context.tsx 1:1 对称。

import { defineStore } from "pinia";
import { computed, ref } from "vue";

const STORAGE_KEY = "saas.tenant";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

interface PersistedSession {
  currentTenantId: string | null;
  tenantCode: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

function emptySession(): PersistedSession {
  return {
    currentTenantId: null,
    tenantCode: null,
    accessToken: null,
    refreshToken: null,
    user: null,
  };
}

function loadSession(): PersistedSession {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as PersistedSession;
    return {
      currentTenantId: parsed.currentTenantId ?? null,
      tenantCode: parsed.tenantCode ?? null,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return emptySession();
  }
}

function saveSession(s: PersistedSession): void {
  if (typeof window === "undefined") return;
  if (!s.accessToken || !s.user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export const useTenantStore = defineStore("tenant", () => {
  // lazy initializer：store 第一次 useTenantStore() 时同步从 localStorage 读
  const session = ref<PersistedSession>(loadSession());

  function persist(next: PersistedSession): void {
    session.value = next;
    saveSession(next);
  }

  function login(payload: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    username: string;
    email?: string;
    currentTenantId: string;
    tenantCode?: string | null;
  }): void {
    persist({
      currentTenantId: payload.currentTenantId,
      tenantCode: payload.tenantCode ?? null,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: { id: payload.userId, username: payload.username, email: payload.email },
    });
  }

  async function logout(): Promise<void> {
    // 调 /auth/logout（best-effort；非 msw 模式下后端可能没实现，吞错）
    const token = session.value.accessToken;
    if (token) {
      try {
        const { apiRequest } = await import("../api/http-client");
        await apiRequest("/api/v1/auth/logout", { method: "POST" }, token);
      } catch {
        /* best-effort */
      }
    }
    persist(emptySession());
  }

  function setTenant(id: string | null, code: string | null, token: string | null): void {
    // 仅切换租户上下文，保留 user + refreshToken + accessToken（除非显式给 token）
    persist({
      ...session.value,
      currentTenantId: id,
      tenantCode: code,
      accessToken: token ?? session.value.accessToken,
    });
  }

  function clear(): void {
    persist(emptySession());
  }

  const isAuthenticated = computed(() =>
    Boolean(session.value.accessToken && session.value.user),
  );

  return {
    // state（Pinia setup 自动 unwrap refs）
    currentTenantId: computed(() => session.value.currentTenantId),
    tenantCode: computed(() => session.value.tenantCode),
    accessToken: computed(() => session.value.accessToken),
    refreshToken: computed(() => session.value.refreshToken),
    user: computed(() => session.value.user),
    isAuthenticated,
    // actions
    login,
    logout,
    setTenant,
    clear,
  };
});