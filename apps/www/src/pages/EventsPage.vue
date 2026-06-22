<template>
  <div class="page-stack">
    <PageCard>
      <template #header>
        <div>
          <p class="eyebrow">Arrangementer</p>
          <h1 class="page-title">Event-route</h1>
        </div>
      </template>
      <div class="stacked-list">
        <article
          v-for="event in eventSummaries"
          :key="event.title"
          class="list-row"
        >
          <div>
            <h2 class="row-title">{{ event.title }}</h2>
            <p class="row-copy">{{ event.meta }}</p>
          </div>
          <span class="pill">{{ event.status }}</span>
        </article>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { eventSummaries } from '@/features/events/eventSummaries';
</script>
