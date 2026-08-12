<template>
  <router-view name="header" />
  <router-view />
</template>

<script setup lang="ts"></script>

<style>
/* Minimal scaffold styles — full Tailwind v4 + shadcn-vue in later iteration */
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