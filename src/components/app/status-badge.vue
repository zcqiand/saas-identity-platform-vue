<script setup lang="ts">
// StatusBadge — semantic color for tenant/user/api-key/audit status.

import Badge from "../ui/badge.vue";

type Status = "active" | "suspended" | "archived" | "invited" | "disabled" | "revoked" | "expired";

const VARIANT: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  invited: "outline",
  suspended: "secondary",
  disabled: "secondary",
  archived: "secondary",
  revoked: "destructive",
  expired: "destructive",
};

const LABEL_ZH: Record<Status, string> = {
  active: "活跃",
  invited: "已邀请",
  suspended: "已暂停",
  disabled: "已禁用",
  archived: "已归档",
  revoked: "已吊销",
  expired: "已过期",
};

interface Props {
  status: Status;
}

const props = defineProps<Props>();
</script>

<template>
  <Badge :variant="VARIANT[props.status]" class="font-normal">
    {{ LABEL_ZH[props.status] }}
  </Badge>
</template>
