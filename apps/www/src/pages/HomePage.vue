<template>
  <SignupLandingPage v-if="eventId" section="event" />
  <HomeWorkspace v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import HomeWorkspace from '@/components/home/HomeWorkspace.vue';
import SignupLandingPage from '@/components/public/SignupLandingPage.vue';

const route = useRoute();
const eventId = computed(() => (typeof route.query.event === 'string' ? route.query.event : ''));
</script>
