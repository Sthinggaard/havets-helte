<template>
  <AppShell>
    <RouterView />
  </AppShell>
  <div id="modal-root"></div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppShell from './components/AppShell.vue';
</script>
