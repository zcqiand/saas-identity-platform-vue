<template>
  <div style="padding: 24px">
    <h1>API Key（M05.F01）— tenant {{ tenantId?.slice(0, 8) }}</h1>
    <button data-fn="M05.F01.I02" style="margin-bottom: 12px">+ 创建 Key</button>
    <table style="width: 100%; border-collapse: collapse">
      <thead><tr><th>名称</th><th>前缀</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="k in keys" :key="k.id">
          <td>{{ k.name }}</td>
          <td>{{ k.prefix }}</td>
          <td>{{ k.status }}</td>
          <td>
            <button data-fn="M05.F01.I04">轮换</button>
            <button data-fn="M05.F01.I03" style="margin-left: 8px">吊销</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tenantId?: string }>();
const keys = [{ id: "k1", name: "Prod Key", prefix: "sk_live", status: "active" }];
</script>