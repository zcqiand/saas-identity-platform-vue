<template>
  <router-view name="header" />
  <main style="min-height: calc(100vh - 80px)">
    <router-view />
  </main>
  <BackendSwitcher />
</template>

<script setup lang="ts">
import BackendSwitcher from "./components/backend-switcher.vue";
</script>

<style>
:root {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #111;
}
</style>