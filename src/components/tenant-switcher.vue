<template>
  <div data-testid="tenant-switcher" style="padding: 8px 16px; border-bottom: 1px solid #eee">
    <label style="margin-right: 8px">当前租户:</label>
    <select :value="tenantStore.currentTenantId ?? ''" @change="onSwitch" data-fn="M00.F02.I03">
      <option value="" disabled>请选择</option>
      <option v-for="m in memberships" :key="m.id" :value="m.tenantId">
        {{ m.tenantId.slice(0, 8) }}…
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTenantStore } from "../state/tenant-store";

interface Membership {
  id: string;
  tenantId: string;
  roleIds: string[];
  status: "active" | "invited" | "removed";
}

const tenantStore = useTenantStore();
const router = useRouter();
const memberships = ref<Membership[]>([]);

onMounted(async () => {
  tenantStore.hydrate();
  // M00.F02.I02 — list current user memberships
  memberships.value = [
    {
      id: "m1",
      tenantId: "00000000-0000-0000-0000-000000000001",
      roleIds: [],
      status: "active",
    },
  ];
});

function onSwitch(e: Event) {
  const tenantId = (e.target as HTMLSelectElement).value;
  // M00.F02.I03 — switch tenant via POST /api/me/tenants/{tenantId}/switch
  tenantStore.setTenant(tenantId, null, "mock-token-" + tenantId);
  router.push(`/tenants/${tenantId}/users`);
}
</script>