<template>
  <div style="padding: 24px">
    <h1>租户管理（M00.F01）</h1>
    <button data-fn="M00.F01.I02" style="margin-bottom: 12px">+ 新建租户</button>
    <table style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th>Code</th>
          <th>名称</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tenants" :key="t.id" data-testid="tenant-row">
          <td>{{ t.code }}</td>
          <td>{{ t.name }}</td>
          <td>{{ t.status }}</td>
          <td>
            <button data-fn="M00.F01.I04">编辑</button>
            <button data-fn="M00.F01.I05" style="margin-left: 8px">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Tenant {
  id: string;
  code: string;
  name: string;
  status: "active" | "suspended" | "archived";
}

const tenants: Tenant[] = [
  { id: "t1", code: "acme", name: "ACME Corp", status: "active" },
  { id: "t2", code: "globex", name: "Globex", status: "active" },
];
</script>