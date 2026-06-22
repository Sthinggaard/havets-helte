<template>
  <div class="page-stack">
    <PageCard>
      <template #header>
        <div>
          <p class="eyebrow">Vue scaffold</p>
          <h1 class="page-title">Forældrehelte får en rigtig app-struktur</h1>
        </div>
      </template>

      <p class="lead">
        Denne version er den første Vue-fundamentering. Den bevarer den eksisterende
        Firebase-side, men flytter den nye struktur over i en route-baseret app.
      </p>
    </PageCard>

    <div class="grid-cards">
      <PageCard v-for="card in homeHighlights" :key="card.title">
        <p class="card-kicker">{{ card.eyebrow }}</p>
        <h2 class="card-title">{{ card.title }}</h2>
        <p class="card-copy">{{ card.copy }}</p>
      </PageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { homeHighlights } from '@/features/home/homeHighlights';
</script>
