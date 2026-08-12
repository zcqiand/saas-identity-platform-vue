<template>
  <div style="padding: 24px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <h1 style="margin: 0">审计日志（M06.F01）— tenant {{ props.tenantId?.slice(0, 8) }}</h1>
      <button data-fn="M06.F01.I03" @click="exportCsv" style="padding: 6px 12px">导出 CSV</button>
    </div>
    <p v-if="isLoading" data-testid="loading">加载中…</p>
    <table v-else data-testid="audit-table" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">时间</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">动作</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd">操作者</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in events" :key="e.id" data-testid="audit-row">
          <td style="padding: 8px">{{ e.occurredAt }}</td>
          <td style="padding: 8px">{{ AUDIT_ACTION_LABELS[e.action] ?? e.action }}</td>
          <td style="padding: 8px">{{ e.actorUserId }}</td>
        </tr>
        <tr v-if="events.length === 0">
          <td colspan="3" style="padding: 16px; text-align: center; color: #888" data-testid="empty">还没有审计事件</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTenantAuditListAuditEvents } from "../api/endpoints/endpoints";
import type { AuditEvent } from "../api/endpoints/endpoints.schemas";

const props = defineProps<{ tenantId?: string }>();

const AUDIT_ACTION_LABELS: Record<string, string> = {
  user_created: "创建用户",
  user_updated: "更新用户",
  user_deleted: "删除用户",
  login_success: "登录成功",
  login_failed: "登录失败",
  oauth_token_issued: "签发令牌",
  api_key_created: "创建 API Key",
  api_key_revoked: "吊销 API Key",
  role_assigned: "分配角色",
  role_revoked: "撤销角色",
};

const list = useTenantAuditListAuditEvents(computed(() => props.tenantId ?? ""));

const isLoading = computed(() => list.isLoading.value);
const events = computed<AuditEvent[]>(() => list.data.value?.data?.items ?? []);

function exportCsv() {
  // M06.F01.I03 — 由后端生成 CSV，前端只触发下载链接（实际链接由 msw handler 返）
  alert(`导出 CSV（M06.F01.I03）— 共 ${events.value.length} 条`);
}
</script>