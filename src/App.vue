<script setup lang="ts">
// Vue 仓 AppShell 顶层壳：
// - /login 路由外面直接挂 LoginPage（绕过 AppShell）
// - 其他路由全部包裹 AppShell，AppShell 内提供 sidebar + header + 内容
//
// 单 <router-view /> 顶层渲染：vue-router 4 嵌套路由模式下，
// AppShell 内的 <router-view /> 渲染 children。
</script>

<template>
  <router-view />
</template>
