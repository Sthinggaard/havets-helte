<template>
  <section v-if="leaders.length" class="event-leaders" aria-label="Ansvarlige ledere">
    <h2>{{ leaders.length === 1 ? 'Ansvarlig leder' : 'Ansvarlige ledere' }}</h2>
    <ul><li v-for="leader in leaders" :key="leader.id">{{ leader.name }}</li></ul>
  </section>
</template>

<script setup lang="ts">
import type { EventLeader } from '@/features/eventAdmin/eventLeaders';
defineProps<{ leaders: EventLeader[] }>();
</script>

<style scoped>
.event-leaders { margin-bottom: 24px; color: var(--text); }
.event-leaders h2 { margin: 0 0 8px; color: var(--navy); font-size: 18px; font-weight: 700; }
.event-leaders ul { display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 0; padding: 0; list-style: none; }
.event-leaders li { max-width: 100%; font-size: 16px; overflow-wrap: anywhere; }
</style>
