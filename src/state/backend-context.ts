// Backend Pinia store — 运行时后端切换（msw / aspnetcore / springboot）。
//
// 设计：
//   - localStorage["saas.backend"] 持久化配置
//   - store 首次 useBackendStore() 时 hydrate 进模块级单例（api/backend-config.ts）
//   - setBackend / setBaseUrl 同步写单例 + localStorage
//   - 非 msw 后端：fetch 走对应 baseUrl；MSW worker 不启用（mocks/browser.ts 看 getBackend() 决定）
//   - msw 后端：fetch 同源，worker 拦截
//
// 与 react 仓 src/state/backend-context.tsx 1:1 对称；跨仓 src/api/backend-config.ts 是模块级单例共享源。

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  BACKEND_DEFAULT_BASE_URLS,
  hydrateBackendConfig,
  snapshotBackendConfig,
  type BackendMode,
} from "../api/backend-config";

const STORAGE_KEY = "saas.backend";

interface PersistedConfig {
  backend?: BackendMode;
  baseUrls?: Partial<Record<BackendMode, string>>;
}

function loadPersisted(): PersistedConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedConfig;
    return {
      backend: parsed.backend,
      baseUrls: parsed.baseUrls,
    };
  } catch {
    return {};
  }
}

function savePersisted(value: PersistedConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export const useBackendStore = defineStore("backend", () => {
  // lazy initializer：store 首次 useBackendStore() 时同步从 localStorage 读
  // 同时 hydrate 进模块级单例（backend-config.ts），否则 axios 拦截器拿到的 baseUrl 还是默认 msw
  const initial = (() => {
    const persisted = loadPersisted();
    hydrateBackendConfig(persisted);
    return {
      backend: (persisted.backend ?? "msw") as BackendMode,
      baseUrls: {
        ...BACKEND_DEFAULT_BASE_URLS,
        ...(persisted.baseUrls ?? {}),
      },
    };
  })();

  const backend = ref<BackendMode>(initial.backend);
  const baseUrls = ref<Record<BackendMode, string>>(initial.baseUrls);

  function setBackend(mode: BackendMode): void {
    backend.value = mode;
    import("../api/backend-config").then(({ setBackend: setSingleton }) => {
      setSingleton(mode);
      savePersisted(snapshotBackendConfig());
    });
  }

  function setBaseUrl(mode: BackendMode, url: string): void {
    baseUrls.value = { ...baseUrls.value, [mode]: url };
    import("../api/backend-config").then(({ setBaseUrlFor: setUrl, snapshotBackendConfig: snap }) => {
      setUrl(mode, url);
      savePersisted(snap());
    });
  }

  function resetBaseUrls(): void {
    baseUrls.value = { ...BACKEND_DEFAULT_BASE_URLS };
    import("../api/backend-config").then(({ snapshotBackendConfig: snap }) => {
      savePersisted(snap());
    });
  }

  return {
    backend,
    baseUrls,
    baseUrl: computed(() => baseUrls.value[backend.value]),
    setBackend,
    setBaseUrl,
    resetBaseUrls,
  };
});