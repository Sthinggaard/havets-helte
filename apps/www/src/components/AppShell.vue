<template>
  <div class="app-frame app-frame--landing">
    <AppNavigation />

    <template v-if="!isLanding && !isAttendance">
      <main class="page-shell" :class="{ 'page-shell--dashboard': isAdminDashboard }">
        <slot />
      </main>
    </template>

    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AppNavigation from './AppNavigation.vue';

const route = useRoute();
const isLanding = computed(() => route.meta.shell === 'landing');
const isAttendance = computed(() => route.meta.shell === 'attendance');
const isAdminDashboard = computed(() => route.name === 'admin');
</script>
