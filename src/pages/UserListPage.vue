<template>
  <div style="padding: 24px">
    <h1>用户管理（M01.F01）— tenant {{ tenantId?.slice(0, 8) }}</h1>
    <button data-fn="M01.F01.I02" style="margin-bottom: 12px">+ 邀请用户</button>
    <table style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th>用户名</th>
          <th>邮箱</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id" data-testid="user-row">
          <td>{{ u.username }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.status }}</td>
          <td>
            <button data-fn="M01.F01.I06">分配角色</button>
            <button data-fn="M01.F01.I04" style="margin-left: 8px">编辑</button>
            <button data-fn="M01.F01.I05" style="margin-left: 8px">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface UserRow {
  id: string;
  username: string;
  email: string;
  status: "active" | "invited" | "suspended" | "disabled";
}

const props = defineProps<{ tenantId?: string }>();
const tenantId = props.tenantId;
const users: UserRow[] = [
  { id: "u1", username: "alice", email: "alice@acme.io", status: "active" },
  { id: "u2", username: "bob", email: "bob@acme.io", status: "invited" },
];
</script>