<script setup lang="ts">
// M06.F01 — tenant-scoped 审计日志（只读）

import { computed } from "vue";
import { useRoute } from "vue-router";
import { useTenantAuditListAuditEvents } from "../api/endpoints/endpoints";
import type { AuditEvent } from "../api/endpoints/endpoints.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue"
import CardHeader from "../components/ui/card-header.vue"
import CardTitle from "../components/ui/card-title.vue"
import Badge from "../components/ui/badge.vue";
import Table from "../components/ui/table.vue";
import TableBody from "../components/ui/table-body.vue"
import TableCell from "../components/ui/table-cell.vue"
import TableHead from "../components/ui/table-head.vue"
import TableHeader from "../components/ui/table-header.vue"
import TableRow from "../components/ui/table-row.vue"
import PageHeader from "../components/app/page-header.vue";
import { toast } from "vue-sonner";
import { getTenant } from "@saas/identity-platform-msw";

const ACTION_LABEL: Record<string, string> = {
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

const ACTION_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  user_created: "default",
  user_updated: "outline",
  login_success: "default",
  login_failed: "outline",
  api_key_created: "default",
  api_key_revoked: "secondary",
  role_assigned: "outline",
  role_revoked: "secondary",
};

const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
const tenantLabel = computed(() => {
  const id = tenantId.value;
  const tenant = id ? getTenant(id) ?? null : null;
  return tenant ? `租户 ${tenant.name}（${tenant.code}）` : "租户未知";
});

const q = useTenantAuditListAuditEvents(tenantId);
const events = computed<AuditEvent[]>(() => q.data.value?.data?.items ?? []);

function exportCsv() {
  // M06.F01.I03 — 由后端生成 CSV，前端只触发下载链接（实际链接由 msw handler 返）
  toast.success(`导出 CSV（M06.F01.I03）— 共 ${events.value.length} 条`);
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="审计日志" :description="`${tenantLabel} 的操作事件流`">
      <template #actions>
        <Button data-fn="M06.F01.I03" @click="exportCsv">导出 CSV</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle>事件 ({{ events.length }})</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <div v-if="!q.data.value && q.isLoading" class="p-8 text-center text-sm text-slate-400">
          加载中…
        </div>
        <div v-else-if="events.length === 0" class="p-8 text-center text-sm text-slate-400">
          暂无审计事件
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>动作</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>目标</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="e in events" :key="e.id">
              <TableCell class="text-slate-500 tabular-nums">
                {{ new Date(e.occurredAt).toLocaleString("zh-CN") }}
              </TableCell>
              <TableCell>
                <Badge :variant="ACTION_VARIANT[e.action] ?? 'outline'">
                  {{ ACTION_LABEL[e.action] ?? e.action }}
                </Badge>
              </TableCell>
              <TableCell class="font-mono text-xs">
                {{ e.actorUserId?.slice(-12) ?? "—" }}
              </TableCell>
              <TableCell class="font-mono text-xs">
                {{ e.targetUserId?.slice(-12) ?? "—" }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
