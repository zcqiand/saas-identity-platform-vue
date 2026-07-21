// @entry M06.F08.I01
// @entry M06.F08.I01
// @entry M06.F08.I01
// @entry M06.F08.I01
<script setup lang="ts">
// 平台配置（对齐 React PlatformConfig.tsx）：平台信息只读展示。
// 静态只读（与 React 仓一致）；后续可接 /platform/config 接口做可编辑配置。
</script>

<template>
  <div data-fn="M06.F08.I01" class="space-y-6 max-w-2xl">
    <h2 class="text-2xl font-bold">平台配置</h2>

    <!-- 平台信息只读展示 -->
    <section class="bg-white rounded shadow p-6 space-y-4">
      <h3 class="text-base font-semibold text-gray-700 border-b pb-2">平台信息</h3>
      <dl class="grid grid-cols-2 gap-4 text-sm">
        <dt class="text-gray-500">平台名称</dt>
        <dd class="font-medium">SaaS IAM 统一身份管理平台</dd>
        <dt class="text-gray-500">版本</dt>
        <dd class="font-mono text-xs">v1.2-011</dd>
        <dt class="text-gray-500">功能模块</dt>
        <dd>多租户 / RBAC / SSO / 审计日志 / 应用管理 / 菜单管理</dd>
      </dl>
    </section>
  </div>
</template>
