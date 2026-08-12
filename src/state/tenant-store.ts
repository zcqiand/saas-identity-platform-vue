// Pinia tenant store — current tenant, JWT, switch action
import { defineStore } from "pinia";

const STORAGE_KEY = "saas.tenant";

interface TenantState {
  currentTenantId: string | null;
  tenantCode: string | null;
  accessToken: string | null;
}

export const useTenantStore = defineStore("tenant", {
  state: (): TenantState => ({
    currentTenantId: null,
    tenantCode: null,
    accessToken: null,
  }),
  actions: {
    hydrate() {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const v = JSON.parse(raw);
        this.currentTenantId = v.currentTenantId ?? null;
        this.tenantCode = v.tenantCode ?? null;
        this.accessToken = v.accessToken ?? null;
      } catch {
        /* ignore */
      }
    },
    setTenant(id: string | null, code: string | null, token: string | null) {
      this.currentTenantId = id;
      this.tenantCode = code;
      this.accessToken = token;
      if (id && token) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ currentTenantId: id, tenantCode: code, accessToken: token }),
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    clear() {
      this.setTenant(null, null, null);
    },
  },
});